import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from '@nestjs/microservices';
import { MessageService } from "../services/message.service";

@Controller()
export class MessageController {
    constructor(
        @Inject(MessageService) private readonly messageService: MessageService
    ) { }

    @GrpcMethod('MessageService')
    async createMessage(body: { content: string, owner: number }) {
        await this.messageService.createMessage(body.content, body.owner);
        return { code: 200, message: '发送成功!' };
    }

    @GrpcMethod('MessageService')
    async deleteMessageById(body: { ids: number[] }) {
        await this.messageService.deleteMessageById(body.ids);
        return { code: 200, message: '删除成功!' };
    }

    @GrpcMethod('MessageService')
    async getAllMessage(body: { pageNumber: number, pageSize: number, startTime: string, endTime: string }) {
        const data = (await this.messageService.getAllMessage(body.pageNumber, body.pageSize, body.startTime, body.endTime)).data;
        const total = (await this.messageService.getAllMessage(body.pageNumber, body.pageSize, body.startTime, body.endTime)).total;
        return { code: 200, message: '查询成功!', data, total };
    }

    @GrpcMethod('MessageService')
    async getMessageByUserId(body:{ pageNumber: number, pageSize: number, startTime: string, endTime: string ,id:number}){
        const data = (await this.messageService.getMessageByUserId(body.pageNumber, body.pageSize, body.startTime, body.endTime,body.id)).data;
        const total = (await this.messageService.getMessageByUserId(body.pageNumber, body.pageSize, body.startTime, body.endTime,body.id)).total;
        return { code: 200, message: '查询成功!', data, total };
    }

}