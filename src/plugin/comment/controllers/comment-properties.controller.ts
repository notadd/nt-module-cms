import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { CommentPropertiesService } from "../services/comment-properties.service";

@Controller()
export class CommentPropertiesController {
    constructor(
        @Inject(CommentPropertiesService) private readonly cpService: CommentPropertiesService,
    ) { }

    @GrpcMethod('')
    async getAllCommentProperties() {
        const data = await this.cpService.getAllCommentProperties();
        return { code: 200, message: '查询成功!', data };
    }

    @GrpcMethod('')
    async updateCommentProperties(body: { id: number, name: string }) {
        await this.cpService.updateCommentProperties(body.id, body.name);
        return { code: 200, message: '修改成功!' };
    }

}