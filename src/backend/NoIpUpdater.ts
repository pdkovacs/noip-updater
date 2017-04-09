import * as Immutable from 'immutable';
import * as https from 'https';
import { RequestOptions } from 'https';

const successMessages = Immutable.Map.of(
    'good',  'DNS hostname update successful. Followed by a space and the IP address it was updated to.',
    'nochg', 'IP address is current, no update performed. Followed by a space and the IP address that it is currently set to.'
)

const errorMessages = Immutable.Map.of(
    'nohost',   'Hostname supplied does not exist under specified account, ' +
                'client exit and require user to enter new login credentials before performing an additional request.',
    'badauth',  'Invalid username password combination',
    'badagent', 'Client disabled. Client should exit and not perform any more updates without user intervention.',
    '!donator', 'An update request was sent including a feature that is not available to that particular user such as offline options.',
    'abuse',    'Username is blocked due to abuse. Either for not following our update specifications or disabled due to violation of ' +
                'the No-IP terms of service. Our terms of service can be viewed here. Client should stop sending updates.',
    '911',      'A fatal error on our side such as a database outage. Retry the update no sooner than 30 minutes.'
)

const serviceHostname = 'dynupdate.no-ip.com';

const defaultRequestOptions : RequestOptions = Immutable.fromJS({
    protocol: 'https:',
    host: serviceHostname,
});

const defaultHeaders = Immutable.fromJS({
    Host: serviceHostname,
    Authorization: 'Basic base64-encoded-auth-string',
    'User-Agent': 'https://github.com/pdkovacs/noip-updater peter.dunay.kovacs@gmail.com'
});

const pathBase = '/nic/update'

const createPath : (myHostname : string, myIp : string) => string = (myHostname, myIp) => {
    return `${pathBase}?hostname=${myHostname}&myip=${myIp}`;
}

const createRequestOptions : (myHostname : string, myIp : string, auth : string) => RequestOptions = (myHostname, myIp, auth) => {
    return Object.assign(defaultRequestOptions, {
        auth: auth,
        path: createPath(myHostname, myIp),
        headers: defaultHeaders
    });
};

export class NoIpUpdater {

    private hostname : string;
    private auth: string;

    constructor(auth : string) {
        console.log('auth', auth);
        this.auth = auth;
    }

    public update(hostname : string, myip : string) : Promise<string> {
        return new Promise((resolve, reject) => {
            let request = https.request(createRequestOptions(hostname, myip, this.auth), (response) => {
                let status : string = '';
                response.on('data', (chunk) => { 
                    status += chunk;
                }).on('end', () => {
                    this.checkStatus(status).then((result) => {
                        resolve(result);
                    }, (errorMessage) => {
                        reject(errorMessage);
                    });
                });
            })
            .on('error', (error) => {
                reject(error);
            });
            request.setTimeout(1000)
            request.end();
        });
    }

    private checkStatus(status : string) : Promise<string> {
        return new Promise((resolve, reject) => {
            if (errorMessages.contains(status)) {
                console.log(errorMessages.get(status));
                reject(errorMessages.get(status));
            } else {
                let success = successMessages.filter((value, key) => {
                    return status.startsWith(key);
                });
                if (success === null) {
                    reject('Unexpected status: ' + status);
                } else {
                    resolve(status);
                }
            }
        });
    }
}