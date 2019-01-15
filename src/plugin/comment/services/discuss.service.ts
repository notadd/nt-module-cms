import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Discuss } from "../entities/discuss.entity";
import { Repository } from "typeorm";
import { notadd_module_user } from "src/grpc/generated";
import { NotaddGrpcClientFactory } from "src/grpc.client-factory";
import * as moment from 'moment';
import { Article } from "src/articles/entities/article.entity";
import { RpcException } from "@nestjs/microservices";
import { UserInfoData } from "src/articles/interfaces/user.interface";
import { CreateDiscuss } from "../interfaces/discuss.interface";

@Injectable()
export class DiscussService {

    onModuleInit() {
        this.userService = this.notaddGrpcClientFactory.userModuleClient.getService<notadd_module_user.UserService>('UserService');
    }

    constructor(
        @InjectRepository(Discuss) private readonly commentRepo: Repository<Discuss>,
        @InjectRepository(Article) private readonly artRepo: Repository<Article>,
        @Inject(NotaddGrpcClientFactory) private readonly notaddGrpcClientFactory: NotaddGrpcClientFactory
    ) { }

    private userService: notadd_module_user.UserService;

    /**
     * 发表评论
     * 
     * @param comment 评论实体
     */
    async createDiscuss(comment: CreateDiscuss) {
        const time = moment().format('YYYY-MM-DD HH:mm:ss');
        const art = await this.artRepo.findOne(comment.artId);
        if (!art) {
            throw new RpcException({ code: 404, message: '该文章不存在!' });
        }
        const user = (await this.userService.findUserInfoByIds({ userIds: [comment.userId] }).toPromise()).data[0];
        if (user.banned === true) {
            throw new RpcException({ code: 403, message: '您的账户已被封禁,请联系管理员!' });
        }
        try {
            await this.commentRepo.save({
                content: comment.content,
                time,
                status: 0,
                userId: user.id,
                article: art
            });
        } catch (error) {
            throw new RpcException({ code: 500, message: error });
        }
    }

    /**
     * 删除评论
     * 
     * @param id 评论id
     */
    async deleteDiscuss(id: number) {
        const exist = await this.commentRepo.findOne(id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该评论不存在!' });
        }
        await this.commentRepo.remove(exist);
    }

    /**
     * 审核评论,修改评论状态
     * 
     * @param id 评论id
     * @param op 0:待审核,1:通过,2:拒绝
     */
    async auditDiscuss(id: number, op: number) {
        const exist = await this.commentRepo.findOne(id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该评论不存在!' });
        }
        await this.commentRepo.update(exist, { status: op });
    }

    /**
     * 搜索评论
     * 
     * @param pageNumber 当前页码
     * @param pageSize 每页显示数量
     * @param content 评论内容
     * @param artTitle 所属文章标题
     * @param artId 所属文章id
     * @param username 发布人用户名
     * @param startTime 起始时间
     * @param endTime 截止时间
     */
    async getAllDiscusss(pageNumber: number, pageSize: number, content: string, artTitle: string, artId: number, username: string, startTime: string, endTime: string) {
        const sqb = this.commentRepo.createQueryBuilder('comment');
        if (content) {
            sqb.andWhere('comment.content Like :content', { content: `%${content}%` });
        }
        if (artTitle) {
            const arts = await this.artRepo.find({ where: { title: artTitle } });
            if (!arts.length) {
                return { data: null, total: 0 };
            }
            const ids = arts.map(item => item.id);
            sqb.andWhere('comment.article IN(:...ids)', ids);
        }
        if (artId) {
            sqb.andWhere('comment.article = :artId', { artId });
        }
        if (username) {
            const user = await this.userService.findOneWithRolesAndPermissions({ username }).toPromise();
            console.log(user);
            if (!user.data) {
                return { data: null, total: 0 };
            }
            const id = user.data.id;
            sqb.andWhere('comment.userId = :id', { id });
        }
        if (startTime) {
            sqb.andWhere('comment.time > :startTime', { startTime });
        }
        if (endTime) {
            sqb.andWhere('comment.time < :endTime', { endTime });
        }
        const result = await sqb.skip(pageSize * (pageNumber - 1)).take(pageSize).getManyAndCount();
        return { data: result[0], total: result[1] };
    }

    async updateDiscuss(comment: Discuss) {
        try {
            this.commentRepo.update(comment.id, this.commentRepo.create(comment));
        } catch (error) {
            throw new RpcException(error);
        }
    }

}