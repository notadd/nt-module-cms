import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AbstractFile } from "./abstract.file";
import { Bucket } from "./bucket.entity";

@Entity("file")
export class File extends AbstractFile {

    @Column({ nullable: true })
    bucketId: number;

    @ManyToOne(type => Bucket, bucket => bucket.files, {
        cascade: false,
        nullable: false,
        lazy: false,
        eager: false
    })
    @JoinColumn()
    bucket: Bucket;
}
