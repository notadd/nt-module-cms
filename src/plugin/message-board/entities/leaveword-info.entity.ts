import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Leaveword } from "./leaveword.entity";
import { Item } from "src/articles/entities/item.entity";

@Entity('leaveword_info')
export class LeavewordInfo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    value: string;

    @ManyToOne(type => Leaveword, leaveword => leaveword.leaveWordInfos, {
        onDelete: 'CASCADE'
    })
    leaveword: Leaveword;

    @ManyToOne(type => Item, item => item.leavewordInfos, {
        onDelete: 'CASCADE'
    })
    item: Item;

}