import * as Immutable from "immutable";
import * as https from "https";
import { RequestOptions } from "https";

import { logger } from "./Logger";

const successMessages = Immutable.Map.of(
    "good",  "DNS hostname update successful. Followed by a space and the IP address it was updated to.",
    "nochg", "IP address is current, no update performed. Followed by a space and the IP address that " +
                "it is currently set to."
);

const errorMessages = Immutable.Map.of(
    "nohost",   "Hostname supplied does not exist under specified account, " +
                "client exit and require user to enter new login credentials before performing an additional request.",
    "badauth",  "Invalid username password combination",
    "badagent", "Client disabled. Client should exit and not perform any more updates without user intervention.",
    "!donator", "An update request was sent including a feature that is not available to that particular user " +
                "such as offline options.",
    "abuse",    "Username is blocked due to abuse. Either for not following our update specifications or " +
                "disabled due to violation of  the No-IP terms of service. Our terms of service can be viewed here. " +
                "Client should stop sending updates.",
    "911",      "A fatal error on our side such as a database outage. Retry the update no sooner than 30 minutes."
);

const serviceHostname = "dynupdate.no-ip.com";

const defaultRequestOptions: Immutable.Map<string, string> = Immutable.fromJS({
    protocol: "https:",
    host: serviceHostname
});

const defaultHeaders: Immutable.Map<string, string> = Immutable.fromJS({
    "Host": serviceHostname,
    "User-Agent": "https://github.com/pdkovacs/noip-updater peter.dunay.kovacs@gmail.com"
});

const pathBase = "/nic/update";

const createPath: (myHostname: string) => string = myHostname => {
    return `${pathBase}?hostname=${myHostname}`;
};

const createRequestOptions: (myHostname: string, auth: string) => RequestOptions = (myHostname, auth) => {
    return Object.assign(defaultRequestOptions.toObject(), {
        path: createPath(myHostname),
        headers: Object.assign(defaultHeaders.toObject(), {
            Authorization: "Basic " + new Buffer(auth).toString("base64")
        })
    });
};

export class NoIpUpdater {

    private hostname: string;
    private auth: string;

    constructor(auth: string) {
        this.auth = auth;
    }

    public update(hostname: string): Promise<string> {
        return new Promise((resolve, reject) => {
            logger.log("info", `Updating host ${hostname}...`);
            const request = https.request(createRequestOptions(hostname, this.auth), response => {
                let status: string = "";
                response.on("data", chunk => {
                    status += chunk;
                }).on("end", () => {
                    this.checkStatus(status.trim()).then(result => {
                        logger.log("info", `Host updated: ${hostname}`);
                        resolve(result);
                    }, errorMessage => {
                        reject(errorMessage);
                    });
                });
            })
            .on("error", error => {
                reject(error);
            });
            request.setTimeout(1000);
            request.end();
        });
    }

    private checkStatus(status: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (errorMessages.has(status)) {
                reject(errorMessages.get(status));
            } else {
                const success = successMessages.filter((value, key) => {
                    return status.startsWith(key);
                });
                if (success === null) {
                    reject("Unexpected status: " + status);
                } else {
                    resolve(status);
                }
            }
        });
    }
}
