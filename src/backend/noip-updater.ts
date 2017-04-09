import * as Process from 'process';
import * as path from 'path';
import * as fs from 'fs';
import { MyPublicIPChecker } from './MyPublicIpChecker';
import { NoIpUpdater } from './NoIpUpdater';

const myHostname = 'bitkitchen.org';

const getNoIpAuthConfigFilePath : () => string = () => path.resolve(Process.env['HOME'], '.bitkitchen.org/noip.auth');
const getNoIpAuth : () => string = () => fs.readFileSync(getNoIpAuthConfigFilePath(), { encoding: 'utf8' });

let checker : MyPublicIPChecker = new MyPublicIPChecker('80.98.191.217');
let updater : NoIpUpdater = new NoIpUpdater(getNoIpAuth());

const check : () => void = () => {
    checker.check().then((result) => {
        console.log("checked: ", result);
        if (MyPublicIPChecker.isNewIp(result)) {
            updater.update(myHostname, result).then((result) => {
                console.log('Result of update:', result);
                setTimeout(() => {
                    check();
                }, 2000);
            }, (errorMessage) => {
                console.log('Error: ', errorMessage, 'stopping...');
            });
        }
    }, (error) => {
        console.log("Error: ", error);
    });
}

check();
