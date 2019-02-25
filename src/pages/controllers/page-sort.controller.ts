import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { PageSort } from "../entities/page-sort.entity";
import { PageSortService } from "../services/page-sort.service";
import { CreatePageSort } from "../interfaces/page-sort.interface";

@Controller()
export class PageSortController {
    constructor(
        @Inject(PageSortService) private readonly psService: PageSortService
    ) { }

    @GrpcMethod('PageSortService')
    async createPageSort(body: { createPageSortInput: CreatePageSort }) {
        await this.psService.createPageSort(body.createPageSortInput);
        return { code: 200, message: '创建页面分类成功!' };
    }

    @GrpcMethod('PageSortService')
    async updatePageSort(body: { pageSort: PageSort }) {
        await this.psService.updatePageSort(body.pageSort);
        return { code: 200, message: '修改页面分类成功!' };
    }

    @GrpcMethod('PageSortService')
    async deletePageSort(body: { id: number }) {
        await this.psService.deletePageSort(body.id);
        return { code: 200, message: '删除页面分类成功!' };
    }

    @GrpcMethod('PageSortService')
    async getAllPageSort() {
        const data = await this.psService.getAllPageSort();
        return { code: 200, message: '查询成功!', data: JSON.stringify(data)};
    }

    @GrpcMethod('PageSortService')
    async getOnePageSort(body: { id: number }) {
        const data = await this.psService.getOnePageSort(body.id);
        return { code: 200, message: '查询成功!', data }
    }
}