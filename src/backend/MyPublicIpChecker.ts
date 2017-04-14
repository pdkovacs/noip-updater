import * as Immutable from 'immutable';
import * as https from 'https';
import { ClientRequest, IncomingMessage } from 'http';

const requestOptions = {
    protocol: 'https:',
    host: 'ipinfo.io',
    path: '/ip',
    method: 'GET'
};

const NO_CHANGE = '__nochange__';

export class MyPublicIPChecker {

    private lastIp : string;

    constructor(initialIp : string) {
        this.lastIp = initialIp;
    }

    public check() : Promise<string> {

        return new Promise((resolve, reject) => {

            let request = https.request(requestOptions, (response) => {

                let output : string = '';

                response.on('data', (chunk) => {
                    output += chunk;
                }).on('end', () => {
                    let currentIp = output.trim();
                    if (currentIp === this.lastIp) {
                        resolve(NO_CHANGE);
                    } else {
                        this.lastIp = currentIp;
                        resolve(currentIp);
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
