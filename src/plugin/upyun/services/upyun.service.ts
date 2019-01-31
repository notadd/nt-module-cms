import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Bucket } from "../entities/bucket.entity";
import { Repository } from "typeorm";
import { BucketConfig } from "../interface/config/bucket.config";
import { RpcException } from "@nestjs/microservices";
import { ConfigService } from "./config.service";
import { RestfulUtil } from "../util/restful.util";
import { UploadProcessBody } from "../interface/file/upload.process.body";
import { UploadProcessData } from "../interface/file/upload.process.data";
import { Policy } from "../interface/file/policy";
import { File } from "../entities/file.entity";
import { Image } from "../entities/image.entity";
import { Video } from "../entities/video.entity";
import { Audio } from "../entities/audio.entity";
import { Document } from "../entities/document.entity";
import { KindUtil } from "../util/kind.util";
import { ProcessStringUtil } from "../util/process.string.util";
import { AuthUtil } from "../util/auth.util";

@Injectable()
export class UpYunService {
    constructor(
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>,
        @Inject(ConfigService) private readonly configService: ConfigService,
        @Inject(RestfulUtil) private readonly restfulUtil: RestfulUtil,
        @Inject(KindUtil) private readonly kindUtil: KindUtil,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @Inject(ProcessStringUtil) private readonly processStringUtil: ProcessStringUtil,
        @Inject(AuthUtil) private readonly authUtil: AuthUtil,
    ) { }

    async bucket(bucket: BucketConfig) {
        const { isPublic, name, operator, password, directory, baseUrl, requestExpire } = bucket;
        if (isPublic === undefined || !name || !operator || !password || !directory || !baseUrl || !requestExpire) {
            throw new RpcException({ code: 400, message: '缺少参数' });
        }
        if (isPublic !== true && isPublic !== false && isPublic !== "true" && isPublic !== "false") {
            throw new RpcException({ code: 400, message: 'isPublic参数不正确' });
        }
        if (!Number.isInteger(bucket.requestExpire)) {
            throw new RpcException({ code: 400, message: '请求超时参数为非整数' });
        } else if (bucket.requestExpire < 0) {
            throw new RpcException({ code: 400, message: '请求超时参数小于0' });
        } else if (bucket.requestExpire > 1800) {
            throw new RpcException({ code: 400, message: '请求超时参数大于1800' });
        }
        if (!isPublic) {
            if (!Number.isInteger(bucket.tokenExpire)) {
                throw new RpcException({ code: 400, message: 'token超时参数为非整数' });
            } else if (bucket.tokenExpire < 0) {
                throw new RpcException({ code: 400, message: 'token超时参数小于0' });
            } else if (bucket.tokenExpire > 1800) {
                throw new RpcException({ code: 400, message: 'token超时参数大于1800' });
            }
        }
        // 保存配置，如果已存在就更新它
        console.log(bucket);
        const result: Bucket = await this.configService.saveBucketConfig(bucket);
        await this.restfulUtil.createDirectory(result);
        return { code: 200, message: "空间配置成功" };
    }

    async uploadProcess(upload: UploadProcessBody, context) {
        const data: UploadProcessData = {
            code: 200,
            message: "上传预处理成功",
            url: "https://v0.api.upyun.com",
            method: "post",
            baseUrl: "",
            form: {
                policy: "",
                authorization: ""
            }
        };
        const { bucketName, md5, contentName } = upload;
        if (!bucketName || !contentName) {
            throw new RpcException({ code: 400, message: '缺少参数' });
        }
        if (md5 && md5.length !== 32) {
            throw new RpcException({ code: 400, message: 'md5参数不正确' });
        }
        // 查询空间配置，关联查询图片、音频、视频配置，处理文件需要这些信息
        const bucket: Bucket = await this.bucketRepository.createQueryBuilder("bucket")
            .leftJoinAndSelect("bucket.imageConfig", "imageConfig")
            .leftJoinAndSelect("bucket.audioConfig", "audioConfig")
            .leftJoinAndSelect("bucket.videoConfig", "videoConfig")
            .where("bucket.name = :name", { name: bucketName })
            .getOne();
        if (!bucket) {
            throw new RpcException({ code: 404, message: `${bucketName}不存在!` });
        }
        data.baseUrl = bucket.baseUrl;
        // 预保存图片,获取保存的图片，图片名为预处理图片名，会设置到policy的apps中去
        const image = await this.preSaveFile(bucket, upload);
        // 上传policy字段
        const policy: Policy = {
            // 空间名
            "bucket": "",
            // 文件保存路径，包括目录、文件名、扩展名
            "save-key": "",
            // 请求过期事件
            "expiration": undefined,
            "date": "",
            "content-md5": md5,
            // 异步回调通知路径，图片异步预处理回调也是这个接口
            "notify-url": context.req.protocol + "://" + context.req.get("host") + "/upyun/file/notify",
            // 图片生存期限默认为180天
            "x-upyun-meta-ttl": 180,
            // 扩展参数，包含了空间名
            "ext-param": ""
        };
        // 获取后台配置，创建上传参数，返回文件种类、以及文件所属目录
        await this.makePolicy(data, policy, bucket, upload, image);
        return data;
    }

