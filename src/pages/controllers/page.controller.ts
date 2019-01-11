import { Controller, Inject } from "@nestjs/common";
import { Page } from "../entities/page.entity";
import { GrpcMethod } from "@nestjs/microservices";
import { PageService } from "../services/page.service";

@Controller()
export class PageController {
    constructor(
        @Inject(PageService) private readonly pageService: PageService
    ) { }

    @GrpcMethod('PageService')
    async createPage(body: { page: Page }) {
        await this.pageService.createPage(body.page);
        return { code: 200, message: '创建页面成功!' };
    }

    @GrpcMethod('PageService')
    async updatePage(body: { page: Page }) {
        await this.pageService.updatePage(body.page);
        return { code: 200, message: '修改页面成功!' };
    }

    @GrpcMethod('PageService')
    async deletePage(body: { id: number }) {
        await this.pageService.deletePage(body.id);
        return { code: 200, message: '删除成功!' };
    }

    @GrpcMethod('PageService')
    async getAllPage(body: { pageNumber: number, pageSize: number, name: string }) {
        const data = (await this.pageService.getAllPage(body.pageNumber, body.pageSize, body.name)).data;
        const total = (await this.pageService.getAllPage(body.pageNumber, body.pageSize, body.name)).total;
        return { code: 200, message: '查询成功!', data, total }
    }

    @GrpcMethod('PageService')
    async getOnePage(body: { id: number }) {
        const data = await this.pageService.getOnePage(body.id);
        return { code: 200, message: '查询成功!', data };
    }

}