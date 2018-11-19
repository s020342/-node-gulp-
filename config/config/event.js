var event = {
    obj: {},
    on(event, num, cb) {
        if (this.obj[event]) {
            this.obj[event].push({
                [num]: cb
            })
        } else {
            this.obj[event] = [{
                [num]: cb
            }]
        }
    },
    emit(event, ...rest) {
        for (const key in this.obj) {
            if (this.obj.hasOwnProperty(key) && key == event) {
                const arr = this.obj[key];
                arr.forEach((item) => {
                    let cb = Object.values(item)[0]
                    cb(...rest)
                });
            }
        }
    },
    destroyedCB(event, num) {
        var arr = this.obj[event].filter((i) => {
            let key = Object.keys(i)[0]
            if (key != num) {
                return true
            } else {
                return false
            }
        })
        this.obj[event] = arr
    },
    destroyed(event) {
        delete this.obj[event]
    }
}
module.exports = event