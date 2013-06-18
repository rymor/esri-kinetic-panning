esri-kinetic-panning
====================

Kinetic panning for esri maps.  Works with mouse and touch enabled devices.  

Uses amd style loading.

###Usage
To add kinetic panning to a map, simple add the following:

    var panning = new kineticPanning(map);

To enable/disable kinetic panning for mouse/touch devices call the following:

    panning.enableMouse();
    panning.disableMouse();
    
    panning.enableTouch();
    panning.disableTouch();
    
You can alter the amount of kinetic panning applied with the displacementMultiplier attributes (`displacementTouchMultiplier` and `displacementMouseMultiplier`).  You will tend to want a higher values when using a touch enabled device.  Defaults are set to 10 for mouse and 25 for touch devices.
    
    panning.displacementMouseMultiplier = 10;

###Example
View the live demo at http://rymor.github.io/esri-kinetic-panning/examples/index.html

View the source at https://github.com/rymor/esri-kinetic-panning/examples

###ESRI API Supported Versions
Tested with versions 3.3 - 3.5

###Devices and Browsers
* Tested on iPhone 5 and iPad 1 & 3.
* Tested on FF, Chrome, Safari and IE 8, 9 19

###Known Issues
* Tends to be sluggish on iPad gen 1

###Release Notes

