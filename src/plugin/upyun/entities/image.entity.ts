import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AbstractFile } from "./abstract.file";
import { Bucket } from "./bucket.entity";

@Entity("image")
export class Image extends AbstractFile {

    @Column({ nullable: true })
    width: number;

    @Column({ nullable: true })
    height: number;

    @Column({ nullable: true })
    frames: number;

    @Column({ nullable: true })
    bucketId: number;

    @ManyToOne(type => Bucket, bucket => bucket.images, {
        cascade: false,
        nullable: false,
        lazy: false,
        eager: false
    })
    @JoinColumn()
    bucket: Bucket;
}
