import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository, In } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { MessageEntity } from "../entities/message.entity";
import { UserMessage } from "../entities/user-message.entity";


@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(MessageEntity) private readonly mesRepo: Repository<MessageEntity>,
        @InjectRepository(UserMessage) private readonly umesRepo: Repository<UserMessage>,
    ) { }

    async createMessage(content: string, owner: number) {
        try {
            await this.mesRepo.save(this.mesRepo.create({
                content, owner
            }))
            await this.umesRepo.save(this.umesRepo.create({

            }))
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    async deleteMessageById(ids: number[]) {
        try {
            const exist = await this.mesRepo.findByIds(ids);
            await this.mesRepo.remove(exist);
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    async getAllMessage(pageNumber: number, pageSize: number, startTime: string, endTime: string) {
        try {
            const exist = await this.mesRepo.createQueryBuilder('message')
                .where('case when :startTime1 <> \'\' then "createdAt" >= :startTime2 and "createdAt" <= :endTime else "createdAt" is not null end', {
                    startTime1: startTime ? startTime : '',
                    startTime2: startTime ? startTime : '1970-1-1 00:00:00',
                    endTime: endTime ? endTime : new Date(),
                })
                .orderBy({ '"message"."createdAt"': 'DESC' })
                .skip(pageSize * (pageNumber - 1))
                .take(pageSize)
                .getManyAndCount();
            return { data: exist[0], total: exist[1] };
        } catch (err) {
            throw new RpcException({code:400,message:err.toString()});
        }
    }

    async getMessageByUserId(pageNumber: number, pageSize: number, startTime: string, endTime: string,id:number){
        const s = [];
        s.push(id);
        const exist = await this.mesRepo.createQueryBuilder('message')
            .where('message.owner IN(' + s + ')')
            .andWhere('case when :startTime1 <> \'\' then "createdAt" >= :startTime2 and "createdAt" <= :endTime else "createdAt" is not null end', {
                startTime1: startTime ? startTime : '',
                startTime2: startTime ? startTime : '1970-1-1 00:00:00',
                endTime: endTime ? endTime : new Date(),
            })
            .orderBy({ '"message"."createdAt"': 'DESC' })
            .skip(pageSize * (pageNumber - 1))
            .take(pageSize)
            .getManyAndCount();
        return { data: exist[0], total: exist[1] };
    }

}