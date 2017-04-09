import * as https from 'https';
import { ClientRequest, IncomingMessage } from 'http';

const requestOptions = {
    protocol: 'https:',
    host: 'centos-local',
    path: '/ip',
    method: 'GET'
};

export class MyPublicIPChecker {

    public check() : Promise<string> {

        return new Promise((resolve, reject) => {

            let request = https.request(requestOptions, (response) => {

                let output : string = '';

                response.on('data', (chunk) => { 
                    output += chunk;
                }).on('end', () => {
                    switch (output) {
                        case 'nohost':
                            reject(output);
                            break;
                        default:
                            resolve(output);
                            break;
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

}
