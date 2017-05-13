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

export const watcher = fs.watch(getConfigFilePath(), (event, filename) => {
    switch (event) {
        case 'rename': // Editing with vim results in this event
            let exists = fs.existsSync(getConfigFilePath());
            logger.warn('Ooops! Configuration file was renamed?', { cofigurationFilePath: getConfigFilePath(), exists: exists });
            if (exists) {
                updateConfiguration();
            }
            break;
        case 'change':
            logger.info('Configuration file changed. Updating configuration...', { cofigurationFilePath: getConfigFilePath() });
            updateConfiguration();
    }
});

export const configuration = {
    data: data
};
