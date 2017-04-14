import * as Process from 'process';
import * as path from 'path';
import * as fs from 'fs';
import * as Immutable from 'immutable';
import { MyPublicIpChecker } from './MyPublicIpChecker';
import { NoIpUpdater } from './NoIpUpdater';

interface Configuration {
    initialIp: string,
    checkIntervall : number,
    auth : string
}

const myHostnames = Immutable.List.of('bitkitchen.org', 'mail.bitkitchen.org', 'www.bitkitchen.org');

const getConfigFilePath : () => string = () => path.resolve(Process.env['HOME'], '.bitkitchen.org/noip-config.json');
const configuration : Configuration = (() => JSON.parse(fs.readFileSync(getConfigFilePath(), { encoding: 'utf8' })))();

let checker : MyPublicIpChecker = new MyPublicIpChecker(configuration.initialIp);
let updater : NoIpUpdater = new NoIpUpdater(configuration.auth);

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
        if (MyPublicIpChecker.isNewIp(result)) {
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
            setTimeout(chainedCheck, configuration.checkIntervall);
        }
    });
}

chainedCheck();
