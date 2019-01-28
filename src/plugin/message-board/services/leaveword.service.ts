import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Leaveword } from "../entities/leaveword.entity";
import { Repository } from "typeorm";
import { LeavewordInfo } from "../entities/leaveword-info.entity";
import { CreateLeavewordInput } from "../interfaces/leaveword.interface";
import { MessageBoard } from "../entities/message-board.entity";
import { NotaddGrpcClientFactory } from "src/grpc.client-factory";
import { nt_module_user } from "src/grpc/generated";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class LeavewordService {

    onModuleInit() {
        this.userService = this.notaddGrpcClientFactory.userModuleClient.getService<nt_module_user.UserService>('UserService');
    }


    constructor(
        @InjectRepository(Leaveword) private readonly leavewordRepo: Repository<Leaveword>,
        @InjectRepository(LeavewordInfo) private readonly lwInfoRepo: Repository<LeavewordInfo>,
        @InjectRepository(MessageBoard) private readonly mbRepo: Repository<MessageBoard>,
        @Inject(NotaddGrpcClientFactory) private readonly notaddGrpcClientFactory: NotaddGrpcClientFactory
    ) { }

    private userService: nt_module_user.UserService;

    async createLeaveword(createLeaveword: CreateLeavewordInput) {
        const user = (await this.userService.findUserInfoByIds({ userIds: [createLeaveword.userId] }).toPromise()).data[0];
        if (!user) {
            throw new RpcException({ code: 404, message: '该用户不存在!' });
        }
        if (user.banned === true) {
            throw new RpcException({ code: 403, message: '您的账户已被封禁,请联系管理员!' });
        }
        const messageBoard = await this.mbRepo.findOne(createLeaveword.messageBoardId);
        if (!messageBoard) {
            throw new RpcException({ code: 404, message: '该留言板不存在!' });
        }
        const leaveword = await this.leavewordRepo.save(this.leavewordRepo.create({ userId: createLeaveword.userId, messageBoard }));
        if (createLeaveword.infoKVs && createLeaveword.infoKVs.length) {
            for (let i = 0; i < createLeaveword.infoKVs.length; i++) {
                await this.lwInfoRepo.save(this.lwInfoRepo.create({ value: createLeaveword.infoKVs[i].artInfoValue, leaveword, item: { id: createLeaveword.infoKVs[i].infoItemId } }));
            }
        }
    }

    async deleteLeaveword(id: number) {
        const leaveword = await this.leavewordRepo.findOne(id, { relations: ['messageBoard'] });
        if (!leaveword) {
            throw new RpcException({ code: 404, message: '该留言不存在!' });
        }
        await this.leavewordRepo.createQueryBuilder('leaveword').relation(Leaveword, 'messageBoard').of(leaveword).remove(leaveword.messageBoard);
        await this.leavewordRepo.remove(leaveword);
    }

}