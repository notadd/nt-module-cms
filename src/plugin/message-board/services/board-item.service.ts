import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BoardItem } from "../entities/board-item.entity";
import { Repository } from "typeorm";
import { Item } from "src/articles/entities/item.entity";
import { UpdateBoardItemInput } from "../interfaces/message-board.interface";
import { RpcException } from "@nestjs/microservices";
import { Leaveword } from "../entities/leaveword.entity";

@Injectable()
export class BoardItemService {
    constructor(
        @InjectRepository(BoardItem) private readonly biRepo: Repository<BoardItem>,
        @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
        @InjectRepository(Leaveword) private readonly lwRepo: Repository<Leaveword>,
    ) { }

    async updateBoardItem(updateBoardItem: UpdateBoardItemInput) {
        const exist = await this.biRepo.findOne(updateBoardItem.id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该留言板信息项不存在!' });
        }
        if (updateBoardItem.alias && updateBoardItem.alias !== exist.alias) {
            if(await this.biRepo.findOne({where:{alias:updateBoardItem.alias}})){
                throw new RpcException({code:406,message:'别名重复!'});
            }
        }
        const item = await this.itemRepo.findOne(updateBoardItem.item);
        await this.biRepo.save(this.biRepo.create({
            id:updateBoardItem.id,
            alias:updateBoardItem.alias,
            item,
            required: updateBoardItem.required
        }))
    }

    async deleteBoardItem(id:number){
        const exist = await this.biRepo.findOne(id);
        if(!exist) {
            throw new RpcException({code:404,message:'该信息项不存在!'});
        }
        await this.biRepo.remove(exist);
        const leavewords = await this.lwRepo.find({where:{messageBoard:exist.messageBoard}});
        const ids = leavewords.map(item=>item.id);
        const infos = await this.biRepo.createQueryBuilder('boardItem')
        .leftJoinAndSelect('boardItem.leaveword','Leaveword')
        .where('Leaveword.id IN(:...ids)',{ids})
        .getMany();
        await this.biRepo.remove(infos);
    }

}