
export interface UploadProcessData {
    code: number;

    message: string;

    method: string;

    url: string;

    baseUrl: string;

    form: {
        policy: string
        authorization: string
    };
}
