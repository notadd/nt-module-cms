
import { Injectable, HttpException, Inject } from "@nestjs/common";
import { ImagePostProcessInfo, ImagePreProcessInfo } from "../interface/file/image.process.info";
import { KindUtil } from "./kind.util";
import { Bucket } from "../entities/bucket.entity";

/* URL做图处理字符串服务，可以根据请求体参数，拼接URL处理字符串 */
@Injectable()
export class ProcessStringUtil {

    private readonly gravity: Set<string> = new Set([ "northwest", "north", "northeast", "west", "center", "east", "southwest", "south", "southeast" ]);

    constructor(
        @Inject(KindUtil) private readonly kindUtil: KindUtil
    ) {}

    // 根据请求体参数生成处理字符串
    makeImageProcessString(bucket: Bucket, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): string {
        // 分别获取缩放、裁剪、水印、旋转、圆角、高斯模糊、锐化、输出格式、图片质量、是否渐进显示、是否去除元信息等参数
        let processString = "";
        if (!imageProcessInfo || !bucket) {
            return processString;
        }
        if (imageProcessInfo.resize) { processString += this.resizeString(imageProcessInfo.resize); }
        if (imageProcessInfo.tailor) { processString += this.tailorString(imageProcessInfo.tailor); }
        processString += this.watermarkString(imageProcessInfo.watermark, bucket);
        if (imageProcessInfo.rotate) { processString += this.rotateString(imageProcessInfo.rotate); }
        if (imageProcessInfo instanceof ImagePostProcessInfo) {
            if (imageProcessInfo.blur) { processString += this.blurString(imageProcessInfo.blur); }
            if (imageProcessInfo.sharpen || imageProcessInfo.format || imageProcessInfo.lossless || imageProcessInfo.quality || imageProcessInfo.progressive || imageProcessInfo.strip) {
                processString += this.outputString(imageProcessInfo.sharpen, imageProcessInfo.format, imageProcessInfo.lossless, imageProcessInfo.quality, imageProcessInfo.progressive, imageProcessInfo.strip);
            }
        }
        return processString;
    }

    /*生成缩放字符串
      支持的缩放模式有：
      scale：  指定比例，长宽等比例缩放
      wscale:  指定比例，只缩放宽度，高度不变
      hscale:  指定比例，只缩放高度，宽度不变
      both：   指定宽高值，强制缩放不裁剪
      fw：     指定宽度，等比缩放
      fh：     指定高度，等比缩放
      fp：     指定像素积，等比缩放
      fwfh：   限定宽高最大值，宽高都不足时，不缩放，应该是让图片等比缩放到可以完全放进指定矩形的意思
      fwfh2：  限定宽高最小值，宽高都大于指定值时，不缩放，应该是让图片等比缩放到可以完全包含指定矩形的意思
      其中fw、fh、fp等，在有拍云中原意是限定宽度最大值，即只缩小不放大，加上/force/true的意思应该是指定而不是限定，需要验证
      如果需要限定最大值功能，后面再加，因为七牛云大部分都是指定值
    */
    resizeString(resize: any) {
        // 不存在直接返回，不抛出错误，进行下一步
        if (!resize) {
            return "";
        }
        // 缩放模式
        const mode = resize.mode;
        // 缩放数据
        const info = resize.data;
        if (mode === "scale") {
            if (info.scale && Number.isInteger(info.scale) && info.scale >= 1 && info.scale <= 1000) {
                // 这里的/force是为了保险
                return "/scale/" + info.scale + "/force/true";
            }
            throw new HttpException("比例参数不正确", 405);
        } else if (mode === "wscale") {
            if (info.wscale && Number.isInteger(info.wscale) && info.wscale >= 1 && info.wscale <= 1000) {
                // 为了保险，经验证这里可以不加/force/true
                return "/wscale/" + info.wscale + "/force/true";
            }
            throw new HttpException("宽度比例参数不正确", 405);
        } else if (mode === "hscale") {
            if (info.hscale && Number.isInteger(info.hscale) && info.hscale >= 1 && info.hscale <= 1000) {
                // 为了保险，经验证这里可以不加/force/true
                return "/hscale/" + info.hscale + "/force/true";
            }
            throw new HttpException("高度比例参数不正确", 405);
        } else if (mode === "both") {
            if (info.width && Number.isInteger(info.width) && info.height && Number.isInteger(info.height)) {
                // 指定force强制缩放，否则宽高不足时会居中裁剪后缩放
                // 经验证不加/force/true图片边缘处有变化，这个居中裁剪后缩放不是字面意思
                return "/both/" + info.width + "x" + info.height + "/force/true";
            }
            throw new HttpException("宽高参数不正确", 405);
        }
        else if (mode === "fw") {
            if (info.width && Number.isInteger(info.width)) {
                // 强制指定可以放大，经验证这个必须加上/force/true才能放大
                return "/fw/" + info.width + "/force/true";
            }
            throw new HttpException("宽度参数不正确", 405);
        } else if (mode === "fh") {
            if (info.height && Number.isInteger(info.height)) {
                // 强制指定可以放大，经验证这个必须加上/force/true才能放大
                return "/fh/" + info.height + "/force/true";
            }
            throw new HttpException("高度参数不正确", 405);
        } else if (mode === "fp") {
            if (info.pixel && Number.isInteger(info.pixel) && info.pixel >= 1 && info.pixel <= 25000000) {
                // 强制指定可以放大，经验证这个必须加上/force/true才能放大
                return "/fp/" + info.pixel + "/force/true";
            }
            throw new HttpException("像素参数不正确", 405);
        } else if (mode === "fwfh") {
            if (info.width && Number.isInteger(info.width) && info.height && Number.isInteger(info.height)) {
                // 加上force，代表可以放大缩小，但是缩放后必须可以被指定矩形完全包含
                return "/fwfh/" + info.width + "x" + info.height + "/force/true";
            }
            throw new HttpException("宽高参数不正确", 405);
        } else if (mode === "fwfh2") {
            if (info.width && Number.isInteger(info.width) && info.height && Number.isInteger(info.height)) {
                // 加上force，代表可以放大缩小，但是缩放后必须可以完全包含指定矩形
                return "/fwfh2/" + info.width + "x" + info.height + "/force/true";
            }
            throw new HttpException("宽高参数不正确", 405);
        } else {
            throw new HttpException("缩放模式不正确", 405);
        }
    }

