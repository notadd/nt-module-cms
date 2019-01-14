import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { MessageBoard } from "./message-board.entity";
import { LeavewordInfo } from "./leaveword-info.entity";

@Entity('leaveword')
export class Leaveword{

    @PrimaryGeneratedColumn()
    id:number;

    @Column({
        comment: '留言用户'
    })
    userId: number;

    @ManyToOne(type=>MessageBoard,messageBoard=>messageBoard.leavewords)
    messageBoard: MessageBoard;

    @OneToMany(type=>LeavewordInfo,leavewordInfo=>leavewordInfo.leaveword)
    leaveWordInfos: LeavewordInfo[];

}