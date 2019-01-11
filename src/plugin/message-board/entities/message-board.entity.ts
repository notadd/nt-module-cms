import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { BoardItem } from "./board-item.entity";
import { Leaveword } from "./leaveword.entity";
import * as moment from 'moment';

@Entity('message-board')
export class MessageBoard {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        comment: '留言板名称'
    })
    name: string;

    @Column({
        comment: '留言板别名',
        unique: true
    })
    alias: string;

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

    @OneToMany(type => BoardItem, boardItem => boardItem.messageBoard)
    boardItems: [];

    @OneToMany(type => Leaveword, leaveword => leaveword.messageBoard)
    leavewords: Leaveword[];

}