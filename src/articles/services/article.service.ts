import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ArticleEntity } from "../entities/article.entity";
import { Repository, TreeRepository } from "typeorm";
import { ClassifyEntity } from "../entities/classify.entity";
import { inputArticle, updateArticle, artResult } from "../interfaces/article.interface";
import { RpcException } from "@nestjs/microservices";
import { MessageEntity } from "../entities/message.entity";
import { NotaddGrpcClientFactory } from "src/grpc.client-factory";
import { now } from "moment";
import { UserInfoData } from "../interfaces/user.interface";
const _ = require('underscore');


@Injectable()
export class ArticleService {

    onModuleInit() {
        this.userServiceInterface = this.notaddGrpcClientFactory.userModuleClient.getService('UserService');
    }

    constructor(
        @InjectRepository(ArticleEntity) private readonly artRepo: Repository<ArticleEntity>,
        @InjectRepository(ClassifyEntity) private readonly claRepo: TreeRepository<ClassifyEntity>,
        @InjectRepository(MessageEntity) private readonly mesRepo: Repository<MessageEntity>,
        @Inject(NotaddGrpcClientFactory) private readonly notaddGrpcClientFactory: NotaddGrpcClientFactory
    ) { }

    private userServiceInterface;

    /**
     * 创建文章
     * 
     * @param art 文章实体
     */
    async createArticle(art: inputArticle) {
        const classify = await this.claRepo.findOne({ id: art.classifyId })
        if (!classify) {
            throw new RpcException({ code: 404, message: '该文章分类不存在!' });
        }
        await this.artRepo.save(this.artRepo.create(art));
    }

    /**
     * 修改文章
     * 
     * @param art 修改文章实体(有id)
     * 
     */
    async updateArticle(art: updateArticle) {
        const article = await this.artRepo.findOne({ id: art.id });
        if (!article) {
            throw new RpcException({ code: 404, message: '该文章不存在!' });
        }
        article.status = 0;
        await this.artRepo.save(this.artRepo.create(article));
    }


    /**
     * 将文章丢入回收站
     * 
     * @param ids 文章id数组
     */
    async recycleArticleByIds(ids: number[]) {
        const articles: number[] = [];
        await this.artRepo.findByIds(ids).then(art => {
            art.map((key, value) => {
                articles.push(key.id);
            })
        });
        const noExist = _.difference(ids, articles);
        if (noExist.length > 0) {
            throw new RpcException({ code: 404, message: `id为${noExist}的文章不存在` });
        }
        await this.artRepo.update(ids, { recycling: true });
    }

    /**
     * 将文章永久删除
     * 
     * @param ids 文章id数组
     * 
     */
    async deleteArticleByIds(ids: number[]) {
        const articles: number[] = [];
        await this.artRepo.findByIds(ids).then(art => {
            art.map((key, value) => {
                articles.push(key.id);
            })
        });
        const noExist = _.difference(ids, articles);
        if (noExist.length > 0) {
            throw new RpcException({ code: 404, message: `id为${noExist}的文章不存在` });
        }
        await this.artRepo.delete(ids);
    }


    /**
     * 恢复回收站中的文章
     * 
     * @param ids 文章id数组
     */
    async recoverArticleByIds(ids: number[]) {
        const articles: number[] = [];
        await this.artRepo.findByIds(ids).then(art => {
            art.map((key, value) => {
                articles.push(key.id);
            })
        });
        const noExist = _.difference(ids, articles);
        if (noExist.length > 0) {
            throw new RpcException({ code: 404, message: `id为${noExist}的文章不存在` });
        }
        await this.artRepo.update(ids, { recycling: false });
    }


    /**
     * 审核文章
     * 
     * @param ids 审核文章id数组
     * @param status 审核操作.1:通过  2:拒绝
     * @param refuseReason 拒绝原因(拒绝文章时需输入)
     */
    async auditArticle(ids: number[], status: number, refuseReason: string) {
        const articles: number[] = [];
        const arts = await this.artRepo.findByIds(ids);
        arts.forEach((key, value) => {
            articles.push(key.id);
        })
        const noExist = _.difference(ids, articles);
        if (noExist.length > 0) {
            throw new RpcException({ code: 404, message: `id为${noExist}的文章不存在` });
        }
        switch (status) {
            case 1:
                await this.artRepo.update(ids, { status });
                break;
            case 2:
                await this.artRepo.update(ids, { status, refuseReason });
                for (let i = 0; i < ids.length; i++) {
                    await this.mesRepo.save(this.mesRepo.create({
                        content: `你的文章《${arts[i].title}》已被拒绝,原因如下:${refuseReason}`,
                        owner: arts[i].userId
                    }));
                }
                break;
            default:
                throw new RpcException({ code: 404, message: 'status参数错误' });
        }
    }

