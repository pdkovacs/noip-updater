import * as Process from 'process';
import * as path from 'path';
import * as fs from 'fs';
import * as Immutable from 'immutable';
import { MyPublicIPChecker } from './MyPublicIpChecker';
import { NoIpUpdater } from './NoIpUpdater';

const myHostnames = Immutable.List.of('bitkitchen.org', 'mail.bitkitchen.org', 'www.bitkitchen.org');
const checkIntervall = 5000;

const getNoIpAuthConfigFilePath : () => string = () => path.resolve(Process.env['HOME'], '.bitkitchen.org/noip.auth');
const getNoIpAuth : () => string = () => fs.readFileSync(getNoIpAuthConfigFilePath(), { encoding: 'utf8' }).trim();

let checker : MyPublicIPChecker = new MyPublicIPChecker('80.98.191.21');
let updater : NoIpUpdater = new NoIpUpdater(getNoIpAuth());


const updateFirstHost : (hostnameList : Immutable.List<string>) => Promise<boolean> =
    (hostnameList) => {
        return updater.update(hostnameList.first()).then((result) => {
            console.log('Result of update:', result);
            let nextList = hostnameList.shift();
            if (nextList.size > 0) {
                return updateFirstHost(nextList);
            } else {
                return true;
            }
        }, (errorMessage) => {
            console.log('Error: ', errorMessage, 'stopping...');
            return false;
        });    
    }

const chainedCheck : () => void = () => {
    checker.check().then((result) => {
        if (MyPublicIPChecker.isNewIp(result)) {
            return updateFirstHost(myHostnames);
        } else {
            return true;
        }
    }, (error) => {
        console.log("Error: ", error);
        return false;
    }).then((isToBeContinued) => {
        console.log(`isToBeContinued=${isToBeContinued}`);
        if (isToBeContinued) {
            setTimeout(chainedCheck, checkIntervall);
        }
    });
}

chainedCheck();
