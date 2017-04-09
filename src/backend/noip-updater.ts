import { MyPublicIPChecker } from './MyPublicIpChecker';

let checker : MyPublicIPChecker = new MyPublicIPChecker();

const check : () => void = () => {
    checker.check().then((result) => {
        console.log("checked: ", result);
        setTimeout(() => {
            check();
        }, 2000);
    }, (error) => {
        console.log("Error: ", error);
    });
}

check();
