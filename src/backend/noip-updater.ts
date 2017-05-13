import * as Process from 'process';
import * as Immutable from 'immutable';

import { logger } from './Logger';
import { configuration as config, watcher as configFileWatcher } from './Configuration';
import { ERROR_TYPE, ActionResult, RetryTimer } from './RetryTimer';
import { MyPublicIpChecker, createMyPublicIpChecker } from './MyPublicIpChecker';
import { NoIpUpdater } from './NoIpUpdater';

logger.log('info', 'process id: %d', Process.pid);
let checker : MyPublicIpChecker = createMyPublicIpChecker(config.data.checker.impl, config.data.checker.initialIp);
let updater : NoIpUpdater = new NoIpUpdater(config.data.updater.auth);
let ipCheckRetrier : RetryTimer = new RetryTimer("ip-check",
        config.data.checker.error.retryIntervall,
        config.data.checker.error.maxRetryCount,
        () => {
            return new Promise((resolve, reject) => {
                checker.check().then((result) => {
                    resolve(new ActionResult(result, null, null));
                }, (error) => {
                    logger.log('error', error);
                    let errorType : ERROR_TYPE;
                    switch(error.errno) {
                        case 'EAI_AGAIN':
                        case 'ENOTFOUND':
                            errorType = ERROR_TYPE.TransientError;
                            break;
                        default:
                            errorType = ERROR_TYPE.PersistentError;
                    }
                    resolve(new ActionResult(null, error, errorType));
                });
            });
        }
);

const updateFirstHost : (hostnameList : Immutable.List<string>) => Promise<boolean> =
    (hostnameList) => {
        return updater.update(hostnameList.first()).then((result) => {
            logger.log('info', 'Result of update: ' + result);
            let nextList = hostnameList.shift();
            if (nextList.size > 0) {
                return updateFirstHost(nextList);
            }
        });    
    }

const chainedCheck : () => void = () => {
    ipCheckRetrier.perform()
    .then((result) => {
        if (MyPublicIpChecker.isNewIp(result)) {
            return updateFirstHost(Immutable.List(config.data.updater.hostNames));
        }
    })
    .then(() => {
        let delay = config.data.checker.checkIntervall;
        logger.verbose(`Checking again in ${delay} milliseconds.`);
        setTimeout(chainedCheck, delay);
    })
    .catch((reason : any) => {
         logger.log('error', 'stopping...', { reason : reason });
         configFileWatcher.close();
    });
}

chainedCheck();
