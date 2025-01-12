const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const less = require("gulp-less");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const htmlmin = require('gulp-htmlmin');
const sync = require("browser-sync").create();
const del = require("del");
const terser = require('gulp-terser');
const rename = require("gulp-rename");
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const newer = require('gulp-newer');
const newerForWebUp = require('gulp-newer');
const path = require('path');
const cheerio = require('gulp-cheerio');

// Styles

const styles = () => {
  return gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}

exports.styles = styles;

// HTML

const html = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'))
    .pipe(sync.stream());
};

exports.html = html;

// Scripts

const scripts = () => {
  return gulp.src('./source/js/Script.js')
    .pipe(sourcemap.init())
    .pipe(terser())
    .pipe(rename('script.min.js'))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest('./build/js'))
    .pipe(sync.stream());
}

exports.scripts = scripts;

// copyScripts

const copyScripts = () => {
  return gulp.src("source/js/*.{min.js,min.js.map}")
  .pipe(gulp.dest("build/js"))
}

exports.copyScripts = copyScripts;

//Image

const optimizeImages = () => {
  return gulp.src("source/img/**/*.{jpg,png,svg}")
    .pipe(newer("build/img"))
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"))
}

exports.optimizeImages = optimizeImages;

// copyImages

const copyImages = () => {
  return gulp.src("source/img/*.{jpg,png,svg}")
  .pipe(gulp.dest("build/img"))
}

// copyCSS

const copyCSS = () => {
  return gulp.src("source/css/*.{css,map}")
  .pipe(gulp.dest("build/css"))
}

exports.copyCSS = copyCSS;

// copyFonts

const copyFonts = () => {
  return gulp.src("source/fonts/*.ttf")
  .pipe(gulp.dest("build/fonts"))
}

exports.copyFonts = copyFonts;

// WebP

const createWebp = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
        .pipe(newerForWebUp("build/img/*.webP"))
        .pipe(webp({quality: 90}))
        .pipe(gulp.dest('build/img'))
}

exports.createWebp = createWebp;

// Sprite

const sprite = () => {
  return gulp
      .src("source/img/icons/*.svg")
// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
// cheerio plugin create unnecessary string '&gt;', so replace it.
		// .pipe(replace('&gt;', '>'))
    .pipe(svgmin((file) => {
          const prefix = path.basename(file.relative, path.extname(file.relative));
          return {
              plugins: [{
                  cleanupIDs: {
                      prefix: prefix + '-',
                      minify: true
                  }
              }]
          }
      }))
      .pipe(svgstore())
      .pipe(rename("sprite.svg"))
      .pipe(gulp.dest('build/img'));
};

exports.sprite = sprite;

// Clean

const cleanBuild = () => {
  return del(["build", "!build/img", "!build/fonts"]);
};

exports.cleanBuild = cleanBuild;

//build

const build = gulp.series(
  cleanBuild,
  styles,
  copyCSS,
  copyFonts,
  html,
  scripts,
  copyScripts,
  copyImages,
  createWebp,
  sprite
);

exports.build = build;


// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  gulp.watch("build/*.html").on("change", sync.reload);
  gulp.watch("source/less/**/*.less", styles);
  gulp.watch("source/js/Script.js", scripts);
  gulp.watch("source/*.html", html);
  done();
}

exports.server = server;

// Watcher

const watcher = () => {
  gulp.watch("source/less/**/*.less", gulp.series("styles"));
  gulp.watch("source/*.html").on("change", sync.reload);
}

exports.default = gulp.series(
  cleanBuild, styles, copyCSS, copyFonts, html, scripts, copyScripts, copyImages, createWebp, sprite ,server, watcher
);