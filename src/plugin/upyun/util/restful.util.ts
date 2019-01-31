
import { Injectable, HttpException, Inject } from "@nestjs/common";
import * as fs from "fs";
import * as mime from "mime";
import * as request from "request";
import { ImagePreProcessInfo } from "../interface/file/image.process.info";
import { AuthUtil } from "../util/auth.util";
import { ProcessStringUtil } from "./process.string.util";
import { Bucket } from "../entities/bucket.entity";
import { File } from "../entities/file.entity";
import { Image } from "../entities/image.entity";
import { Video } from "../entities/video.entity";
import { Audio } from "../entities/audio.entity";
import { Document } from "../entities/document.entity";
import { RpcException } from "@nestjs/microservices";

/* 包含了restfulAPI的各种功能
   删除文件、创建目录、删除目录、获取文件信息、获取目录文件列表、获取服务使用量
*/
@Injectable()
export class RestfulUtil {
    private readonly apihost = "https://v0.api.upyun.com";

    constructor(
        @Inject(AuthUtil) private readonly authUtil: AuthUtil,
        @Inject(ProcessStringUtil) private readonly processStringUtil: ProcessStringUtil
    ) {
    }

    // 上传文件，其中文件信息来自于formidable解析得到的File对象
    async uploadFile(bucket: Bucket, file: File | Image | Video | Audio | Document, uploadFile: any, imagePreProcessInfo: ImagePreProcessInfo): Promise<{ width: number, height: number, frames: number }> {
        const contentMd5 = file.md5;
        const saveKey = `/${bucket.directory}/${file.name}.${file.type}`;
        const requestUrl = `${this.apihost}/${bucket.name}${saveKey}`;
        const url = `/${bucket.name}${saveKey}`;
        const date: string = new Date(+new Date() + bucket.requestExpire * 1000).toUTCString();
        const Authorization = await this.authUtil.getHeaderAuth(bucket, "PUT", url, date, contentMd5);
        const format = bucket.imageConfig.format || "raw";
        let xGmkerlThumb = this.processStringUtil.makeImageProcessString(bucket, imagePreProcessInfo);
        if (format === "raw") {
            xGmkerlThumb += "/scale/100";
        } else if (format === "webp_damage") {
            xGmkerlThumb += "/format/webp/strip/true";
        } else {
            xGmkerlThumb += "/format/webp/lossless/true/strip/true";
        }
        const headers: any = await new Promise((resolve, reject) => {
            fs.createReadStream(uploadFile.path).pipe(request.put({
                url: requestUrl,
                headers: {
                    "Content-Type": mime.getType(uploadFile.path),
                    "Content-MD5": contentMd5,
                    Authorization,
                    "Date": date,
                    "x-gmkerl-thumb": xGmkerlThumb
                }
            }, (err, res, body) => {
                if (err) {
                    reject(new HttpException("文件上传失败,网络错误", 402));
                    return;
                }
                if (res.statusCode === 200) {
                    resolve(res.headers);
                    return;
                }
                if (body) {
                    try {
                        const { msg, code, id } = JSON.parse(body);
                        reject(new HttpException(msg, code));
                    } catch (err) {
                        reject(new HttpException("响应体解析错误", 402));
                    }
                } else {
                    reject(new HttpException("响应体不存在", 402));
                }
                return;
            }));
        });
        return {
            width: headers["x-upyun-width"],
            height: headers["x-upyun-height"],
            frames: headers["x-upyun-frames"]
        };
    }

    /*创建指定空间里的指定目录，空间下唯一目录在配置中指定
        @Param bucket：目录所属空间
    */
    async createDirectory(bucket: Bucket): Promise<void> {
        const requestUrl = `${this.apihost}/${bucket.name}/${bucket.directory}`;
        const url = `/${bucket.name}/${bucket.directory}`;
        const date: string = new Date(+new Date() + bucket.requestExpire * 1000).toUTCString();
        const Authorization = await this.authUtil.getHeaderAuth(bucket, "POST", url, date, undefined);
        await new Promise((resolve, reject) => {
            request.post({
                url: requestUrl,
                headers: {
                    Authorization,
                    Date: date,
                    folder: true
                }
            },
                (err, res, body) => {
                    if (err) {
                        reject(new HttpException("目录创建失败，网络错误", 402));
                        return;
                    }
                    if (res.statusCode === 200) {
                        resolve();
                        return;
                    }
                    if (body) {
                        try {
                            const { msg, code, id } = JSON.parse(body);
                            console.log(msg,code,id);
                            reject(new RpcException({ code, message: msg }));
                        } catch (err) {
                            reject(new HttpException("响应体解析错误", 402));
                        }
                    } else {
                        reject(new HttpException("响应体不存在", 402));
                    }
                    return;
                });
        });
        return;
    }

