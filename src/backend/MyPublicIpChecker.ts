import * as Immutable from 'immutable';
import * as https from 'https';
import { ClientRequest, IncomingMessage } from 'http';

const NO_CHANGE = '__nochange__';

export const createMyPublicIpChecker : (key : string, initalIp : string) => MyPublicIpChecker =
    (key, initalIp) : MyPublicIpChecker => {
        switch(key) {
            case 'ipinfo.io':
                return new IpInfoIoChecker(initalIp);
            case 'whatismypublicip.com':
                return new WhatIsMyPublicIpCom(initalIp);
        }
    }

export abstract class MyPublicIpChecker {

    private lastIp : string;

    constructor(initialIp : string) {
        this.lastIp = initialIp;
    }

    abstract getRequestOptions() : https.RequestOptions;

    abstract parseOutput(output : string) : string;

    public check() : Promise<string> {

        return new Promise((resolve, reject) => {

            let request = https.request(this.getRequestOptions(), (response) => {

                let output : string = '';

                response.on('data', (chunk) => {
                    output += chunk;
                }).on('end', () => {
                    let currentIp = this.parseOutput(output);
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

class IpInfoIoChecker extends MyPublicIpChecker {

    getRequestOptions(): https.RequestOptions {
        return {
            protocol: 'https:',
            host: 'ipinfo.io',
            path: '/ip',
            method: 'GET'
        };
    }

    parseOutput(output: string): string {
        return output.trim();
    }

}

class WhatIsMyPublicIpCom extends MyPublicIpChecker {

    getRequestOptions(): https.RequestOptions {
        return {
            protocol: 'https:',
            host: 'whatismypublicip.com',
            method: 'GET'
        };
    }

    parseOutput(output: string): string {
        let re = /<div id="up_finished">(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s*<\/div>/;
        return output.replace(re, '$1');
    }

}
