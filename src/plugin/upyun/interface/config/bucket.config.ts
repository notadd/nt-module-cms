
export interface BucketConfig {
    isPublic: boolean;

    name: string;

    operator: string;

    password: string;

    directory: string;

    requestExpire: number;

    baseUrl: string;

    tokenSecretKey?: string;

    tokenExpire?: number;
}
