
import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { Bucket } from "../entities/bucket.entity";

/* 验证签名服务组件，包含获取头信息签名、请求体签名、token、回调通知验签等功能 */
@Injectable()
export class AuthUtil {

    constructor() { }

    /* 获取请求头信息中签名，restfulAPI与form回调通知签名使用这种签名方式
      @Param data：响应信息
      @Param bucket：空间配置
      @Param url：请求url，即不包含域名、查询字符串之前的部分，对于回调通知为/image/notify
      @Param date：加上超时之后的GMT格式字符串
      @Param method：请求方法，回调通知为异步时为post
      @Param contentMd5：请求体md5值
    */
    async getHeaderAuth(bucket: Bucket, method: string, url: string, date: string, md5: string): Promise<string> {
        const ori = `${method.toUpperCase()}&${url}&${date}${md5 ? "&" + md5 : ""}`;
        const signTemp = crypto.createHmac("sha1", bucket.password).update(ori).digest().toString("base64");
        return `UPYUN ${bucket.operator}:${signTemp}`;
    }

    /* 获取请求体信息签名，form表单上传采用这种签名方式
       @Param data：响应信息
       @Param bucket：空间配置
       @Param method：请求方法
       @Param policy：上传参数对象
    */
    async getBodyAuth(bucket: Bucket, method: string, policy: any): Promise<string> {
        const ori = `${method.toUpperCase()}&${`/${policy.bucket}`}&${policy.date}&${Buffer.from(JSON.stringify(policy)).toString("base64")}${policy["content-md5"] ? `&${policy["content-md5"]}` : ""}`;
        const signTemp = crypto.createHmac("sha1", bucket.password).update(ori).digest("base64");
        return `UPYUN ${bucket.operator}:${signTemp}`;
    }

    /* 获取访问私有空间图片token
       @Param url：访问图片的url,不包含域名
       @Param bucket：空间配置
    */
    getToken(bucket: Bucket, url: string) {
        const expireTime = Math.floor((+new Date()) / 1000) + bucket.tokenExpire;
        const str = `${bucket.tokenSecretKey}&${expireTime}&${url}`;
        const md5 = crypto.createHash("md5").update(str).digest("hex");
        // 获取中间8位
        const middle8 = md5.substring(12, 20);
        return middle8 + expireTime;
    }

    /* 验证回调签名
       @Param auth：回调响应头信息中签名字符串
       @Param bucket：空间配置
       @Param url：回调通知url
       @Param method：回调通知方法，异步情况下问post
       @Param body：回调通知请求体对象
       @Param date：回调请求头信息中date字符串
       @Param contentMd5：回调请求头信息中md5值
    */
    async notifyVerify(auth: string, bucket: Bucket, method: string, url: string, date: string, contentMd5: string, body: any): Promise<boolean> {
        let rawBody = "";
        const keys = Object.keys(body);
        keys.forEach((key, index) => {
            if (body[key] && !isNaN(parseInt(body[key])) && key !== "task_ids") {
                body[key] = parseInt(body[key]);
            }
            rawBody += key + "=" + encodeURIComponent(body[key]);
            if (index < keys.length - 1) {
                rawBody += "&";
            }
        });
        const genarateMd5 = crypto.createHash("md5").update(rawBody).digest("hex");
        if (genarateMd5 !== contentMd5) {
            return false;
        }
        const ori = `${method.toUpperCase()}&${url}&${date}&${contentMd5}`;
        const localSign = crypto.createHmac("sha1", bucket.password).update(ori).digest("base64");
        // 获取响应头信息中签名字符串
        const remoteSign = auth.substr(auth.lastIndexOf(":") + 1);
        if (localSign === remoteSign) {
            return true;
        }
        return false;
    }

    /* 验证回调签名
       @Param auth：回调响应头信息中签名字符串
       @Param bucket：空间配置
       @Param url：回调通知url
       @Param method：回调通知方法，异步情况下问post
       @Param body：回调通知请求体对象
    */
    async taskNotifyVerify(auth: string, bucket: Bucket, method: string, url: string, date: string, contentMd5: string, body: any): Promise<boolean> {
        const genarateMd5 = crypto.createHash("md5").update(JSON.stringify(body)).digest("hex");
        if (contentMd5 !== genarateMd5) {
            return false;
        }
        const ori = `${method.toUpperCase()}&${url}&${date}&${contentMd5}`;
        const localSign = crypto.createHmac("sha1", bucket.password).update(ori).digest("base64");
        // 获取响应头信息中签名字符串
        const remoteSign = auth.substr(auth.lastIndexOf(":") + 1);
        if (localSign === remoteSign) {
            return true;
        }
        return false;
    }

}
