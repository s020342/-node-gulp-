var fs = require("fs")
var path = require("path")
var event = require("./event.js")

function dirToObjectHandle(url) {

    let obj = null
    try {
        //检测路径在不在
        fs.accessSync(url)
        obj = {}

        function every(url, obj) {
            try {

                let arr = fs.readdirSync(url)
                arr.forEach((i) => {
                    // console.log(url + "/" + i)
                    let pathUrl = path.join(url, "./", i)
                    let stats = fs.statSync(pathUrl)
                    if (stats.isDirectory()) {

                        obj[i] = {}
                        every(pathUrl, obj[i])
                    } else {
                        obj[i] = fs.readFileSync(pathUrl)
                    }
                })
            } catch (error) {
                console.log(error)
                return
            }
        }
        every(url, obj)

    } catch (error) {
        console.log("删除文件" + url)
    }
    return obj
}
//使用js的描述属性，实现数据劫持，并实现多次相同事件的，取一次执行
let changeObj = {
    type: ""
};
var fValue;
Object.defineProperties(changeObj, {
    file: {
        get() {
            return fValue
        },
        set(newVal) {
            fValue = newVal
            event.emit("load")
            changeObj.type = ""
        },
        configurable: true,
        enumerable: true,
    }
})

function watchFileToObject(type, file, url) {
    // console.log(type, file)
    if (changeObj.type != type) {
        changeObj.type = type
        changeObj.file = file
    }
    var arr = file.split(/\\/)
    var changeFile = arr[arr.length - 1]
    let MSF = dirToObject.MSF
        //删除js命令
    let deleteFile = "delete MSF"
        //增加文件的js命令
    let addFile = `MSF`

    arr.forEach((i) => {
            //删除js命令的拼接
            deleteFile += `['${i}']`
                //增加文件的js命令拼接
            if (i == changeFile) {
                if (dirToObjectHandle(path.join(url, "./", file))) {
                    // console.log(dirToObjectHandle(path.join(url, "./", file)))
                    addFile += `['${i}']=dirToObjectHandle(path.join(url, "./",file))`
                }
            } else {
                addFile += `['${i}']`
            }
        })
        //如果类型为rename，则有如下情况，增加文件或文件夹，改变文件或文件夹名字，删除文件或者文件夹名字，
        //如果是这些类型，将文件名在对象中的属性删除
    if (type == "rename") {
        eval(deleteFile)

    }
    eval(addFile)

}



function watch(url) {
    let state = true
    fs.watch(url, { recursive: true }, (type, file) => {

        //判断是文件夹及增删，改名（rename），还是文件改变（change）  
        //如果是文件改变，只执行一次
        if (type == "rename") {
            var dir = file
                //如果是文件路径，则返回文件所在的目录
            if (path.extname(file)) {
                dir = path.dirname(file)
            }
            watchFileToObject(type, dir, url)
        } else {
            if (state && path.extname(file)) {
                //如果是文件路径，则返回文件所在的目录
                let dir = path.dirname(file)
                watchFileToObject(type, dir, url)
            }
            state = !state
        }
    })
}

let dirToObject = {
    MSF: {},
    init(url) {
        dirToObject.MSF = dirToObjectHandle(url)
            // console.log(dirToObject.MSF)
        watch(url)
    }
}

module.exports = dirToObject