    async getAllArticle(classifyId: number, createdAt: string, endTime: string, title: string, username: string, pageNumber: number, pageSize: number) {
        const sqb = this.artRepo.createQueryBuilder('article');
        if (classifyId) {
            sqb.where('article.classify = :classifyId', { classifyId });
        }
        if (title) {
            sqb.andWhere('article.title Like :title', { title: `%${title}%` });
        }
        if (username) {

        }
        if (createdAt) {
            const min = new Date(createdAt);
            const max = endTime ? new Date(endTime) : new Date();
            sqb.andWhere('article.createdAt > :start', { start: min });
            sqb.andWhere('article.createdAt < :end', { end: max })
        }
        const result = await sqb.skip(pageSize * (pageNumber - 1)).take(pageSize).getMany();
        const exist: artResult[] = [];
        const total = await sqb.getCount();
        for (const i of result) {
            const user = <UserInfoData>await this.userServiceInterface.findByIds(i.userId);
            const classify = await this.claRepo.findOne({ where: { id: i.classify } });
            const a = {
                id: i.id,
                title: i.title,
                classifyName: classify.name,
                sourceUrl: i.sourceUrl,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                top: i.top,
                source: i.source,
                userId: user.id,
                userName: user.username
            }
            exist.push(a);
        }
        return { exist, total };
    }

    async getRecycleArticle(classifyId: number, createdAt: string, endTime: string, title: string, username: string, pageNumber: number, pageSize: number) {
        const sqb = this.artRepo.createQueryBuilder('article').where('article.recycling = :recycling', { recycling: true });
        if (classifyId) {
            sqb.andWhere('article.classify = :classifyId', { classifyId });
        }
        if (title) {
            sqb.andWhere('article.title Like :title', { title: `%${title}%` });
        }
        if (username) {

        }
        if (createdAt) {
            const min = new Date(createdAt);
            const max = endTime ? new Date(endTime) : new Date();
            sqb.andWhere('article.createdAt > :start', { start: min });
            sqb.andWhere('article.createdAt < :end', { end: max })
        }
        const result = await sqb.skip(pageSize * (pageNumber - 1)).take(pageSize).getMany();
        const exist: artResult[] = [];
        const total = await sqb.getCount();
        for (const i of result) {
            const user = <UserInfoData>await this.userServiceInterface.findByIds(i.userId);
            const classify = await this.claRepo.findOne({ where: { id: i.classify } });
            const a = {
                id: i.id,
                title: i.title,
                classifyName: classify.name,
                sourceUrl: i.sourceUrl,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                top: i.top,
                source: i.source,
                userId: user.id,
                userName: user.username
            }
            exist.push(a);
        }
        return { exist, total };
    }

    async getArticleById(id: number) {
        const art = await this.artRepo.findOne(id);
        return art;
    }

    async getCheckArticle(classifyId: number, createdAt: string, endTime: string, title: string, username: string, pageNumber: number, pageSize: number) {
        const sqb = this.artRepo.createQueryBuilder('article')
            .where('article.recycling = :recycling', { recycling: false })
            .andWhere('article.status = :status', { status: 0 });
        if (classifyId) {
            sqb.andWhere('article.classify = :classifyId', { classifyId });
        }
        if (title) {
            sqb.andWhere('article.title Like :title', { title: `%${title}%` });
        }
        if (username) {

        }
        if (createdAt) {
            const min = new Date(createdAt);
            const max = endTime ? new Date(endTime) : new Date();
            sqb.andWhere('article.createdAt > :start', { start: min });
            sqb.andWhere('article.createdAt < :end', { end: max })
        }
        const result = await sqb.skip(pageSize * (pageNumber - 1)).take(pageSize).getMany();
        const exist: artResult[] = [];
        const total = await sqb.getCount();
        for (const i of result) {
            const user = <UserInfoData>await this.userServiceInterface.findByIds(i.userId);
            const classify = await this.claRepo.findOne({ where: { id: i.classify } });
            const a = {
                id: i.id,
                title: i.title,
                classifyName: classify.name,
                sourceUrl: i.sourceUrl,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                top: i.top,
                source: i.source,
                userId: user.id,
                userName: user.username
            }
            exist.push(a);
        }
        return { exist, total };
    }


    private addDate(dates, days) {
        if (days === undefined || days === '') {
            days = 1;
        }
        const date = new Date(dates);
        date.setDate(date.getDate() + days);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return date.getFullYear() + '-' + this.getFormatDate(month) + '-' + this.getFormatDate(day);
    }

    private getFormatDate(arg) {
        if (arg === undefined || arg === '') {
            return '';
        }
        let re = arg + '';
        if (re.length < 2) {
            re = '0' + re;
        }
        return re;
    }

}