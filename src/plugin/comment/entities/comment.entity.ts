import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import * as moment from 'moment';
import { Article } from "src/articles/entities/article.entity";

@Entity('comment')
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        comment: '评论内容',
        type: 'text'
    })
    content: string;

    @Column({
        nullable: true,
        transformer: {
            from: (date) => {
                return moment(date).format('YYYY-MM-DD HH:mm:ss');
            },
            to: (date) => {
                date = date ? date : new Date();
                return moment(date).format('YYYY-MM-DD HH:mm:ss');
            }
        }
    })
    time: string;

    // 0:待审核,1:审核通过,2: 拒绝
    @Column({
        comment: '评论状态',
        default: true
    })
    status: number;

    @Column({
        comment: '发布人',
        nullable: true
    })
    userId: number;

    @ManyToOne(type => Article, article => article.comments, { onDelete: 'CASCADE', cascade: true })
    article: Article;

}