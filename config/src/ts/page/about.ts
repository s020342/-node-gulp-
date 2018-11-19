import {Student} from "../common/student"
var user = new Student("王", "about");
console.log(document.getElementById("app"))
    document.getElementById("app").innerHTML = user.greeter();
