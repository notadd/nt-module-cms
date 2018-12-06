import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import * as moment from 'moment';

@Entity('user_message')
export class UserMessage {

    @PrimaryGeneratedColumn()
    id: number;

    /*内容*/
    @Column({
        name: 'content',
        type: 'text'
    })
    content: string;

    /*发布时间*/
    @Column({
        transformer: {
            from(raw: Date): string {
                return moment(raw).format('YYYY-MM-DD HH:mm:ss');
            },
            to(): Date {
                return new Date();
            }
        }
    })
    createdAt: string;
    
    /* 消息所属人 */
    @Column({
        nullable: true
    })
    owner: number;

    /* 是否已读 */
    @Column({
        default: false
    })
    state: boolean;


}