    async preSaveFile(bucket: Bucket, body: UploadProcessBody): Promise<File | Image | Video | Audio | Document> {
        const { md5, contentName, contentSecret, tags } = body;
        const type = contentName.substr(contentName.lastIndexOf(".") + 1).toLowerCase();
        const kind = this.kindUtil.getKind(type);
        if (kind === "image") {
            // 创建图片
            const image = new Image();
            image.rawName = contentName;
            // 这个文件名会设置到预处理参数apps的save_as中去，而不是上传参数的save_key中，那个文件名不保存，在回调中直接删除
            image.name = `${md5}_${+new Date()}`;
            image.md5 = md5;
            image.tags = tags;
            image.type = type;
            image.status = "pre";
            image.contentSecret = contentSecret || undefined;
            image.bucket = bucket;
            try {
                await this.imageRepository.save(image);
            } catch (err) {
                throw new RpcException({ code: 404, message: '图片预保存失败' });
            }
            return image;
        } else {
            const file = new File();
            file.type = type;
            return file;
        }
    }

    async makePolicy(data: any, policy: any, bucket: Bucket, body: UploadProcessBody, file: File | Image | Video | Audio | Document): Promise<void> {
        const { md5, contentSecret, contentName } = body;
        // 设置各种上传参数
        if (contentSecret) {
            policy["content-secret"] = contentSecret;
        }
        policy.bucket = bucket.name;
        policy["ext-param"] += bucket.name;
        data.url += `/${bucket.name}`;
        // 文件类型以文件扩展名确定，如果不存在扩展名为file
        const type: string = file && file.type || "";
        const kind = type ? this.kindUtil.getKind(type) : "file";
        // 这里原图的save_key不保存它，在回调中直接删除
        policy["save-key"] += `/${bucket.directory}/${md5}_${+new Date()}.${type}`;
        policy.expiration = Math.floor((+new Date()) / 1000) + bucket.requestExpire;
        policy.date = new Date(+new Date() + bucket.requestExpire * 1000).toUTCString();
        // 根据配置，设置预处理参数，只有一个预处理任务
        if (kind === "image") {
            const obj = {
                "name": "thumb",
                "x-gmkerl-thumb": "",
                "save_as": "",
                "notify_url": policy["notify-url"]
            };
            const format = bucket.imageConfig.format || "raw";
            // 原图不处理
            if (format === "raw") {
                // 保存为原图，为了防止没有预处理字符串时不进行预处理任务，加上了/scale/100
                obj["x-gmkerl-thumb"] = this.processStringUtil.makeImageProcessString(bucket, body.imagePreProcessInfo) + "/scale/100";
                // 这里将预处理的文件名设置为刚才保存的文件名，在回调中根据文件名来更新它，保存为原图时，
                obj.save_as = `/${bucket.directory}/${file.name}.${file.type}`;
                // apps字段应为json字符串
                policy.apps = [obj];
            } else if (format === "webp_damage") {
                // 保存为有损webp
                obj["x-gmkerl-thumb"] = this.processStringUtil.makeImageProcessString(bucket, body.imagePreProcessInfo) + "/format/webp/strip/true";
                obj.save_as = `/${bucket.directory}/${file.name}.webp`;
                // apps字段应为json字符串
                policy.apps = [obj];
            } else if (format === "webp_undamage") {
                // 保存为无损webp
                obj["x-gmkerl-thumb"] = this.processStringUtil.makeImageProcessString(bucket, body.imagePreProcessInfo) + "/format/webp/lossless/true/strip/true";
                obj.save_as = `/${bucket.directory}/${file.name}.webp`;
                policy.apps = [obj];
            } else {
                throw new Error("格式配置不正确，应该不能发生");
            }
        } else {
            // 暂时不支持
        }
        // 设置表单policy字段
        data.form.policy = Buffer.from(JSON.stringify(policy)).toString("base64");
        // 生成签名，上传签名需要policy参数
        const method = data.method;
        data.form.authorization = await this.authUtil.getBodyAuth(bucket, method, policy);
        return;
    }

}