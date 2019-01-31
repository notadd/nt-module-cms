import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Bucket } from "./bucket.entity";

/* 音频配置实体类 */
@Entity("audioConfig")
export class AudioConfig {

    // 主键，需要设置插入，1默认为公有空间配置，2默认为私有空间配置
    @PrimaryColumn()
    id: number;

    // 保存格式，raw、mp3、aac
    @Column({ nullable: true })
    format: string;

    @Column({ nullable: true, unique: true })
    bucketId: number;

    @OneToOne(type => Bucket, bucket => bucket.audioConfig)
    @JoinColumn()
    bucket: Bucket;
}
