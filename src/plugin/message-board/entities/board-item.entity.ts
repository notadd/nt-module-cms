import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { MessageBoard } from "./message-board.entity";
import { Item } from "src/articles/entities/item.entity";

@Entity('board_item')
export class BoardItem {
    
    @PrimaryGeneratedColumn()
    id:number;

    @Column({
        comment: '显示名称'
    })
    name: string;

    @Column({
        comment: '别名'
    })
    alias: string;

    @Column({
        comment: '是否必填',
        default: false
    })
    required: boolean;

    @ManyToOne(type=>MessageBoard,messageBoard=>messageBoard.boardItems)
    messageBoard: MessageBoard;

    @ManyToOne(type=>Item,item=>item.boardItems)
    item: Item;

}