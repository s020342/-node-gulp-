var gulp = require('gulp');
var browserify = require('gulp-browserify'); //模块化的打包
var uglify = require('gulp-uglify'); //js的压缩
var concat = require('gulp-concat'); //文件合并
var sass = require('gulp-sass'); //sass编译
// var less = require('gulp-less');//less编译
var cleanCSS = require('gulp-clean-css'); //css的压缩
var rev = require('gulp-rev'); //- 对文件名加MD5后缀
var revCollector = require('gulp-rev-collector'); //- 路径替换
var sequence = require('gulp-sequence');
var htmlmin = require('gulp-htmlmin'); //html压缩为一行
var autoprefixer = require('gulp-autoprefixer'); //自动添加浏览器前缀
const config = require("./config.js")



//js模块化打包
gulp.task("BuildJsModule", () => {
        ///所有页面相关的ts全部再ts/page页面之下,/获取页面引入的js文件
        try {
            console.log(path.resolve(config.build.ts.browserifyEntry))
            var arr = fs.readdirSync(path.resolve(config.build.ts.browserifyEntry)).map((i) => {
                return config.build.ts.browserifyEntry + "/" + i
            })
        } catch (error) {
            console.log(error)
        }
        //基于ts的模块化打包进行监听的//每次检测到ts文件改变后，进行重新打包
        function everyBundle(file, filename) {
            watchify(browserify({
                    debug: true,
                    entries: [file],
                }).plugin(tsify))
                .transform('babelify', {
                    presets: ['es2015'],
                    extensions: ['.ts']
                })
                .bundle()
                .pipe(source(filename + ".bundle.js"))
                .pipe(buffer())
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(uglify())
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest(config.build.ts.output))
        }
        //针对页面引入的ts文件依次进行打包
        arr.forEach((entry) => {
            let reg = /(\w+)\.ts$/g
            let filename = entry.match(reg)[0].split(".")[0]
            everyBundle(entry, filename)
        });

    })
    // js检测
gulp.task("BuildJsEslint", function() {
        gulp.src(config.build.js.entry)
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.results(results => {
                // Called once for all ESLint results.
                console.log(`Total Results: ${results.length}`);
                console.log(`Total Warnings: ${results.warningCount}`);
                console.log(`Total Errors: ${results.errorCount}`);
            }))

    })
    //sass编译
gulp.task("Buildsass", () => {
        gulp.src(config.build.sass.entry)
            .pipe(sass())
            .pipe(autoprefixer({
                borwsers: ['last 2 versions', 'Android > 4.0']
            }))

        .pipe(rev()) //md5加密
            .pipe(gulp.dest(config.build.sass.output)) //输出到本地的路径
            .pipe(rev.manifest()) //- 生成一个rev-manifest.json
            .pipe(gulp.dest(`${config.build.path}/rev/sass`)) //将re-manifest.json存放到的路径
            .on("end", () => {
                gulp.src([`${config.build.path}/rev/sass/*.json`, `${config.build.page.output}/**/*.html`]) //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
                    .pipe(revCollector({
                        replaceReved: true,

                    })) //- 执行文件内css名的替换
                    .pipe(gulp.dest(config.build.page.output)); //- 替换后的文件输出的目录
            })
    })
    //css拷贝
gulp.task("BuildcssCopy", () => {
    gulp.src(config.build.css.entry)

    .pipe(autoprefixer({
            borwsers: ['last 2 versions', 'Android > 4.0']
        }))
        .pipe(rev()) //md5加密
        .pipe(gulp.dest(config.build.sass.output)) //输出到本地的路径
        .pipe(rev.manifest()) //- 生成一个rev-manifest.json
        .pipe(gulp.dest(`${config.build.path}/rev/css`)) //将re-manifest.json存放到的路径
        .on("end", () => {
            gulp.src([`${config.build.path}/rev/css/*.json`, `${config.build.page.output}/**/*.html`]) //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
                .pipe(revCollector({
                    replaceReved: true,

                })) //- 执行文件内css名的替换
                .pipe(gulp.dest(config.build.page.output)); //- 替换后的文件输出的目录
        })
})

//static拷贝
gulp.task("BuildstaticCopy", () => {
    gulp.src(config.build.static.entry)
        .pipe(gulp.dest(config.build.static.output))
})

//html拷贝
gulp.task("BuildhtmlCopy", () => {
    gulp.src(config.build.page.entry)
        .pipe(gulp.dest(config.build.page.output))
})




gulp.task("build", ["Buildsass", "BuildcssCopy", "BuildstaticCopy", "BuildhtmlCopy"], () => {
    config.esLint.esLintUse ? sequence(['BuildJsEslint', "BuildJsModule"], () => {

    }) : sequence(['BuildJsModule'], () => {

    })
})