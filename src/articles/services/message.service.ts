import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository, In } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { Message } from "../entities/message.entity";
import { UserMessage } from "../entities/user-message.entity";


@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message) private readonly mesRepo: Repository<Message>,
        @InjectRepository(UserMessage) private readonly umesRepo: Repository<UserMessage>,
    ) { }

    /**
     * 创建通知信息
     * 
     * @param content 信息内容
     * @param owner 所属用户
     */
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

    /**
     * 批量删除通知信息
     * 
     * @param ids 批量删除的通知信息id
     */
    async deleteMessageById(ids: number[]) {
        try {
            const exist = await this.mesRepo.findByIds(ids);
            await this.mesRepo.remove(exist);
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    /**
     * 后台获取所有通知消息
     * 
     * @param pageNumber 当前页码
     * @param pageSize 每页显示数量
     * @param startTime 起始时间
     * @param endTime 截止时间
     */
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
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    /**
     * 获取指定用户的所有通知信息
     * 
     * @param pageNumber 当前页码
     * @param pageSize 每页显示数量
     * @param startTime 起始时间
     * @param endTime 截止时间
     * @param id 用户id
     */
    async getMessageByUserId(pageNumber: number, pageSize: number, startTime: string, endTime: string, id: number) {
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