    /* 生成裁剪字符串，可以在缩放之前或之后裁剪
       暂定坐标都只能为整数，a为正向(即向东南/右下偏移)，s为负向(即向西北/左上偏移)
       但是在七牛云中，可以使用-x来代表为指定宽度减去指定值，这里有歧义，七牛云的坐标不知道可不可以为负值，反正七牛云中没有a、s之说
     */
    tailorString(tailor: any) {
        if (!tailor) {
            return "";
        }
        const { isBefore, width, height, x, y, gravity } = tailor;
        let str = "";
        if (isBefore !== undefined && isBefore !== undefined && isBefore === true) {
            str += "/crop";
        } else if (isBefore !== undefined && isBefore !== undefined && isBefore === false) {
            str += "/clip";
        } else if (isBefore === undefined && isBefore === undefined) {
            // 默认为缩放之后裁剪
            str += "/clip";
        } else {
            throw new HttpException("裁剪顺序指定错误", 405);
        }

        if (width && Number.isInteger(width) && height && Number.isInteger(height) && x && Number.isInteger(x) && y && Number.isInteger(y)) {
            str += "/" + width + "x" + height;
        } else {
            throw new HttpException("裁剪宽高参数不正确", 405);
        }
        if (x && Number.isInteger(x) && x >= 0) {
            str += "a" + x;
        } else if (x && Number.isInteger(x) && x < 0) {
            str += "s" + x;
        } else {
            throw new HttpException("x参数不正确", 405);
        }
        if (y && Number.isInteger(y) && y >= 0) {
            str += "a" + y;
        } else if (y && Number.isInteger(y) && y < 0) {
            str += "s" + y;
        } else {
            throw new HttpException("y参数不正确", 405);
        }

        if (gravity && this.gravity.has(gravity)) {
            str += "/gravity/" + gravity;
        } else if (!gravity) {
            // 默认为西北角
            str += "/gravity/northwest";
        } else {
            throw new HttpException("裁剪重心参数不正确", 405);
        }
        return str;
    }