    /* 删除指定空间指定文件
       @Param bucket：文件所属空间
       @Param file：文件对象
     */
    async deleteFile(bucket: Bucket, file: File | Image | Video | Audio | Document): Promise<void> {
        const savekey = `/${bucket.directory}/${file.name}.${file.type}`;
        const requestUrl = `${this.apihost}/${bucket.name}${savekey}`;
        const url = `/${bucket.name}${savekey}`;
        const date: string = new Date(+new Date() + bucket.requestExpire * 1000).toUTCString();
        const Authorization = await this.authUtil.getHeaderAuth(bucket, "DELETE", url, date, "");
        await new Promise((resolve, reject) => {
            request.delete({
                url: requestUrl,
                headers: {
                    Authorization,
                    Date: date
                }
            }, (err, res, body) => {
                if (err) {
                    reject(new HttpException("删除文件失败", 402));
                    return;
                }
                if (res.statusCode === 200) {
                    resolve();
                    return;
                }
                if (body) {
                    try {
                        const { msg, code, id } = JSON.parse(body);
                        reject(new HttpException(msg, code));
                    } catch (err) {
                        reject(new HttpException("响应体解析错误", 402));
                    }
                } else {
                    reject(new HttpException("响应体不存在", 402));
                }
                return;
            });
        });
        return;
    }

    /* 获取指定文件的保存信息
     */
    async getFileInfo(bucket: Bucket, file: File | Image | Video | Audio | Document): Promise<{ fileSize: number, fileDate: any, fileMd5: string }> {
        const savekey = `/${bucket.directory}/${file.name}.${file.type}`;
        const requestUrl = `${this.apihost}/${bucket.name}${savekey}`;
        const url = `/${bucket.name}${savekey}`;
        const date: string = new Date(+new Date() + bucket.requestExpire * 1000).toUTCString();
        const Authorization = await this.authUtil.getHeaderAuth(bucket, "HEAD", url, date, "");
        const headers: any = await new Promise((resolve, reject) => {
            request.head({
                url: requestUrl,
                headers: {
                    Authorization,
                    Date: date
                }
            }, (err, res, body) => {
                if (err) {
                    reject(new HttpException("获取文件信息失败", 402));
                    return;
                }
                if (res.statusCode === 200) {
                    resolve(res.headers);
                    return;
                }
                if (body) {
                    try {
                        const { msg, code, id } = JSON.parse(body);
                        reject(new HttpException(msg, code));
                    } catch (err) {
                        reject(new HttpException("响应体解析错误", 402));
                    }
                } else {
                    reject(new HttpException("响应体不存在", 402));
                }
                return;
            });
        });
        return {
            fileSize: +headers["x-upyun-file-size"],
            fileDate: +headers["x-upyun-file-date"],
            fileMd5: headers["content-md5"]
        };
    }

    /* 获取指定空间下文件\目录列表
       响应头信息中指明了分页位置
       响应体为换行符、空格拼接的字符串，列分别为
       文件名/目录名  类型(N表示文件、F标志目录) 大小 最后修改时间
     */
    async getFileList(bucket: Bucket): Promise<any> {
        const saveKey = `/${bucket.directory}`;
        const requestUrl = `${this.apihost}/${bucket.name}${saveKey}`;
        const url = `/${bucket.name}${saveKey}`;
        const date: string = new Date(+new Date() + bucket.requestExpire * 1000).toUTCString();
        const Authorization = await this.authUtil.getHeaderAuth(bucket, "GET", url, date, "");
        const body: any = await new Promise((resolve, reject) => {
            request.get({
                url: requestUrl,
                headers: {
                    Authorization,
                    Date: date
                }
            }, (err, res, body) => {
                if (err) {
                    reject(new HttpException("获取文件信息失败", 402));
                    return;
                }
                if (res.statusCode === 200) {
                    resolve(body);
                    return;
                }
                reject(new HttpException("获取文件列表失败", 402));
                return;
            });
        });
        const info = body.split("\n").map((value, index, raw) => {
            const temp = value.split("\t");
            return {
                name: temp[0],
                isDirectory: (temp[1] === "N" ? false : true),
                size: parseInt(temp[2]),
                timestamp: parseInt(temp[3])
            };
        });
        return info;
    }
}
