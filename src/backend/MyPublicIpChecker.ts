import * as Immutable from 'immutable';
import * as https from 'https';
import { ClientRequest, IncomingMessage } from 'http';

const requestOptions = {
    protocol: 'https:',
    host: 'centos-local',
    path: '/ip',
    method: 'GET'
};

const NO_CHANGE = '__nochange__';

export class MyPublicIPChecker {

    private initialIp : string;

    constructor(initialIp : string) {
        this.initialIp = initialIp;
    }

    public check() : Promise<string> {

        return new Promise((resolve, reject) => {

            let request = https.request(requestOptions, (response) => {

                let output : string = '';

                response.on('data', (chunk) => { 
                    output += chunk;
                }).on('end', () => {
                    if (output === this.initialIp) {
                        resolve(NO_CHANGE);
                    } else {
                        resolve(output);
                    }
                });
            })
            .on('error', (error) => {
                reject(error);
            });
            request.setTimeout(1000)
            request.end();
        });

    }

    public static isNewIp(maybeNewIp : string) : boolean {
        return maybeNewIp !== NO_CHANGE;
    }
}
