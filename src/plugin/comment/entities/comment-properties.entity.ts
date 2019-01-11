import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('comment_properties')
export class CommentProperties {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        comment: '开启评论',
        default: true
    })
    enableComment: boolean;

    @Column({
        comment: '开启审核',
        default: false
    })
    needAudit: boolean;

    @Column({
        comment: '开启star',
        default: false
    })
    enableStar: boolean;


}