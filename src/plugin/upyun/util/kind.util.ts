
import { Injectable } from "@nestjs/common";
import allowExtension from "./allow.extension";

@Injectable()
export class KindUtil {

    constructor() { }

    getKind(type: string) {
        if (allowExtension.image.find(item => type === item)) {
            return "image";
        } else if (allowExtension.audio.find(item => type === item)) {
            return "audio";
        } else if (allowExtension.video.find(item => type === item)) {
            return "video";
        } else if (allowExtension.document.find(item => type === item)) {
            return "document";
        } else {
            return "file";
        }
    }

    isImage(type: string) {
        return allowExtension.image.find(item => type === item);
    }
}
