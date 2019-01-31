
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/* 文件抽象类，提取了五种文件类型公有属性 */
export class AbstractFile {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50 })
    rawName: string;

    @Column({ length: 50, unique: true })
    name: string;

    @Column({ nullable: true, type: "simple-array" })
    tags: Array<string>;

    @Column({ length: 50 })
    md5: string;

    @Column({ length: 20, nullable: true })
    type: string;

    @Column({ nullable: true })
    size: number;

    // 访问密钥
    @Column({ length: "50", nullable: true })
    contentSecret: string;

    @Column({ nullable: false })
    status: string;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;
}
