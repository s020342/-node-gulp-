export class Student {
    firstName: string;
    lastName: string;

    constructor(fiestName: string, lastName: string) {
        this.firstName = fiestName;
        this.lastName = lastName;
    }

    greeter() {
        return "Hello，您好" + this.firstName + " " + this.lastName;
    }
}

  
