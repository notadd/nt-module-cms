import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ItemService } from "../services/item.service";
import { Item } from "../entities/item.entity";
import { inputItem } from "../interfaces/item.interface";

@Controller()
export class ItemController {
    constructor(
        @Inject(ItemService) private readonly itemService: ItemService,
    ) { }

    @GrpcMethod('ItemService')
    async createItem(body: { item: inputItem }) {
        await this.itemService.createItem(body.item);
        return { code: 200, message: '新建信息项成功!' };
    }

    @GrpcMethod('ItemService')
    async updateItem(body: { item: Item }) {
        await this.itemService.updateItem(body.item);
        return { code: 200, message: '修改成功!' };
    }

    @GrpcMethod('ItemService')
    async deleteItem(body: { id: number }) {
        await this.itemService.deleteItem(body.id);
        return {code:200,message: '删除成功!'};
    }

}