    /* 生成水印字符串
       水印配置只有全局一个
       默认情况下全局启用水印，所有图片都打水印
       可以通过参数覆盖全局启用配置
    */
    watermarkString(watermark: boolean, bucket: Bucket) {
        let enable: boolean;
        if (watermark === true) {
            enable = true;
        } else if (watermark === false) {
            enable = false;
        } else if (watermark === undefined || watermark === undefined) {
            if (bucket.imageConfig.watermarkEnable === 1) {
                enable = true;
            } else if (bucket.imageConfig.watermarkEnable === 0) {
                enable = false;
            } else {
                enable = false;
            }
        } else {
            throw new HttpException("水印参数不正确", 405);
        }
        let str = "";
        if (enable) {
            if (bucket.imageConfig.watermarkSaveKey) {
                str += "/watermark/url/" + Buffer.from(bucket.imageConfig.watermarkSaveKey).toString("base64");
            } else {
                throw new HttpException("水印图片url不存在", 405);
            }

            if (bucket.imageConfig.watermarkGravity && !this.gravity.has(bucket.imageConfig.watermarkGravity)) {
                throw new HttpException("水印重心参数不正确", 405);
            } else {
                str += "/align/" + bucket.imageConfig.watermarkGravity;
            }

            if ((bucket.imageConfig.watermarkX && !Number.isInteger(bucket.imageConfig.watermarkX)) || (bucket.imageConfig.watermarkY && !Number.isInteger(bucket.imageConfig.watermarkY))) {
                throw new HttpException("偏移参数不正确", 405);
            } else if (!bucket.imageConfig.watermarkX && !bucket.imageConfig.watermarkY) {
                str += "/margin/20x20";
            } else if (!bucket.imageConfig.watermarkX && bucket.imageConfig.watermarkY) {
                str += "/margin/20x" + bucket.imageConfig.watermarkY;
            } else if (bucket.imageConfig.watermarkX && !bucket.imageConfig.watermarkY) {
                str += "/margin/" + bucket.imageConfig.watermarkX + "x20";
            } else {
                str += "/margin/" + bucket.imageConfig.watermarkX + "x" + bucket.imageConfig.watermarkY;
            }

            if (bucket.imageConfig.watermarkOpacity && !Number.isInteger(bucket.imageConfig.watermarkOpacity)) {
                throw new HttpException("透明度参数不正确", 405);
            } else if (!bucket.imageConfig.watermarkOpacity) {
                // 默认为100，不用管
            } else {
                str += "/opacity/" + bucket.imageConfig.watermarkOpacity;
            }

            if (bucket.imageConfig.watermarkWs && Number.isInteger(bucket.imageConfig.watermarkWs) && bucket.imageConfig.watermarkWs >= 1 && bucket.imageConfig.watermarkWs <= 100) {
                str += "/percent/" + bucket.imageConfig.watermarkWs;
            } else if (!bucket.imageConfig.watermarkWs) {
                // 默认为0，不用管
            } else {
                throw new HttpException("短边自适应参数不正确", 405);
            }
        }
        return str;
    }

    rotateString(rotate: number) {
        if (!rotate) {
            return "";
        }
        if (Number.isInteger(rotate)) {
            return "/rotate/" + rotate;
        } else {
            throw new HttpException("旋转角度不正确", 405);
        }
    }

    blurString(blur: any) {
        if (!blur) {
            return "";
        }
        const { redius, sigma } = blur;
        if (!redius || !Number.isInteger(redius) || redius < 0 || redius > 50) {
            throw new HttpException("模糊半径不正确", 405);
        }
        if (!sigma || !Number.isInteger(sigma)) {
            throw new HttpException("标准差不正确", 405);
        }
        return "/gaussblur/" + redius + "x" + sigma;
    }

    outputString(sharpen: boolean, format: string, lossless: boolean, quality: number, progressive: boolean, strip: boolean) {
        let str = "";
        if (sharpen === true) {
            str += "/unsharp/true";
        } else if (sharpen) {
            throw new HttpException("锐化参数不正确", 405);
        } else {
            // false或者不存在都不管
        }
        if (format && this.kindUtil.isImage(format)) {
            str += "/format/" + format;
        } else if (format && !this.kindUtil.isImage(format)) {
            throw new HttpException("格式参数不正确", 405);
        } else {
        }

        if (lossless === true) {
            str += "/lossless/true";
        } else if (sharpen) {
            throw new HttpException("无损参数不正确", 405);
        } else {
            // false或者不存在都不管
        }

        if (quality && Number.isInteger(quality) && quality >= 1 && quality <= 99) {
            str += "/quality/" + quality;
        } else if (!quality) {
        } else {
            throw new HttpException("图片质量参数不正确", 405);
        }

        if (progressive === true) {
            str += "/progressive/true";
        } else if (progressive) {
            throw new HttpException("渐进参数不正确", 405);
        } else {
            // false或者不存在都不管
        }

        if (strip === true) {
            str += "/strip/true";
        } else if (strip) {
            throw new HttpException("去除元信息参数不正确", 405);
        } else {
            // false或者不存在都不管
        }
        return str;
    }
}
