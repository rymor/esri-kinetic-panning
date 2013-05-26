module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		jshint : {
			files : ['src/**/*.js', 'examples/**/*.js', 'examples/**/*.js', 'specs/**/*.js', 'gruntfile.js'],
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
		jasmine : {
			src : 'dojoConfig.js',
			options : {
				specs : 'specs/*.js'	
			}
		},
		watch : {
			files : ['src/**/*.js', 'examples/**/*.js', 'gruntfile.js'],
			tasks : ['jshint', 'jasmine:src']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	grunt.registerTask('default', ['test']);
	grunt.registerTask('test', ['jshint', 'jasmine:src', 'watch']);

};
