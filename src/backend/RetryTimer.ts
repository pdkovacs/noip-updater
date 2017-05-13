import { logger } from './Logger';

export enum ERROR_TYPE {
    TransientError,
    PersistentError
}

export class ActionResult {
    readonly payload : any;
    readonly errorType : ERROR_TYPE;
    readonly error : any;

    constructor(payload : any, error : any, errorType : ERROR_TYPE) {
        this.payload = payload;
        this.error = error;
        this.errorType = errorType;
    }
}

export class RetryTimer {
    private readonly name : string;
    private readonly retryInterval : number;
    private readonly maxRetryCount : number;
    private readonly action : () => Promise<ActionResult>;
    private retryCount : number = 0;

    constructor(name : string, interval : number, maxRetryCount : number, action : () => Promise<ActionResult>) {
        this.name = name;
        this.retryInterval = interval;
        this.maxRetryCount = maxRetryCount;
        this.action = action;
    }

    public perform() : Promise<any> {
        return new Promise((resolve, reject) => {
            this._perform(resolve, reject);
        });
    }

    private _perform(success : (result : any) => void, failure : (error : any) => void) {
        this.action().then((result) => {
            if (result.payload) {
                success(result.payload);
            } else {
                if (result.errorType === ERROR_TYPE.PersistentError || this.retryCount >= this.maxRetryCount) {
                    failure(result.error);
                } else {
                    this.retryCount++;
                    logger.log('error', 'An error occurred, will retry...',
                            { actionName: this.name, error: result.error, retryCount: this.retryCount }
                    );
                    setTimeout(() => {
                        this._perform(success, failure);
                    }, this.retryInterval);
                }
            }
        }, (error) => {
            failure(error);
        });
    }
    
}
