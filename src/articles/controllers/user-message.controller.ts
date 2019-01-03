import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from '@nestjs/microservices';
import { UserMessageService } from "../services/user-message.service";

@Controller()
export class UserMessageController {
    constructor(
        @Inject(UserMessageService) private readonly userMessageService: UserMessageService
    ) { }

    @GrpcMethod('UserMessageService')
    async getMessageByUserId(body: { pageNumber: number, pageSize: number, id: number }) {
        const data = (await this.userMessageService.getMessageByUserId(body.pageNumber, body.pageSize, body.id)).data;
        const total = (await this.userMessageService.getMessageByUserId(body.pageNumber, body.pageSize, body.id)).total;
        return { code: 200, message: '删除成功!', data, total };
    }

    @GrpcMethod('UserMessageService')
    async getMessageById(body: { id: number }) {
        const data = await this.userMessageService.getMessageById(body.id);
        return { code: 200, message: '查找成功!', data };
    }

    @GrpcMethod('UserMessageService')
    async delMessageByIds(body: { ids: number[] }) {
        await this.userMessageService.deleteMessageById(body.ids);
        return { code: 200, message: '删除成功!' };
    }

    @GrpcMethod('UserMessageService')
    async readMessageById(body: { id: number }) {
        await this.userMessageService.readMessageById(body.id);
        return { code: 200, message: '设置已读成功!' };
    }

    @GrpcMethod('UserMessageService')
    async readAll(body: { id: number }) {
        await this.userMessageService.readAll(body.id);
        return { code: 200, message: '设置已读成功!' };
    }

}