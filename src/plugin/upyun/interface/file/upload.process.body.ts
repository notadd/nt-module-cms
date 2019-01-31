
import { ImagePreProcessInfo } from "./image.process.info";

export interface UploadProcessBody {
    bucketName: string;

    md5: string;

    contentName: string;

    contentSecret?: string;

    tags?: Array<string>;

    imagePreProcessInfo?: ImagePreProcessInfo;
}
