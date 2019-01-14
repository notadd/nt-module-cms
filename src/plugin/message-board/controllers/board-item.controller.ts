import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { UpdateBoardItemInput } from "../interfaces/message-board.interface";
import { BoardItemService } from "../services/board-item.service";

@Controller()
export class BoardItemController {
    constructor(
        @Inject(BoardItemService) private readonly biService: BoardItemService,
    ) { }

    @GrpcMethod('BoardItemService')
    async  updateBoardItem(req, body: { updateBoardItem: UpdateBoardItemInput }) {
        await this.biService.updateBoardItem(body.updateBoardItem);
        return { code: 200, message: '修改留言板信息项成功!' };
    }

    @GrpcMethod('BoardItemService')
    async deleteBoardItem(req, body: { id: number }) {
        await this.biService.deleteBoardItem(body.id);
        return { code: 200, message: '删除留言板信息项成功!' };
    }

}