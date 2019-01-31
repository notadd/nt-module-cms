
import { Injectable, HttpException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as  crypto from "crypto";
import { Repository } from "typeorm";
import { AudioFormatConfig } from "../interface/config/audio.format.config";
import { BucketConfig } from "../interface/config/bucket.config";
import { EnableImageWatermarkConfig } from "../interface/config/enable.image.watermark.config";
import { ImageFormatConfig } from "../interface/config/image.format.config";
import { VideoFormatConfig } from "../interface/config/video.format.config";
import { FileUtil } from "../util/file.util";
import { RestfulUtil } from "../util/restful.util";
import { Image } from "../entities/image.entity";
import { Bucket } from "../entities/bucket.entity";
import { ImageConfig } from "../entities/image.config.entity";
import { AudioConfig } from "../entities/audio.config.entity";
import { VideoConfig } from "../entities/video.config.entity";

/* 配置服务组件，包含了保存公有空间、私有空间、格式、水印等配置项的功能
   还可以获取公有、私有配置
*/
@Injectable()
export class ConfigService {

    constructor(
        @Inject(FileUtil) private readonly fileUtil: FileUtil,
        @Inject(RestfulUtil) private readonly restfulUtil: RestfulUtil,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>,
        @InjectRepository(ImageConfig) private readonly imageConfigRepository: Repository<ImageConfig>,
        @InjectRepository(AudioConfig) private readonly audioConfigRepository: Repository<AudioConfig>,
        @InjectRepository(VideoConfig) private readonly videoConfigRepository: Repository<VideoConfig>
    ) {
    }

    async saveBucketConfig(body: BucketConfig): Promise<Bucket> {
        const id: number = body.isPublic ? 1 : 2;
        const bucket: Bucket | undefined = await this.bucketRepository.findOne(id);
        if (bucket) {
            bucket.name = body.name;
            bucket.operator = body.operator;
            bucket.password = crypto.createHash("md5").update(body.password).digest("hex");
            bucket.directory = body.directory;
            bucket.baseUrl = body.baseUrl;
            bucket.requestExpire = body.requestExpire;
            if (!body.isPublic) {
                bucket.tokenExpire = body.tokenExpire;
                bucket.tokenSecretKey = body.tokenSecretKey;
            }
            try {
                await this.bucketRepository.save(bucket);
            } catch (err) {
                throw new HttpException("空间配置更新失败" + err.toString(), 403);
            }
            return bucket;
        } else {
            const newBucket: Bucket = this.bucketRepository.create({
                id,
                publicOrPrivate: body.isPublic ? "public" : "private",
                name: body.name,
                operator: body.operator,
                password: crypto.createHash("md5").update(body.password).digest("hex"),
                directory: body.directory,
                baseUrl: body.baseUrl,
                requestExpire: body.requestExpire
            });
            if (!body.isPublic) {
                newBucket.tokenExpire = body.tokenExpire;
                newBucket.tokenSecretKey = body.tokenSecretKey;
            }
            const audioConfig = new AudioConfig();
            const videoConfig = new VideoConfig();
            const imageConfig = new ImageConfig();
            audioConfig.id = id;
            videoConfig.id = id;
            imageConfig.id = id;
            newBucket.audioConfig = audioConfig;
            newBucket.videoConfig = videoConfig;
            newBucket.imageConfig = imageConfig;
            try {
                await this.bucketRepository.save(newBucket);
            } catch (err) {
                throw new HttpException("空间保存失败" + err.toString(), 403);
            }
            return newBucket;
        }
    }

    async saveImageFormatConfig(body: ImageFormatConfig): Promise<any> {
        let { format } = body;
        format = format.toLowerCase();
        if (format !== "raw" && format !== "webp_damage" && format !== "webp_undamage") {
            throw new HttpException("图片保存格式不正确", 400);
        }
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["imageConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        try {
            for (let i = 0; i < buckets.length; i++) {
                buckets[i].imageConfig.format = format;
                await this.imageConfigRepository.save(buckets[i].imageConfig);
            }
        } catch (err) {
            throw new HttpException("图片保存格式更新失败" + err.toString(), 403);
        }
        return;
    }

    async saveEnableImageWatermarkConfig(body: EnableImageWatermarkConfig): Promise<void> {
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["imageConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        let watermarkEnable: number;
        if (body.enable) {
            watermarkEnable = 1;
        } else {
            watermarkEnable = 0;
        }
        try {
            for (let i = 0; i < buckets.length; i++) {
                buckets[i].imageConfig.watermarkEnable = watermarkEnable;
                await this.imageConfigRepository.save(buckets[i].imageConfig);
            }
        } catch (err) {
            throw new HttpException("水印启用保存失败" + err.toString(), 403);
        }
    }

    async saveImageWatermarkConfig(file: any, obj: any): Promise<void> {
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["imageConfig"] });
        let type = file.name.substr(file.name.lastIndexOf(".") + 1).toLowerCase();
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        const buffer: Buffer = await this.fileUtil.read(file.path);
        const md5 = crypto.createHash("md5").update(buffer).digest("hex");
        for (let i = 0; i < buckets.length; i++) {
            if (buckets[i].imageConfig.format === "webp_damage" || buckets[i].imageConfig.format === "webp_undamage") {
                type = "webp";
            }
            const image: Image = new Image();
            // 这里有坑，如果之前使用了await bucket.images，那么这个bucket的性质会改变，即便这样关联，最后image中仍旧没有bucketId值
            image.bucket = buckets[i];
            image.rawName = file.name;
            // 图片文件名为md5_时间戳
            image.name = md5 + "_" + (+new Date());
            image.type = type;
            image.md5 = md5;
            image.status = "post";
            const { width, height, frames } = await this.restfulUtil.uploadFile(buckets[i], image, file, undefined);
            const { fileSize, fileMd5 } = await this.restfulUtil.getFileInfo(buckets[i], image);
            image.width = width;
            image.height = height;
            image.frames = frames;
            image.size = fileSize;
            image.md5 = fileMd5;
            try {
                await this.imageRepository.save(image);
            } catch (err) {
                throw new HttpException("水印图片保存失败" + err.toString(), 403);
            }
            try {
                buckets[i].imageConfig.watermarkSaveKey = "/" + buckets[i].directory + "/" + image.name + "." + image.type;
                buckets[i].imageConfig.watermarkGravity = obj.gravity;
                buckets[i].imageConfig.watermarkOpacity = obj.opacity;
                buckets[i].imageConfig.watermarkWs = obj.ws;
                buckets[i].imageConfig.watermarkX = obj.x;
                buckets[i].imageConfig.watermarkY = obj.y;
                await this.imageConfigRepository.save(buckets[i].imageConfig);
            } catch (err) {
                throw new HttpException("水印配置更新失败" + err.toString(), 403);
            }
        }
        return;
    }

    async saveAudioFormatConfig(body: AudioFormatConfig): Promise<void> {
        let { format } = body;
        format = format.toLowerCase();
        if (format !== "raw" && format !== "mp3" && format !== "aac") {
            throw new HttpException("音频保存格式不正确", 400);
        }
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["audioConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        try {
            for (let i = 0; i < buckets.length; i++) {
                buckets[i].audioConfig.format = format;
                await this.audioConfigRepository.save(buckets[i].audioConfig);
            }
        } catch (err) {
            throw new HttpException("音频保存格式更新失败" + err.toString(), 403);
        }
    }

    async saveVideoFormatConfig(body: VideoFormatConfig): Promise<void> {
        let { format, resolution } = body;
        format = format.toLowerCase();
        if (format !== "raw" && format !== "vp9" && format !== "h264" && format !== "h265") {
            throw new HttpException("视频编码格式不正确", 400);
        }
        resolution = resolution.toLowerCase();
        if (resolution !== "raw" && resolution !== "p1080" && resolution !== "p720" && resolution !== "p480") {
            throw new HttpException("视频分辨率格式不正确", 400);
        }

        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["videoConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        try {
            for (let i = 0; i < buckets.length; i++) {
                buckets[i].videoConfig.format = format;
                buckets[i].videoConfig.resolution = resolution;
                await this.videoConfigRepository.save(buckets[i].videoConfig);
            }
        } catch (err) {
            throw new HttpException("视频保存格式更新失败" + err.toString(), 403);
        }
        return;
    }
}
