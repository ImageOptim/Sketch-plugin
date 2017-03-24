'use strict';
var babelify    = require('babelify')
var browserify  = require('browserify')
var copy        = require('recursive-copy')
var del         = require('del')
var expandTilde = require('expand-tilde')
var fs          = require('fs')
var fse         = require('fs-extra')
var gulp        = require('gulp')
var path        = require('path')
var runSequence = require('run-sequence')
var source      = require('vinyl-source-stream')
var uglify      = require("gulp-uglify")

var SKETCH_PLUGINS_FOLDER = path.join(expandTilde('~'), '/Library/Application Support/com.bohemiancoding.sketch3/Plugins');

var ManifestProcessorOptions = {
  pluginManifestDescriberName: 'SketchPlugin',
  startingManifestTag: '__$begin_of_manifest_\n',
  endingManifestTag: '__$end_of_manifest_\n',
  scriptFileName: 'plugin.js',
  globalVarName: '__globals'
};

var currentManifest = {};

function extractManifestObject() {
  var data = fs.readFileSync(path.join(__dirname, 'build', ManifestProcessorOptions.scriptFileName), 'utf8');
  var startTag = ManifestProcessorOptions.startingManifestTag;
  var endTag = ManifestProcessorOptions.endingManifestTag;

  var startIndex = data.indexOf(startTag);
  var endIndex = data.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    return;
  }

  return JSON.parse(data.substring(startIndex + startTag.length, endIndex));
}
function normalizePluginFileName() {
  return currentManifest.name + '.sketchplugin';
}

gulp.task('clean', function () {
  return del(['build', 'dist']);
});

gulp.task('prepare-manifest', function (callback) {
  var manifest = extractManifestObject();
  fse.outputJsonSync(path.join(__dirname, 'build/manifest.json'), manifest);
  currentManifest = manifest;
  callback(null);
});

gulp.task('prepare-folders', function (callback) {
  if (!fs.existsSync(path.join(__dirname, 'build'))) {
    fs.mkdirSync(path.join(__dirname, 'build'))
  }
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'))
  }
  callback()
});

gulp.task('assemble-plugin-bundle', function (callback) {

  var bundlePath = path.join(__dirname, 'dist', normalizePluginFileName());
  var script = fs.readFileSync(path.join(__dirname, 'build', ManifestProcessorOptions.scriptFileName), 'utf8');
  script = ["var " + ManifestProcessorOptions.globalVarName + " = this;", script].join("");

  fse.outputJson(path.join(bundlePath, 'Contents', 'Sketch', 'manifest.json'), currentManifest, function(){
    fse.outputFile(path.join(bundlePath, 'Contents', 'Sketch', ManifestProcessorOptions.scriptFileName), script, callback)
  })
});

gulp.task('install-plugin', function (callback) {
  copy('dist', SKETCH_PLUGINS_FOLDER, { overwrite: true }, function(error, results){
    console.log('Plugin installed')
    callback()
  })
});

gulp.task('build', function (callback) {
  runSequence('clean', 'prepare-folders', 'bundle', 'prepare-manifest', 'uglify', 'assemble-plugin-bundle', 'install-plugin', callback);
});

gulp.task('bundle', function () {
  var filePath = './src/plugin.js';
  var extensions = ['.js'];

  var bundler = browserify({
    entries: [filePath],
    extensions: extensions,
    debug: false
  });

  bundler.transform("babelify",{
    global: true,
    presets: ["es2015"],
    plugins: [
      "transform-es2015-constants",
      "transform-es2015-block-scoping",
      "transform-es2015-arrow-functions",
      "transform-es2015-block-scoped-functions",
      ["babel-plugin-sketch-manifest-processor", ManifestProcessorOptions]
    ]
  });

  return bundler.bundle()
    .pipe(source(ManifestProcessorOptions.scriptFileName))
    .pipe(gulp.dest('./build/'))

});

gulp.task('uglify', function() {
  return gulp.src('build/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('build/'))
})

gulp.task('watch', function () {
  runSequence('build', function () {
    gulp.watch('./src/**/*.*', function () {
      console.log("Watching...");
      runSequence('clean', 'build', function () {
        console.log("Rebuild complete!");
      });
    });
  });
});

gulp.task('default', function (callback) {
  runSequence('build', callback);
});
