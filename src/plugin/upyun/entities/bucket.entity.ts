import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { AudioConfig } from "./audio.config.entity";
import { Audio } from "./audio.entity";
import { Document } from "./document.entity";
import { File } from "./file.entity";
import { ImageConfig } from "./image.config.entity";
import { Image } from "./image.entity";
import { VideoConfig } from "./video.config.entity";
import { Video } from "./video.entity";

/* 后台配置实体类 */
@Entity("bucket")
export class Bucket {

    // 主键，需要设置插入，1默认为公有空间配置，2默认为私有空间配置
    @PrimaryColumn()
    id: number;

    // 公有还是私有空间，值为public、private
    @Column({ length: 20, unique: true })
    publicOrPrivate: string;

    // 空间名
    @Column({ length: 50, unique: true })
    name: string;

    // 操作员名
    @Column({ length: 50 })
    operator: string;

    // 操作员密码的md5
    @Column({ length: 50 })
    password: string;

    // 此空间下所有文件都存储于这个目录里,与虚拟目录无关
    @Column({ length: 20 })
    directory: string;

    // 请求过期时间，单位秒
    @Column()
    requestExpire: number;

    // 基本url
    @Column({ length: 50, unique: true })
    baseUrl: string;

    // token密钥
    @Column({ length: 250, nullable: true })
    tokenSecretKey: string;

    // token过期时间，单位秒
    @Column({ nullable: true })
    tokenExpire: number;

    /*
    这里lazy:false的意思不是每个Bucket查询出来的时候就会包含imageConfig
    它的意思只是在于获取的属性是否是Promise，而要查询出来的Bucket包含imageConfig，必须使用find({relation:xxxx})
    */
    @OneToOne(type => ImageConfig, imageConfig => imageConfig.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    imageConfig: ImageConfig;

    @OneToOne(type => AudioConfig, audioConfig => audioConfig.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    audioConfig: AudioConfig;

    @OneToOne(type => VideoConfig, videoConfig => videoConfig.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    videoConfig: VideoConfig;

    @OneToMany(type => File, file => file.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    files: Array<File>;

    @OneToMany(type => Image, image => image.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    images: Array<Image>;

    @OneToMany(type => Audio, audio => audio.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    audios: Array<Audio>;

    @OneToMany(type => Video, video => video.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    videos: Array<Video>;

    @OneToMany(type => Document, document => document.bucket, {
        cascade: ["insert"],
        lazy: false,
        eager: false
    })
    documents: Array<Document>;
}
