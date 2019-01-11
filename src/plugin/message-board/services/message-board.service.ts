import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MessageBoard } from "../entities/message-board.entity";
import { Repository } from "typeorm";
import { Leaveword } from "../entities/leaveword.entity";
import { Item } from "src/articles/entities/item.entity";
import { LeavewordInfo } from "../entities/leaveword-info.entity";
import { notadd_module_user } from "src/grpc/generated";
import { NotaddGrpcClientFactory } from "src/grpc.client-factory";
import { CreateBoardInput, UpdateBoardInput } from "../interfaces/message-board.interface";
import { RpcException } from "@nestjs/microservices";
import { BoardItem } from "../entities/board-item.entity";

@Injectable()
export class MessageBoardService {

    onModuleInit() {
        this.userService = this.notaddGrpcClientFactory.userModuleClient.getService<notadd_module_user.UserService>('UserService');
    }


    constructor(
        @InjectRepository(MessageBoard) private readonly mbRepo: Repository<MessageBoard>,
        @InjectRepository(Leaveword) private readonly lwRepo: Repository<Leaveword>,
        @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
        @InjectRepository(BoardItem) private readonly biRepo: Repository<BoardItem>,
        @InjectRepository(LeavewordInfo) private readonly lwInfoRepo: Repository<LeavewordInfo>,
        @Inject(NotaddGrpcClientFactory) private readonly notaddGrpcClientFactory: NotaddGrpcClientFactory
    ) { }

    private userService: notadd_module_user.UserService;

    async createMessageBoard(messageBoard: CreateBoardInput) {
        try {
            if (await this.mbRepo.findOne({ where: { alias: messageBoard.alias } })) {
                throw new RpcException({ code: 406, message: '留言板别名重复!' });
            }
            const board = await this.mbRepo.save(this.mbRepo.create({ name: messageBoard.name, alias: messageBoard.alias }));
            if (messageBoard.boardItem && messageBoard.boardItem.length) {
                const array = messageBoard.boardItem.map(item => item.alias);
                for (let i = 0; i < array.length; i++) {
                    const same = array.filter(item => item === array[i]);
                    if (same.length > 1) {
                        throw new RpcException({ code: 406, message: '信息项别名重复!' });
                    }
                }
                for (const i of messageBoard.boardItem) {
                    const item = await this.itemRepo.findOne(i.itemId);
                    await this.biRepo.save(this.biRepo.create({
                        name: i.name,
                        alias: i.alias,
                        required: i.required,
                        item,
                        messageBoard: board
                    }))
                }
            }
        } catch (error) {
            throw new RpcException(error);
        }
    }

    async updateMessageBoard(messageBoard: UpdateBoardInput) {
        const board = await this.mbRepo.findOne(messageBoard.id);
        if (messageBoard.name && messageBoard.name !== board.name) {
            this.mbRepo.update(board.id, { name: messageBoard.name });
        }
        if (messageBoard.alias && messageBoard.alias !== board.alias) {
            if (await this.mbRepo.findOne({ where: { alias: messageBoard.alias } })) {
                throw new RpcException({ code: 406, message: '留言板别名重复!' });
            }
            this.mbRepo.update(board.id, { alias: messageBoard.alias });
        }
    }

    async deleteMessageBoard(id: number) {
        const exist = await this.mbRepo.findOne(id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该留言板不存在!' });
        }
        this.mbRepo.remove(exist);
    }

    async getAllMessageBoard(pageNumber: number, pageSize: number) {
        const data = await this.mbRepo.find({
            skip: (pageNumber - 1) * pageSize,
            take: pageSize,
            relations: ['leavewords']
        });
        const result = [];
        for (const i of data) {
            const a = {
                name: i.name,
                alias: i.alias,
                time: i.time,
                amount: i.leavewords.length
            };
            result.push(a);
        }
        const total = await this.mbRepo.count();
        return { data: result, total };
    }

    async getOneMessageBoard(id: number) {
        const data = await this.mbRepo.findOne(id, {
            relations: ['boardItems']
        });
        return data;
    }

    async getMessageBoardContent(id: number, pageNumber: number, pageSize: number) {
        const data = await this.lwRepo.findAndCount({
            where: { messageBoard: id },
            relations: ['leaveWordInfos'],
            skip: (pageNumber - 1) * pageSize,
            take: pageSize,
        });
        return { total: data[1], data: data[0] };
    }

}