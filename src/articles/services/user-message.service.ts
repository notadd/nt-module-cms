import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository, In } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { UserMessage } from "../entities/user-message.entity";


@Injectable()
export class UserMessageService {
    constructor(
        @InjectRepository(UserMessage) private readonly umesRepo: Repository<UserMessage>,
    ) { }

    async getMessageByUserId(pageNumber: number, pageSize: number, id: number) {
        try {
            const exist = await this.umesRepo.createQueryBuilder('message')
                .orderBy({ '"message"."createdAt"': 'DESC' })
                .skip(pageSize * (pageNumber - 1))
                .take(pageSize)
                .getManyAndCount();
            return { data: exist[0], total: exist[1] };
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    async getMessageById(id: number) {
        try {
            const data = await this.umesRepo.findOne(id);
            return data;
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    async deleteMessageById(ids: number[]) {
        try {
            const exist = await this.umesRepo.findByIds(ids);
            await this.umesRepo.remove(exist);
        } catch (err) {
            throw new RpcException({ code: 400, message: err.toString() });
        }
    }

    async readMessageById(id: number) {
        const news = await this.umesRepo.findOne({ id });
        news.state = true;
        await this.umesRepo.save(this.umesRepo.create(news));
        return 'success';
    }

    async readAll(id: number) {
        await this.umesRepo.createQueryBuilder().update(UserMessage).set({ state: true }).where({ owner: id }).execute();
    }

}