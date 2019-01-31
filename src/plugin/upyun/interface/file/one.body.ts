
import { ImagePostProcessInfo } from "./image.process.info";

export interface OneBody {
    bucketName: string;

    name: string;

    type: string;

    imagePostProcessInfo: ImagePostProcessInfo;
}
