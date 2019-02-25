import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { BucketConfig } from "../interface/config/bucket.config";
import { UpYunService } from "../services/upyun.service";
import { UploadProcessBody } from "../interface/file/upload.process.body";
import { UploadProcessData } from "../interface/file/upload.process.data";

@Controller()
export class UpYunController {
    constructor(
        @Inject(UpYunService) private readonly upyunService: UpYunService,
    ) { }

    @GrpcMethod('UpYunService')
    async bucket(body: { bucket: BucketConfig }) {
        return await this.upyunService.bucket(body.bucket);
    }

    @GrpcMethod('UpYunService')
    async uploadProcess(body: { upload: UploadProcessBody, protocol: string, host: string }) {
        return await this.upyunService.uploadProcess(body.upload, body.protocol, body.host);
    }

}