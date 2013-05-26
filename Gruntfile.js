module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		jshint : {
			files : ['dojoConfig.js', 'config.js', 'index.js', 'gruntfile.js', 'bcmvcd/**/*.js', 'tests/dijits/*.js', 'gic/**/*.js'],
			options : {
				smarttabs : true,
				white : false,
				globals : {
					console : true,
					module : true,
					document : true
				}
			}
		},
		open : {
			test : {
				path : 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/_SpecRunner.html'
			},
			docs : {
				path : 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/docs/'
			},
			examples : {
				path : 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/examples/'
			}
		},
		connect : {
			test : {},
			docs : {},
			examples : {},
			all : {
				options : {
					keepalive : true
				}
			},
			options : {
				hostname : '127.0.0.1',
				port : 8020,
				keepalive : false
			}
		},
		jasmine : {
			src : 'dojoConfig.js',
			options : {
				specs : ['tests/dijits/*.js', 'gic/tests/**/*.js'],		
				outfile : 'asdf.html'
				//vendors :  'https://serverapi.arcgisonline.com/jsapi/arcgis/?v=3.2'
				//vendors :  ['dojoConfig.js', 'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=3.2']
				//host : 'http://127.0.0.1:8020/'
			}
		},
		watch : {
			files : ['src/**/*.js', 'examples/**/*.js', 'gruntfile.js'],
			tasks : ['jshint', 'jasmine:src']
		}
	});

	grunt.loadNpmTasks('grunt-open');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-connect');

	//grunt.registerTask('test', ['jshint']);

	//grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

	grunt.registerTask('default', ['test']);
	//grunt.registerTask('test', ['connect:test', 'jasmine:all', 'jasmine:all:build', 'open:test', 'watch:test']);
	grunt.registerTask('test', ['jshint', 'jasmine:src', 'watch']);

};
