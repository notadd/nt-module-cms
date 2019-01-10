import { Controller, Inject } from "@nestjs/common";
import { ClassifyItemService } from "../services/classify-item.service";
import { GrpcMethod } from "@nestjs/microservices";
import { classifyItemInput } from "../interfaces/classify-item.interface";

@Controller()
export class ClassifyItemController {
    constructor(
        @Inject(ClassifyItemService) private readonly ciService: ClassifyItemService
    ) { }

    @GrpcMethod('ClassifyItemService')
    async updateClassifyItem(body: { classifyItem: classifyItemInput }) {
        await this.ciService.updateClassifyItem(body.classifyItem);
        return { code: 200, message: '修改成功!' };
    }

    @GrpcMethod('ClassifyItemService')
    async DeleteClassifyItem(body: {id: number}) {
        await this.ciService.deleteClassifyItem(body.id);
        return {code:200,message: '删除成功!'};
    }

}