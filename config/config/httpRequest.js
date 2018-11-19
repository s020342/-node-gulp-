var querystring = require("querystring")
var url = require("url")
var app = {
    cbArr: [],
    get(path, cb) {
        this.cbArr.push({ type: "get", path, cb })
    },
    post(path, cb) {
        this.cbArr.push({ type: "post", path, cb })
    },
    run: (req, res, next) => {

        let state = app.cbArr.some((i) => {
            if (url.parse(req.url).pathname == i.path) {
                if (i.type == "get") {

                    res.writeHead(200, {
                        "Content-type": "application/json;charset=UTF-8",
                        "Access-Control-Allow-Origin": "*"
                    });
                    let resObj = {
                        ...res,
                        send(text) {
                            res.write(JSON.stringify(text))
                            res.end()
                        }
                    }
                    let reqObj = {
                        ...req,
                        query: querystring.parse(url.parse(req.url).query)
                    }
                    i.cb(reqObj, resObj, next)


                } else {

                    var postData = "";
                    req.addListener("data", function(data) {
                        postData += data;
                    });
                    /**
                     * 这个是如果数据读取完毕就会执行的监听方法
                     */
                    res.writeHead(200, {
                        "Content-type": "application/json;charset=UTF-8",
                        "Access-Control-Allow-Origin": "*"
                    });
                    let resObj = {
                        ...res,
                        send(text) {
                            res.write(JSON.stringify(text))
                            res.end()
                        }
                    }
                    req.addListener("end", function() {

                        var reqObj = {
                            ...req,
                            body: querystring.parse(postData)
                        };
                        i.cb(reqObj, resObj, next);
                    });

                }

                return true
            } else {
                return false
            }

        })

        if (!state) {
            next()
        }
    }
}

module.exports = app