import * as Process from 'process';
import * as path from 'path';
import * as fs from 'fs';
import * as Immutable from 'immutable';

import { logger } from './Logger';
import { MyPublicIpChecker, createMyPublicIpChecker } from './MyPublicIpChecker';
import { NoIpUpdater } from './NoIpUpdater';

logger.log('info', 'process id: %d', Process.pid);

interface Configuration {
    checker: {
        initialIp: string,
        checkIntervall : number,
        impl: string
    },
    updater: {
        auth : string
    }
}

const myHostnames = Immutable.List.of('bitkitchen.org', 'mail.bitkitchen.org', 'www.bitkitchen.org');

const getConfigFilePath : () => string = () => path.resolve(Process.env['HOME'], '.bitkitchen.org/noip-config.json');
const configuration : Configuration = (() => JSON.parse(fs.readFileSync(getConfigFilePath(), { encoding: 'utf8' })))();


let checker : MyPublicIpChecker = createMyPublicIpChecker(configuration.checker.impl, configuration.checker.initialIp);
let updater : NoIpUpdater = new NoIpUpdater(configuration.updater.auth);

const updateFirstHost : (hostnameList : Immutable.List<string>) => Promise<boolean> =
    (hostnameList) => {
        return updater.update(hostnameList.first()).then((result) => {
            logger.log('info', 'Result of update: ' + result);
            let nextList = hostnameList.shift();
            if (nextList.size > 0) {
                return updateFirstHost(nextList);
            } else {
                return true;
            }
        }, (errorMessage) => {
         logger.log('error', errorMessage + ' stopping...');
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
        logger.log('error', error);
        return error.errno === 'EAI_AGAIN';
    }).then((isToBeContinued) => {
        if (isToBeContinued) {
            setTimeout(chainedCheck, configuration.checker.checkIntervall);
        } else {
            logger.log('info', `Exiting...`);
        }
    });
}

chainedCheck();
