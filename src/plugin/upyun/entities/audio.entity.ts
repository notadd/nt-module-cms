import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AbstractFile } from "./abstract.file";
import { Bucket } from "./bucket.entity";

@Entity("audio")
export class Audio extends AbstractFile {

    @Column({ nullable: true })
    bucketId: number;

    @ManyToOne(type => Bucket, bucket => bucket.audios, {
        cascade: false,
        nullable: false,
        lazy: false,
    })
    @JoinColumn()
    bucket: Bucket;
}
