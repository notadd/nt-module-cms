import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DiscussService } from "../services/discuss.service";
import { Discuss } from "../entities/discuss.entity";
import { CreateDiscuss } from "../interfaces/discuss.interface";

@Controller()
export class DiscussController {
    constructor(
        @Inject(DiscussService) private readonly discussService: DiscussService
    ) { }

    @GrpcMethod('DiscussService')
    async createDiscuss(body: { discuss: CreateDiscuss }) {
        await this.discussService.createDiscuss(body.discuss);
        return { code: 200, message: '评论成功!' };
    }

    @GrpcMethod('DiscussService')
    async deleteDiscuss(body: { id: number }) {
        await this.discussService.deleteDiscuss(body.id);
        return { code: 200, message: '删除成功!' };
    }

    @GrpcMethod('DiscussService')
    async auditDiscuss(body: { id: number, op: number }) {
        await this.discussService.auditDiscuss(body.id, body.op);
        return { code: 200, message: '审核成功!' };
    }

    @GrpcMethod('DiscussService')
    async getAllDiscusss(body: { pageNUmber: number, pageSize: number, content: string, artTitle: string, artId: number, username: string, startTime: string, endTime: string }) {
        const result = await this.discussService.getAllDiscusss(body.pageNUmber, body.pageSize, body.content, body.artTitle, body.artId, body.username, body.startTime, body.endTime);
        return { code: 200, message: '查询成功!', total: result.total, data: result.data };
    }

    @GrpcMethod('DiscussService')
    async updateDiscuss(body: { discuss: Discuss }) {
        await this.discussService.updateDiscuss(body.discuss);
        return { code: 200, message: '修改成功!' };
    }

    @GrpcMethod('DiscussService')
    async getOneDiscuss(body: { id: number }) {
        const data = await this.discussService.getOneDiscuss(body.id);
        return { code: 200, message: '查询成功!', data };
    }

}