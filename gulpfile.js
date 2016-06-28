var gulp = require('gulp'),
    fs = require("fs"),
    through2 = require('through2'),
    path = require('path'),
    source = require('vinyl-source-stream'),
    marked = require('gulp-marked');
    gulpLoadPlugins = require('gulp-load-plugins'),
    $ = gulpLoadPlugins({lazy: true})
    config = require('./gulp.config')();
gulp.task('readBuffer', function() {
    return gulp.src('app/index.jsp')
    .pipe(modify(swapStuff))
    .pipe(modify(swapStuff_))
    .pipe(gulp.dest('dist/'));

})
function modify(modifier) {
    return through2.obj(function(file, encoding, done) {
        var content = modifier(String(file.contents));
        file.contents = new Buffer(content);
        this.push(file);
        done();
    });
}
function swapStuff(data) {
    return data.replace(/\$\{pageContext\.request\.contextPath\s*\}/g, '..');
}
function swapStuff_(data) {
    return data.replace(/window\.ContextPath \= \"\.\.\/\"/, 'window.ContextPath = "${pageContext.request.contextPath}/"')
               .replace(/base\shref\=\"\.\.\/\"/,'base href="dist/"');
}
gulp.task('optimize',['readBuffer'],function() {
   return gulp
            .src('dist/index.jsp')
            .pipe($.useref())  // 解析jsp中build，将里面引用到的文件合并传过来
            .pipe($.if('js/app.js', $.ngAnnotate()))
            .pipe($.if('js/*.js', $.uglify()))
            .pipe($.if('css/*.css', $.minifyCss()))
            .pipe($.if('!index.jsp', $.rev()))
            .pipe($.revReplace())
            .pipe(gulp.dest(config.build))
            .pipe($.rev.manifest())
            .pipe(gulp.dest('dist/rev/'));
});
gulp.task('rev', ['optimize'],function() {
    return gulp.src(['dist/rev/*.json', 'dist/index.jsp'])  
        .pipe($.revCollector())                                   
        .pipe(gulp.dest(config.build));                     
});
gulp.task('images', function() {
  return gulp
      .src(config.images)
      /*.pipe(gulp.dest(config.build))*/
      .pipe($.rename(function(path) {
        path.dirname = path.dirname.replace(/.*\\images(.*)/, 'images$1');
        path.dirname = path.dirname.replace(/.*\\img(.*)/, 'img$1');
      }))
    .pipe(gulp.dest(config.build + 'images/'));
});
gulp.task('default', ['rev','images']);

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    var options = {read: false};
    if (label) {
        options.name = 'inject:' + label;
    }

    return $.inject(orderSrc(src, order), options);
}
