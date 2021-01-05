var gulp = require('gulp');
var fs = require('fs-extra');
var path = require('path');
var spawn = require('child_process').spawn;
var del = require('del');
const os = require('os');

const BUILD_DIR = path.join(__dirname, './lib/');

const tsc = (cb) => {
    spawn(path.normalize(`./node_modules/.bin/tsc${/^win/.test(os.platform()) ? '.cmd' : ''}`), ['-p', 'tsconfig.json'], {
        stdio: 'inherit'
    }).on('close', function (err) {
        if (err) {
            var err = new Error('TypeScript compiler failed');
            err.showStack = false;
            cb(err);
        } else {
            cb();
        }
    });
}

const cleanup = (cb) => {
    if (fs.existsSync(BUILD_DIR)) del.sync(BUILD_DIR, {force: true})
    cb()
}

const distribute = (src, dest) => {
    return gulp.src(src).
        pipe(gulp.dest(`${BUILD_DIR + (dest || '')}`));
}

const addPackageJson = () => distribute('package.json');
const addTemplates = () => distribute('./src/templates/**', 'templates');

const addWatcher = () => {
    return gulp.watch('./src', tsc)
}

const appendFiles = gulp.parallel(addPackageJson, addTemplates)

const build = gulp.series(cleanup, tsc, appendFiles)

exports.watch = addWatcher;
exports.default = build;