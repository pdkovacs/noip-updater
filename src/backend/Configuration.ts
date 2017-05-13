import * as Process from 'process';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from './Logger';

interface Configuration {
    logger: {
        level: string
    }
    checker: {
        initialIp: string,
        checkIntervall : number,
        impl: string,
        error: {
            retryIntervall : number,
            maxRetryCount : number
        }
    },
    updater: {
        auth : string,
        hostNames : string[]
    }
}

const getConfigFilePath : () => string = () => path.resolve(Process.env['HOME'], '.bitkitchen.org/noip-config.json');

let data : Configuration;
let updateConfiguration : () => void = () => {
    data = JSON.parse(fs.readFileSync(getConfigFilePath(), { encoding: 'utf8' }));
    logger.level = data.logger.level;
}
updateConfiguration();

let watcher : fs.FSWatcher = null;

let watchConfigFile = () => {
    if (watcher != null) {
        watcher.close();
    }
    watcher = fs.watch(getConfigFilePath(), (event, filename) => {
        switch (event) {
            case 'rename': // Editing with vim results in this event
                let exists = fs.existsSync(getConfigFilePath());
                logger.warn('Ooops! Configuration file was renamed?', { cofigurationFilePath: getConfigFilePath(), exists: exists });
                if (exists) {
                    updateConfiguration();
                    watchConfigFile();
                }
                break;
            case 'change':
                logger.info('Configuration file changed. Updating configuration...', { cofigurationFilePath: getConfigFilePath() });
                updateConfiguration();
        }
    });
}

watchConfigFile();

export const configuration = {
    data: data,
    watcher: watcher
};
