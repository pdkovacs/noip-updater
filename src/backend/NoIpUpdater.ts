import * as Immutable from 'immutable';
import * as https from 'https';
import { RequestOptions } from 'https';

const defaultRequestOptions : RequestOptions = Immutable.fromJS({
    protocol: 'https:',
    host: 'dynupdate.no-ip.com',
    path: '/nic/update'
});

const createRequestOptions : (hostname : string, myip : string, auth : string) => RequestOptions = (hostname, myip, auth) => {
    return null;
};

export class NoIpUpdater {

    private auth: string;

    constructor(auth : string) {
        this.auth = auth;
    }

    public update(hostname : string, myip : string, auth : string) : void {
        let request = https.request(createRequestOptions(hostname, myip, auth), (response) => {

        });
    }
}