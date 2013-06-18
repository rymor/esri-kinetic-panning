define(["dojo/_base/declare", "dojo/_base/lang", "dojo/_base/sniff", "esri", "esri/map", "esri/MapNavigationManager", "esri/MouseEvents", "esri/TouchEvents", "esri/utils", "esri/geometry", "esri/symbol", "esri/graphic", "esri/fx"], function(declare, lang, sniff, esri, esriMap, MapNavigationManager, mouseEvents, touchEvents) {

	return declare("utils.KineticPanning", null, {

		// map:	esri/Map
		//	Reference the to map object
		map : null,

		// deceleration: double
		//	The multiplier that is applied to the velocity during each kinetic pan interval
		deceleration : 0.85,

		// displacementMouseMultiplier: double
		//	Multiplier for calcultaing the initial kinectic panning velocity when using mouse events.  The higher the number, the further and longer the pan will last
		//	Values 2 - 20 tend to work the best for mouse events
		displacementMouseMultiplier : 10.0,

		// displacementTouchMultiplier: double
		//	Multiplier for calcultaing the initial kinectic panning velocity when using touch events.  The higher the number, the further and longer the pan will last
		//	Values 15 - 40 tend to work the best for touch events
		displacementTouchMultiplier : 25.0,

		// minEndVelocity: double
		//	The number at which the kinetic panning will stop when below the minimum threshold
		minEndVelocity : 0.1,

		// eventModel: string
		//	The type of event model being used, set automatically.  (touch || mouse)
		eventModel : null,

		// _dragInterval: Interval
		//	The interval used for when the user is panning.  Interval is used to calculate the current velocity
		_dragInterval : null,

		// _dragIntervalDuration: int
		//		Duration of each _dragInterval
		_dragIntervalDuration : 50,

		// _kineticPanInterval: int
		//	Interval used for kinetic panning
		_kineticPanInterval : null,

		// _kineticPanIntervalDuration: int
		//	Duration of each _kineticPanInterval
		_kineticPanIntervalDuration : 15,

		// _mouseEnabled: Boolean
		//	Indicates whether the mouse events are enabled
		_mouseEnabled : false,

		// _touchEnabled: Boolean
		//	Indicates whether the touch events are enabled
		_touchEnabled : false,

		// _doKineticPanning: Boolean
		_doKineticPanning : false,

		// xVelocity: double
		//	Current x directional velocity
		xVelocity : 0,

		// yVelocity: double
		//	Current y directional velocity
		yVelocity : 0,

		constructor : function(map) {
			this.map = map;

			this._initEventModel();

			this._initDragIntervalDuration();

			// need to override the base _panInit to end any kinetic panning.
			// needs to be terminated before it internally calls its _initStart and _panStart
			this.map.navigationManager._panInit = lang.hitch(this, function(e) {
				var justKilled = false;
				if (this.isKineticPanning) {
					// kill kinetic panning when mouseDrag occurs
					this._kineticPanEnd();
					justKilled = true;
				}

				// call base init
				esri.MapNavigationManager.prototype._panInit.call(this.map.navigationManager, e);

				if (justKilled)
					// need to manually kickoff panStart
					this.map.navigationManager._panStart(e);
			});

			this.map.navigationManager._swipeInit = lang.hitch(this, function(e) {
				if (this.isKineticPanning) {
					// kill kinetic panning when mouseDrag occurs
					this._kineticPanEnd();
				}

				// call base init
				esri.MapNavigationManager.prototype._swipeInit.call(this.map.navigationManager, e);
			});
		},
		// _initEventModel
		//	Create touch and mouse event models.
		_initEventModel : function() {
			if (esri.isTouchEnabled) {
				this.touchEvents = new touchEvents(this.map.__container, {
					map : this.map
				});
				this.eventModel = "touch";
				this.enableTouch();
				
				// override _fire event, we don't want it to dispatch events to map since MapNavigator already handles this
				this.touchEvents._fire = lang.hitch(this.touchEvents, function(type, e) {
					if (this[type]) {
						this[type](e);
					}
				});
			} else {
				this.mouseEvents = new mouseEvents(this.map.__container, {
					map : this.map
				});
				this.eventModel = "mouse";
				
				// override _fire event, we don't want it to dispatch events to map since MapNavigator already handles this
				this.mouseEvents._fire = lang.hitch(this.mouseEvents, function(type, e) {
					if (this[type]) {
						this[type](e);
					}
				});
				this.enableMouse();
			}
		},
		// _initDragIntervalDuration
		//	When using legacy browers, need to lower the drag interval duration
		//	used for calculating velocity
		_initDragIntervalDuration : function() {
			if (this._isLegacyBrowser())
				this._dragIntervalDuration = this._dragIntervalDuration / 5;
		},
		enableTouch : function() {
			if (!this._touchEnabled) {
				this._touchEnabled = true;

				this._touchSwipeStartHandle = dojo.connect(this.touchEvents, 'onSwipeStart', this, this._onMouseDragStart);
				this._touchSwipeHandle = dojo.connect(this.touchEvents, "onSwipeMove", this, this._onMouseDrag);
				this._touchSwipeEndHandle = dojo.connect(this.touchEvents, "onSwipeEnd", this, this._onMouseDragEnd);
				this._touchSwipeExtentChangeHandle = dojo.connect(this.map, 'onExtentChange', this, this._kineticPanStart);
			}
		},
		disableTouch : function() {
			if (this._touchEnabled) {
				this._touchEnabled = false;

				dojo.disconnect(this._touchSwipeStartHandle);
				dojo.disconnect(this._touchSwipeHandle);
				dojo.disconnect(this._touchSwipeEndHandle);
				dojo.disconnect(this._touchSwipeExtentChangeHandle);

				this._touchSwipeStartHandle = this._touchSwipeHandle = this._touchSwipeEndHandle = this._touchSwipeExtentChangeHandle = null;
			}
		},
		enableMouse : function() {
			if (!this._mouseEnabled) {
				this._mouseEnabled = true;

				this._mouseDragStartHandle = dojo.connect(this.mouseEvents, 'onMouseDragStart', this, this._onMouseDragStart);
				this._mouseDragHandle = dojo.connect(this.mouseEvents, 'onMouseDrag', this, this._onMouseDrag);
				this._mouseDragEndHandle = dojo.connect(this.mouseEvents, 'onMouseDragEnd', this, this._onMouseDragEnd);
				this._mouseExtentChangeHandle = dojo.connect(this.map, 'onExtentChange', this, this._kineticPanStart);
			}
		},
		disableMouse : function() {
			if (this._mouseEnabled) {
				this._mouseEnabled = false;

				dojo.disconnect(this._mouseDragStartHandle);
				dojo.disconnect(this._mouseDragHandle);
				dojo.disconnect(this._mouseDragEndHandle);
				dojo.disconnect(this._mouseExtentChangeHandle);

				this._mouseDragStartHandle = this._mouseDragHandle = this._mouseDragEndHandle = this._mouseExtentChangeHandle = null;
			}
		},
		// _onMouseDragStart
		//	Initialize kinetic pan properties
		_onMouseDragStart : function(e) {
			this._mouseDragEvt = this._mouseDragStartEvt = e;
			this._doKineticPanning = true;
			this._lastDragEvt = e;

			// Calcute the init velocity for the kinetic panning,
			// only base it off the last interval before dragging ends.
			if (!this._isLegacyBrowser())
				this._dragInterval = setInterval(lang.hitch(this, function() {
					//console.log("setInterval");
					this._setInitVelocity();
				}), this._dragIntervalDuration);
		},
		// _onMouseDrag
		//	Capture mouse drag event for calculating initial kinetic pan velocity
		_onMouseDrag : function(e) {
			this._mouseDragEvt = e;

			// ie8 and below is too slow to calc velocity w/ setInterval,
			// use mouse drag event instead to get a starting estimate velocity
			if (this._isLegacyBrowser()) {
				this._setInitVelocity();
			}
		},
		// _onMouseDragEnd
		//	Capture mouse drag end event for starting point of kinetic pan
		_onMouseDragEnd : function(e) {
			this._mouseDragEndEvt = e;

			// don't kick off pan here, introduces lag on older devices, use extentChange event instead
			//this._kineticPanStart();
		},
		// _kineticPanStart
		//	Kicks of the kinetic panning, sets needed intervals to perform animation
		_kineticPanStart : function(extent, e) {
			if (this._doKineticPanning) {
				clearInterval(this._dragInterval);

				if (this.xVelocity !== 0 && this.yVelocity !== 0) {
					var startPoint = {
						screenPoint : this._mouseDragEvt.screenPoint
					};

					// manually kick off map nav panning
					this.map.navigationManager._panInit(startPoint);
					this.map.navigationManager._panStart(startPoint);

					this._doKineticPanning = false;
					this.isKineticPanning = true;

					this._curPanningPoint = {
						screenPoint : this._mouseDragStartEvt.screenPoint
					};

					this._kineticPanInterval = setInterval(lang.hitch(this, function() {
						this._kineticPan();
					}), this._kineticPanIntervalDuration);
				}
			}
		},
		// _kineticPan
		//	Performs one iteration of the kinetic panning
		_kineticPan : function() {
			// decrease velocity
			this.xVelocity *= this.deceleration;
			this.yVelocity *= this.deceleration;

			// set new points
			this._curPanningPoint.screenPoint.x += this.xVelocity;
			this._curPanningPoint.screenPoint.y += this.yVelocity;

			// do the pan
			this.map.navigationManager._pan(this._curPanningPoint);

			if (!this._continuePanning())
				this._kineticPanEnd();
		},
		// _kineticPanEnd
		//	Ends the kinetic pan animation
		_kineticPanEnd : function() {
			if (this._kineticPanInterval)
				clearInterval(this._kineticPanInterval);

			if (this._kineticTimeout)
				clearTimeout(this._kineticTimeout);

			this.isKineticPanning = false;
			this.map.navigationManager._panEnd(this._curPanningPoint);
		},
		// _continuePanning
		//	Determines if the kinnetic panning animation should continue
		// returns:	Boolean
		_continuePanning : function() {
			return (Math.abs(this.xVelocity) > this.minEndVelocity || Math.abs(this.yVelocity) > this.minEndVelocity);
		},
		// _calculateInitVelocity
		//	Sets the starting velocity for the kinetic panning
		_setInitVelocity : function() {
			this.xVelocity = this._calculateInitVelocity(this._lastDragEvt.screenPoint.x, this._mouseDragEvt.screenPoint.x);
			this.yVelocity = this._calculateInitVelocity(this._lastDragEvt.screenPoint.y, this._mouseDragEvt.screenPoint.y);

			this._lastDragEvt = this._mouseDragEvt;
		},
		// _calculateInitVelocity
		//	Calculates the starting velocity for the kinetic panning
		_calculateInitVelocity : function(/*int*/start, /*int*/end) {
			if (start === end)
				return 0;
			else {
				var displacementMultiplier;
				if (this.eventModel === "touch")
					displacementMultiplier = this.displacementTouchMultiplier;
				else
					displacementMultiplier = this.displacementMouseMultiplier;

				// endPoint - startPoint / duration
				return ((end - start) * displacementMultiplier) / this._dragIntervalDuration;
			}

		},
		// _isLegacyBrowser
		// returns:	Boolean
		_isLegacyBrowser : function() {
			return sniff("ie") < 9;
		}
	});
});
