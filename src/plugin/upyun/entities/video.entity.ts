import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AbstractFile } from "./abstract.file";
import { Bucket } from "./bucket.entity";

@Entity("video")
export class Video extends AbstractFile {

    @Column({ nullable: true })
    bucketId: number;

    @ManyToOne(type => Bucket, bucket => bucket.videos, {
        cascade: false,
        nullable: false,
        lazy: false,
        eager: false
    })
    @JoinColumn()
    bucket: Bucket;
}
