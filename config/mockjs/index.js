var app = require("../config/httpRequest.js")
app.get("/api/list", (req, res, next) => {
    console.log(req.query)
    res.send({
        code: "3344"
    })
})

app.post("/api/detail", (req, res, next) => {
    console.log(req.body)
    res.send("详情")
})

module.exports = app.run