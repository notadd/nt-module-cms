import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { CommentService } from "../services/comment.service";
import { CreateComment } from "../interfaces/comment.interface";
import { Comment } from "../entities/comment.entity";

@Controller()
export class CommentController {
    constructor(
        @Inject(CommentService) private readonly commentService: CommentService
    ) { }

    @GrpcMethod('CommentService')
    async createComment(body: { comment: CreateComment }) {
        await this.commentService.createComment(body.comment);
        return { code: 200, message: '评论成功!' };
    }

    @GrpcMethod('CommentService')
    async deleteComment(body: { id: number }) {
        await this.commentService.deleteComment(body.id);
        return { code: 200, message: '删除成功!' };
    }

    @GrpcMethod('CommentService')
    async auditComment(body: { id: number, op: number }) {
        await this.commentService.auditComment(body.id, body.op);
        return { code: 200, message: '审核成功!' };
    }

    @GrpcMethod('CommentService')
    async getAllComments(body: { pageNUmber: number, pageSize: number, content: string, artTitle: string, artId: number, username: string, startTime: string, endTime: string }) {
        const result = await this.commentService.getAllComments(body.pageNUmber, body.pageSize, body.content, body.artTitle, body.artId, body.username, body.startTime, body.endTime);
        return { code: 200, message: '查询成功!', total: result.total, data: result.data};
    }

    @GrpcMethod('CommentService')
    async updateComment(body:{comment:Comment}){
        await this.commentService.updateComment(body.comment);
        return {code:200,message: '修改成功!'};
    }

}