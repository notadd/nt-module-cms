import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository, In } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { MessageEntity } from "../entities/message.entity";


@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(MessageEntity) private readonly mesRepo: Repository<MessageEntity>,
    ) { }

    async createMessage(content: string, owner: number) {
        try {
            await this.mesRepo.save(this.mesRepo.create({
                content, owner
            }))
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    async deleteMessageById(id: number) {
        try {
            await this.mesRepo.delete(id);
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
        const s = [0];
        s.push(id);
        const exist = await this.mesRepo.createQueryBuilder('message')
            // .where(`'message.owner in (${id},null) '`)
            // .where('message.owner IN (:...owners) ', { owners: `${id},0` })
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