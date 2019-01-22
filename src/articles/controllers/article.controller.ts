import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ArticleService } from "../services/article.service";
import { inputArticle, updateArticle } from "../interfaces/article.interface";

@Controller()
export class ArticleController {
    constructor(
        @Inject(ArticleService) private readonly artService: ArticleService
    ) { }

    @GrpcMethod('ArticleService')
    async createArticle(body: { createArtInput: inputArticle }) {
        await this.artService.createArticle(body.createArtInput);
        return { code: 200, message: '新建成功!' };
    }

    @GrpcMethod('ArticleService')
    async updateArticle(body: { updateArtInput: updateArticle }) {
        await this.artService.updateArticle(body.updateArtInput);
        return { code: 200, message: '修改成功!' };
    }

    @GrpcMethod('ArticleService')
    async recycleArticleByIds(body: { ids: number[] }) {
        await this.artService.recycleArticleByIds(body.ids);
        return { code: 200, message: '移至回收站成功!' };
    }

    @GrpcMethod('ArticleService')
    async deleteArticleByIds(body: { ids: number[] }) {
        await this.artService.deleteArticleByIds(body.ids);
        return { code: 200, message: '删除成功!' }
    }

    @GrpcMethod('ArticleService')
    async recoverArticleByIds(body: { ids: number[] }) {
        await this.artService.recoverArticleByIds(body.ids);
        return { code: 200, message: '恢复文章成功!' };
    }

    @GrpcMethod('ArticleService')
    async auditArticle(body: { ids: number[], op: number, refuseReason: string }) {
        await this.artService.auditArticle(body.ids, body.op, body.refuseReason);
        return { code: 200, message: '审核成功!' };
    }

    @GrpcMethod('ArticleService')
    async getAllArticle(body: { classifyId: number, createdAt: string, endTime: string, title: string, username: string, top:boolean, pageNumber: number, pageSize: number }) {
        const data = (await this.artService.getAllArticle(body.classifyId, body.createdAt, body.endTime, body.title, body.username, body.top, body.pageNumber, body.pageSize)).exist;
        const total = (await this.artService.getAllArticle(body.classifyId, body.createdAt, body.endTime, body.title, body.username, body.top, body.pageNumber, body.pageSize)).total;
        return { code: 200, message: '查询成功', data, total };
    }

    @GrpcMethod('ArticleService')
    async userGetArticles(body: { classifyId: number, pageNumber: number, pageSize: number }) {
        const data = (await this.artService.userGetArticles(body.classifyId, body.pageNumber, body.pageSize)).exist;
        const total = (await this.artService.userGetArticles(body.classifyId, body.pageNumber, body.pageSize)).total;
        return { code: 200, message: '查询成功', data, total };
    }

    @GrpcMethod('ArticleService')
    async getRecycleArticle(body: { classifyId: number, createdAt: string, endTime: string, title: string, username: string, top:boolean, pageNumber: number, pageSize: number }) {
        const data = (await this.artService.getRecycleArticle(body.classifyId, body.createdAt, body.endTime, body.title, body.username, body.top, body.pageNumber, body.pageSize)).exist;
        const total = (await this.artService.getRecycleArticle(body.classifyId, body.createdAt, body.endTime, body.title, body.username, body.top, body.pageNumber, body.pageSize)).total;
        return { code: 200, message: '查询成功!', data, total };
    }

    @GrpcMethod('ArticleService')
    async getArticleById(body: { id: number }) {
        const data = await this.artService.getArticleById(body.id);
        return { code: 200, message: '查询成功!', data }
    }

    @GrpcMethod('ArticleService')
    async getCheckArticle(body: { classifyId: number, createdAt: string, endTime: string, title: string, username: string, top:boolean, pageNumber: number, pageSize: number }) {
        const data = (await this.artService.getCheckArticle(body.classifyId, body.createdAt, body.endTime, body.title, body.username, body.top, body.pageNumber, body.pageSize)).exist;
        const total = (await this.artService.getCheckArticle(body.classifyId, body.createdAt, body.endTime, body.title, body.username, body.top, body.pageNumber, body.pageSize)).total;
        return { code: 200, message: '查询成功!', data, total }
    }


}