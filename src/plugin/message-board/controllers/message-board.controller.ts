import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { MessageBoardService } from "../services/message-board.service";
import { CreateBoardInput, UpdateBoardInput } from "../interfaces/message-board.interface";

@Controller()
export class MessageBoardController {
    constructor(
        @Inject(MessageBoardService) private readonly mbService: MessageBoardService,
    ) { }

    @GrpcMethod('MessageBoardService')
    async createMessageBoard(body: { messageBoard: CreateBoardInput }) {
        await this.mbService.createMessageBoard(body.messageBoard);
        return { code: 200, message: '创建留言板成功!' };
    }

    @GrpcMethod('MessageBoardService')
    async updateMessageBoard(body: { messageBoard: UpdateBoardInput }) {
        await this.mbService.updateMessageBoard(body.messageBoard);
        return { code: 200, message: '修改留言板成功!' };
    }

    @GrpcMethod('MessageBoardService')
    async deleteMessageBoard(body: { id: number }) {
        await this.mbService.deleteMessageBoard(body.id);
        return { code: 200, message: '删除留言板成功!' };
    }

    @GrpcMethod('MessageBoardService')
    async getAllMessageBoard(body: { pageNumber: number, pageSize: number }) {
        const result = await this.mbService.getAllMessageBoard(body.pageNumber, body.pageSize);
        return { code: 200, message: '查询成功!', total: result.total, data: result.data };
    }

    @GrpcMethod('MessageBoardService')
    async getOneMessageBoard(body: { id: number }) {
        const data = await this.mbService.getOneMessageBoard(body.id);
        return { code: 200, message: '查询成功!', data };
    }

    @GrpcMethod('MessageBoardService')
    async getMessageBoardContent(body: { id: number, pageNumber: number, pageSize: number }) {
        const data = await this.mbService.getMessageBoardContent(body.id, body.pageNumber, body.pageSize);
        return { code: 200, message: '查询成功!', data };
    }

}