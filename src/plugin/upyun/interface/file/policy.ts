
export interface Policy {
    "bucket": string;

    "save-key": string;

    "expiration": number;

    "date": string;

    "content-md5": string;

    "notify-url": string;

    "x-upyun-meta-ttl": number;

    "ext-param": string;
}
