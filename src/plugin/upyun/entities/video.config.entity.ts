import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Bucket } from "./bucket.entity";

/* 视频配置实体类 */
@Entity("videoConfig")
export class VideoConfig {

    // 主键，需要设置插入，1默认为公有空间配置，2默认为私有空间配置
    @PrimaryColumn()
    id: number;

    // 保存格式，raw、vp9、h264、h265
    @Column({ nullable: true })
    format: string;

    // 分辨率，raw、1080p、720p、480p
    @Column({ nullable: true })
    resolution: string;

    @OneToOne(type => Bucket, bucket => bucket.videoConfig)
    @JoinColumn()
    bucket: Bucket;
}
