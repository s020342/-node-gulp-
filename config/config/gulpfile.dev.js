const url = require("url")
var gulp = require('gulp');
var webserver = require('gulp-webserver'); //web服务热启动
var sass = require('gulp-sass'); //sass编译
var autoprefixer = require('gulp-autoprefixer'); //自动添加浏览器前缀
var sequence = require('gulp-sequence'); //gulp启动任务的命令
var chokidar = require('chokidar'); //文件监听
const eslint = require('gulp-eslint');
var source = require('vinyl-source-stream'); //模块化打包插件，用来输出打包或编译后文件的
var tsify = require("tsify"); //将ts文件进行es5规范转换的
var sourcemaps = require('gulp-sourcemaps'); //将打包的js文件，以sourceMap形式创建sourcemap文件
var buffer = require('vinyl-buffer'); //转换buffer的
var watchify = require("watchify"); //监听ts文件改变
var uglify = require('gulp-uglify'); //压缩js文件的
var browserify = require("browserify");

var MemoryFileSystem = require("memory-fs"); //js内存中进行数据存储
var MFS = new MemoryFileSystem();
const config = require("./config.js")
var fs = require("fs")
var path = require("path")
var tap = require('gulp-tap');
let server = require("./server")
var event = require("./event")
let memory = {}

//将文件写入对象
function toObject(file, t, type) {
    let reg = new RegExp(`src\\\\${type}`)
    let dirArr = file.path.split(reg)[1].split(/\\/).slice(1)
    let dirPath = dirArr[dirArr.length - 1] //文件名
    let str = config.dev[type].output //文件所在文件夹路径
    dirArr.slice(0, dirArr.length - 1).forEach((i) => {
        str += "/" + i
    })

    MFS.mkdirpSync(str);
    if (file.contents && file.contents.length > 0) {
        MFS.writeFileSync(str + "/" + dirPath, file.contents.toString("utf-8"));
    }
    // console.log(MFS.data.devSrc.css)
}

var state = true

//ts模块化打包
gulp.task("tsModule", () => {

    ///所有页面相关的ts全部再ts/page页面之下,/获取页面引入的js文件
    try {
        // console.log(path.resolve(config.dev.ts.browserifyEntry))
        var arr = fs.readdirSync(path.resolve(config.dev.ts.browserifyEntry)).map((i) => {
            return config.dev.ts.browserifyEntry + "/" + i
        })
    } catch (error) {
        console.log(error)
    }
    //基于ts的模块化打包进行监听的//每次检测到ts文件改变后，进行重新打包
    function everyBundle(file, filename) {
        return new Promise((resolve, reject) => {
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
                .pipe(tap(function(file, t) {

                    let reg = /typescriptHandle\\/

                    //page中文件名
                    let dirPath = file.path.split(reg)[1]

                    MFS.mkdirpSync(config.dev.ts.output);
                    if (file.contents && file.contents.length > 0) {
                        MFS.writeFileSync(config.dev.ts.output + "/" + dirPath, file.contents.toString("utf-8"));
                    }
                    resolve()
                        // console.log(MFS.data.devSrc)
                }))



        })

    }
    //针对页面引入的ts文件依次进行打包
    let arrPromise = []
        // console.log()
    arr.forEach((entry) => {
        console.log(entry)
        let reg = /(\w+)\.ts$/g
        let filename = entry.match(reg)[0].split(".")[0]
        console.log(filename)
        arrPromise.push(everyBundle(entry, filename))
    });

    Promise.all(arrPromise).then(() => {
        // console.log(MFS.data.devSrc)
        if (state) {
            sequence(["htmlCopyServer"], () => {})
            state = false
        } else {
            event.emit("load")
        }

    })
})

//sass编译
gulp.task("sass", () => {
        gulp.src(config.dev.sass.entry)
            .pipe(sass())
            .pipe(autoprefixer({
                borwsers: ['last 2 versions', 'Android > 4.0']
            }))
            .pipe(tap(function(file, t) {
                toObject(file, t, "sass")
            }))
            .pipe(gulp.dest(config.dev.sass.output))
            .on("end", () => {
                //代表所有sass文件编译完成
                console.log(MFS.data.devSrc.css)
                    // event.emit("load")
            })
    })
    //css拷贝
gulp.task("cssCopy", () => {
    gulp.src(config.dev.css.entry)
        .pipe(autoprefixer({
            borwsers: ['last 2 versions', 'Android > 4.0']
        }))
        .pipe(tap(function(file, t) {
            toObject(file, t, "css")
        }))
        .pipe(gulp.dest(config.dev.css.output))
        .on("end", () => {
            //代表所有css文件编译完成
            event.emit("load")
        })
})

//static拷贝
gulp.task("staticCopy", () => {
        gulp.src(config.dev.static.entry)
            .pipe(tap(function(file, t) {
                toObject(file, t, "static")
            }))
            .pipe(gulp.dest(config.dev.static.output))
            .on("end", () => {
                //代表所有static文件编译完成
                event.emit("load")
            })
    })
    //html拷贝
gulp.task("htmlCopyServer", () => {

        gulp.src(config.dev.page.entry)
            .pipe(tap(function(file, t) {
                toObject(file, t, "page")
            }))
            .pipe(gulp.dest(config.dev.page.output))
            .on('end', () => {
                // console.log(MFS)
                // 只有监听到html复制完毕，才会启动服务

                console.log("服务启动")
                server({
                    MSF: MFS.data.devSrc,
                    open: config.dev.open,
                    host: config.dev.host,
                    port: config.dev.port,
                    middleware: require("../mockjs/index.js")
                })

            });
    })
    //html拷贝
gulp.task("htmlCopy", () => {
    gulp.src(config.dev.page.entry)
        .pipe(tap(function(file, t) {

            toObject(file, t, "page")
        }))
        .pipe(gulp.dest(config.dev.page.output))
        .on("end", () => {
            event.emit("load")
        })
})


gulp.task("taskListen", () => {
    //html文件的监听
    chokidar.watch(config.dev.page.entry).on("all", () => {
            sequence(['htmlCopy'], () => {})
        })
        //sass文件的监听
    chokidar.watch(config.dev.sass.entry).on("all", () => {
            sequence(['sass'], () => {})
        })
        //css文件的监听
    chokidar.watch(config.dev.css.entry).on("all", () => {
            sequence(['cssCopy'], () => {})
        })
        //js文件的监听
    chokidar.watch(config.dev.ts.entry).on("all", () => {

            sequence(["tsModule"], () => {})
        })
        //static文件的监听
    chokidar.watch(config.dev.static.entry).on("all", () => {
        sequence(['staticCopy'], () => {})
    })
})

gulp.task("Copy", ["sass", "cssCopy", "staticCopy", "tsModule"], () => {

    console.log("初次启动进行文件拷贝")
})

gulp.task("dev", () => {

    sequence(['Copy'], () => {

    })


    sequence(['taskListen'], () => {
        console.log("监听成功")
    })

})


process.on("uncaughtException", (err) => {

    console.log(err)
})