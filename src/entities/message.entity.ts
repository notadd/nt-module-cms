import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from 'typeorm';
const moment = require('moment');

@Entity('message-details')
export class MessageEntity {

    @PrimaryGeneratedColumn()
    id: number;

    /*内容*/
    @Column({
        name: 'content',
        type: 'text'
    })
    content: string;

    /*发布时间*/
    @CreateDateColumn({
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
}