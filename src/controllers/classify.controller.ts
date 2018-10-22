import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from '@nestjs/microservices';
import { CreateClassify } from "../interfaces/classify.interface";
import { ClassifyService } from "../services/classify.service";
import { ClassifyEntity } from "../entities/classify.entity";

@Controller()
export class ClassifyController {
    constructor(
        @Inject(ClassifyService) private readonly classifyService: ClassifyService
    ) { }

    @GrpcMethod('ClassifyService')
    async addClassify(body: { classify: CreateClassify }) {
        await this.classifyService.addClassify(body.classify);
        return { code: 200, message: '添加成功!' };
    }

    @GrpcMethod('ClassifyService')
    async delClassify(body: { id: number }) {
        await this.classifyService.delClassify(body.id);
        return { code: 200, message: '删除成功!' };
    }

    @GrpcMethod('ClassifyService')
    async updateClassify(body: { classify: ClassifyEntity }) {
        await this.classifyService.updateClassify(body.classify);
        return { code: 200, message: '修改成功!' };
    }

    @GrpcMethod('ClassifyService')
    async getAllClassify(body: { id: number }) {
        const data = await this.classifyService.getAllClassify(body.id);
        return { code: 200, message: '查询成功!', data };
    }

    @GrpcMethod('ClassifyService')
    async getOneClassify(body: { id: number }) {
        const data = await this.classifyService.getOneClassify(body.id);
        return { code: 200, message: '查询成功!', data };
    }

    @GrpcMethod('ClassifyService')
    async getParentClassify(body: { id: number }) {
        const data = await this.classifyService.getParentClassify(body.id);
        return { code: 200, message: '查询成功!', data };
    }

    @GrpcMethod('ClassifyService')
    async MobileArticles(body: { classifyId: number, newClassifyId: number }) {
        await this.classifyService.mobileArticles(body.classifyId, body.newClassifyId);
        return { code: 200, message: '修改成功!' };
    }

}