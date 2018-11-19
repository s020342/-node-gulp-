import {Student} from "../common/student"
var user = new Student("王", "你好");
console.log(document.getElementById("app"))
    document.getElementById("app").innerHTML = user.greeter();
