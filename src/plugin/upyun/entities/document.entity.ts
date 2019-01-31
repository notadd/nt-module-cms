import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AbstractFile } from "./abstract.file";
import { Bucket } from "./bucket.entity";

@Entity("document")
export class Document extends AbstractFile {

    @Column({ nullable: true })
    bucketId: number;

    @ManyToOne(type => Bucket, bucket => bucket.documents, {
        cascade: false,
        nullable: false,
        lazy: false,
        eager: false
    })
    @JoinColumn()
    bucket: Bucket;
}
