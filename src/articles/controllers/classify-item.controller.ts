import { Controller, Inject } from "@nestjs/common";
import { ClassifyItemService } from "../services/classify-item.service";
import { GrpcMethod } from "@nestjs/microservices";
import { ClassifyItemInput, CreateClassifyItem } from "../interfaces/classify-item.interface";

@Controller()
export class ClassifyItemController {
    constructor(
        @Inject(ClassifyItemService) private readonly ciService: ClassifyItemService
    ) { }

    @GrpcMethod('ClassifyItemService')
    async updateClassifyItem(body: { classifyItem: ClassifyItemInput }) {
        await this.ciService.updateClassifyItem(body.classifyItem);
        return { code: 200, message: '修改成功!' };
    }

    @GrpcMethod('ClassifyItemService')
    async deleteClassifyItem(body: {id: number}) {
        await this.ciService.deleteClassifyItem(body.id);
        return {code:200,message: '删除成功!'};
    }

    @GrpcMethod('ClassifyItemService')
    async createClassifyItem(body: {classifyItem: CreateClassifyItem}){
        await this.ciService.createClassifyItem(body.classifyItem);
        return {code:200,message:'创建成功!'};
    }

}