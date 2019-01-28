import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { CreateLeavewordInput } from "../interfaces/leaveword.interface";
import { LeavewordService } from "../services/leaveword.service";

@Controller()
export class LeavewordController {
    constructor(
        @Inject(LeavewordService) private readonly leavewordService: LeavewordService,
    ) { }

    @GrpcMethod('LeavewordService')
    async createLeaveword(body: { createLeaveword: CreateLeavewordInput }) {
        await this.leavewordService.createLeaveword(body.createLeaveword);
        return { code: 200, message: '留言成功!' };
    }

    @GrpcMethod('LeavewordService')
    async deleteLeaveword(req, body: { id: number }) {
        await this.leavewordService.deleteLeaveword(body.id);
        return { code: 200, message: '删除成功!' };
    }

}