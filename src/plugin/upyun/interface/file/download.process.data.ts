
export interface DownloadProcessData {
    code: number;

    message: string;

    method: string;

    url: string;

    headers: {
        authorization: string
        date: string
    };
}
