import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Article } from "../entities/article.entity";
import { Repository, TreeRepository } from "typeorm";
import { Classify } from "../entities/classify.entity";
import { inputArticle, updateArticle, artResult } from "../interfaces/article.interface";
import { RpcException } from "@nestjs/microservices";
import { Message } from "../entities/message.entity";
import { NotaddGrpcClientFactory } from "src/grpc.client-factory";
import { now } from "moment";
import { UserInfoData } from "../interfaces/user.interface";
import { ArtInfo } from "../entities/art-info.entity";
import { Item } from "../entities/item.entity";
import { nt_module_user } from "src/grpc/generated";
import * as moment from 'moment';
import { ClassifyService } from "./classify.service";
const _ = require('underscore');


@Injectable()
export class ArticleService {

    onModuleInit() {
        this.userService = this.notaddGrpcClientFactory.userModuleClient.getService<nt_module_user.UserService>('UserService');
    }

    constructor(
        @InjectRepository(Article) private readonly artRepo: Repository<Article>,
        @InjectRepository(Classify) private readonly claRepo: TreeRepository<Classify>,
        @InjectRepository(Message) private readonly mesRepo: Repository<Message>,
        @InjectRepository(ArtInfo) private readonly aiRepo: Repository<ArtInfo>,
        @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
        @Inject(NotaddGrpcClientFactory) private readonly notaddGrpcClientFactory: NotaddGrpcClientFactory,
        @Inject(ClassifyService) private readonly classifyService: ClassifyService,
    ) { }

    private userService: nt_module_user.UserService;

    /**
     * 创建文章
     * 
     * @param art 文章实体
     */
    async createArticle(art: inputArticle) {
        const classify = await this.claRepo.findOne({ id: art.classifyId })
        const user = (await this.userService.findUserInfoByIds({ userIds: [art.userId] }).toPromise()).data[0];
        if (!classify) {
            throw new RpcException({ code: 404, message: '该文章分类不存在!' });
        }
        const exist = await this.artRepo.save(this.artRepo.create({
            userId: art.userId,
            title: art.title,
            cover: art.cover,
            abstract: art.abstract,
            content: art.content,
            top: art.top,
            source: art.source,
            status: user.userRoles.length && user.userRoles[0].id === 1 ? 0 : 1,
            createdAt: art.createAt,
            classify
        }));
        if (art.infoKVs && art.infoKVs.length) {
            await this.createOrUpdateArtInfos(exist, art.infoKVs, 'create');
        }
    }

    private async createOrUpdateArtInfos(art: Article, infoKVs: { artInfoId: number, artInfoValue: string, infoItemId?: number }[], action: 'create' | 'update') {
        if (infoKVs.length) {
            if (action === 'create') {
                infoKVs.forEach(async infoKV => {
                    await this.aiRepo.save(this.aiRepo.create({ value: infoKV.artInfoValue, article: art, item: { id: infoKV.infoItemId } }));
                });
                return;
            }
            infoKVs.forEach(async infoKV => {
                if (infoKV.artInfoId) {
                    this.aiRepo.update(infoKV.artInfoId, { value: infoKV.artInfoValue });
                } else {
                    await this.aiRepo.save(this.aiRepo.create({ value: infoKV.artInfoValue, article: art, item: { id: infoKV.infoItemId } }));
                }
            });
        }
    }

    /**
     * 修改文章
     * 
     * @param art 修改文章实体(有id)
     * 
     */
    async updateArticle(art: updateArticle) {
        try {
            const article = await this.artRepo.findOne(art.id, { relations: ['artInfos'] });
            if (!article) {
                throw new RpcException({ code: 404, message: '该文章不存在!' });
            }
            art.status = 0;
            art.modifyAt = moment().format('YYYY-MM-DD HH:mm:ss');
            await this.artRepo.save(this.artRepo.create(art));
            if (art.infoKVs && art.infoKVs.length) {
                await this.createOrUpdateArtInfos(article, art.infoKVs, 'update');
            }
        } catch (error) {
            throw new RpcException({ code: 500, message: error.toString() });
        }
    }


    /**
     * 批量将文章丢入回收站
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
     * 批量永久删除文章
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
     * 批量恢复回收站中的文章
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
     * 批量审核文章
     * 
     * @param ids 审核文章id数组
     * @param status 审核操作.1:通过  2:拒绝
     * @param refuseReason 拒绝原因(拒绝文章时需输入)
     */
    async auditArticle(ids: number[], op: number, refuseReason: string) {
        const articles: number[] = [];
        const arts = await this.artRepo.findByIds(ids);
        arts.forEach((key, value) => {
            articles.push(key.id);
        })
        const noExist = _.difference(ids, articles);
        if (noExist.length > 0) {
            throw new RpcException({ code: 404, message: `id为${noExist}的文章不存在` });
        }
        switch (op) {
            case 1:
                await this.artRepo.update(ids, { status: op });
                break;
            case 2:
                await this.artRepo.update(ids, { status: op, refuseReason });
                for (let i = 0; i < ids.length; i++) {
                    await this.mesRepo.save(this.mesRepo.create({
                        content: `你的文章《${arts[i].title}》审核未通过,原因如下:${refuseReason}`,
                        owner: arts[i].userId
                    }));
                }
                break;
            default:
                throw new RpcException({ code: 404, message: 'status参数错误' });
        }
    }

    /**
     * 后台搜索所有文章
     * 
     * @param classifyId 文章分类id
     * @param createdAt 开始时间
     * @param endTime 截止时间
     * @param title 文章标题
     * @param username 文章作者用户名
     * @param top 是否置顶
     * @param pageNumber 页数
     * @param pageSize 每页显示数量
     */
    async getAllArticle(classifyId: number, createdAt: string, endTime: string, title: string, username: string, top: boolean, pageNumber: number, pageSize: number) {
        const sqb = this.artRepo.createQueryBuilder('article')
            .where('article.status = :status', { status: 1 })
            .leftJoinAndSelect('article.classify', 'classify')
            .leftJoinAndSelect('article.artInfos', 'artInfos')
            .leftJoinAndSelect('article.discuss', 'discuss');
        if (classifyId) {
            sqb.andWhere('article.classify = :classifyId', { classifyId });
        }
        if (title) {
            sqb.andWhere('article.title Like :title', { title: `%${title}%` });
        }
        if (username) {
            const result = await this.userService.findOneWithRolesAndPermissions({ username }).toPromise();
            const userId = result.data.id;
            sqb.andWhere('article.userId = :userId', { userId });
        }
        if (createdAt) {
            const min = new Date(createdAt);
            sqb.andWhere('article.createdAt > :start', { start: min });
        }
        if (endTime) {
            const max = new Date(endTime);
            sqb.andWhere('article.createdAt < :end', { end: max })
        }
        if (top) {
            sqb.andWhere('article.top = :top', { top });
        }
        const result = await sqb.skip(pageSize * (pageNumber - 1)).take(pageSize).orderBy({ 'article.modifyAt': 'DESC' }).getManyAndCount();
        const exist: artResult[] = [];
        for (const i of result[0]) {
            const data = await this.userService.findUserInfoByIds({ userIds: [i.userId] }).toPromise();
            const classify = await this.claRepo.findOne(i.classify);
            const a = {
                id: i.id,
                title: i.title,
                classify,
                sourceUrl: i.sourceUrl,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                top: i.top,
                source: i.source,
                createAt: i.createdAt,
                userId: data.data[0].id,
                username: data.data[0].username,
                status: i.status,
                recycling: i.recycling,
                createdAt: i.createdAt,
                artInfos: i.artInfos,
                discuss: i.discuss,
                keywords: i.keywords
            }
            exist.push(a);
        }
        return { exist, total: result[1] };
    }

    async userGetArticles(classifyId: number, pageNumber: number, pageSize: number) {
        const cla = await this.claRepo.findOne(classifyId, { relations: ['parent'] });
        const ids: number[] = [];
        if (cla.alias === 'all') {
            const a = await this.classifyService.getAllClassifyIds(cla.parent.id);
            for (const i of a) {
                ids.push(i);
            }
        }
        if (cla.alias !== 'all') {
            ids.push(classifyId);
        }
        const sqb = this.artRepo.createQueryBuilder('article')
            .where('article.status = :status', { status: 1 })
            .andWhere('article.recycling = false')
            .andWhere('article.classify IN(:...ids)', { ids })
            .leftJoinAndSelect('article.classify', 'classify')
        const result = await sqb.skip(pageSize * (pageNumber - 1)).take(pageSize).orderBy({ 'article.createdAt': 'DESC' }).getManyAndCount();
        const exist = [];
        for (const i of result[0]) {
            const classify = await this.claRepo.findOne(i.classify);
            const a = {
                id: i.id,
                title: i.title,
                classify,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                createAt: i.createdAt,
                createdAt: i.createdAt,
                keywords: i.keywords,
                like: i.like
            }
            exist.push(a);
        }
        return { total: result[1], exist };
    }

    /**
     * 搜索回收站中文章
     * 
     */
    async getRecycleArticle(classifyId: number, createdAt: string, endTime: string, title: string, username: string, top: boolean, pageNumber: number, pageSize: number) {
        const sqb = this.artRepo.createQueryBuilder('article').where('article.recycling = :recycling', { recycling: true });
        if (classifyId) {
            sqb.andWhere('article.classify = :classifyId', { classifyId });
        }
        if (title) {
            sqb.andWhere('article.title Like :title', { title: `%${title}%` });
        }
        if (username) {
            const result = await this.userService.findOneWithRolesAndPermissions({ username }).toPromise();
            const userId = result.data.id;
            sqb.andWhere('article.userId = :userId', { userId });
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
            const data = await this.userService.findUserInfoByIds({ userIds: [i.userId] }).toPromise();
            const classify = await this.claRepo.findOne(i.classify);
            const a = {
                id: i.id,
                title: i.title,
                classify,
                sourceUrl: i.sourceUrl,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                top: i.top,
                source: i.source,
                createAt: i.createdAt,
                userId: data.data[0].id,
                username: data.data[0].username,
                status: i.status,
                recycling: i.recycling,
                createdAt: i.createdAt,
            }
            exist.push(a);
        }
        return { exist, total };
    }


    /**
     * 获取文章详情
     * 
     * @param id 文章id
     */
    async getArticleById(id: number) {
        const artQb = await this.artRepo.createQueryBuilder('art')
            .leftJoinAndSelect('art.artInfos', 'artInfos')
            .leftJoinAndSelect('artInfos.item', 'item')
            .leftJoinAndSelect('art.discuss', 'discuss')
            .leftJoinAndSelect('art.classify', 'classify');

        const itemQb = await this.itemRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.itemClassifys', 'classifyItem')
            .leftJoinAndSelect('classifyItem.classify', 'classify')
            .leftJoinAndSelect('classify.articles', 'articles');

        const art = await artQb.where('art.id = :id', { id }).getOne();
        const item = await itemQb.where('articles.id = :id', { id }).getMany();
        console.log(art);
        art.views++;
        await this.artRepo.save(this.artRepo.create(art));
        // .orderBy('item.order', 'ASC')
        return this.refactorArticle(art, item);
    }

    private refactorArticle(art: Article, items: Item[]) {
        const artInfoData = {
            id: art.id,
            title: art.title,
            source: art.source,
            classify: art.classify,
            sourceUrl: art.sourceUrl,
            top: art.top,
            views: art.views,
            cover: art.cover,
            abstract: art.abstract,
            content: art.content,
            status: art.status,
            refuseReason: art.refuseReason,
            recycling: art.recycling,
            createdAt: art.createdAt,
            modifyAt: art.modifyAt,
            userId: art.userId,
            keywords: art.keywords,
            like: art.like,
            discuss: art.discuss.length ? art.discuss.map(item => {
                return {
                    id: item.id,
                    content: item.content,
                    time: item.time,
                    status: item.status,
                    userId: item.userId
                }
            }) : [],
            artInfos: items.length ? items.map(item => {
                const artInfo = art.artInfos.find(artInfo => artInfo.item.id === item.id);
                return {
                    id: art.artInfos.length ? (artInfo ? artInfo.id : undefined) : undefined,
                    relationId: item.id,
                    value: art.artInfos.length ? (artInfo ? artInfo.value : undefined) : undefined,
                };
            }) : []
        };
        console.log(artInfoData);
        return artInfoData;
    }

    /**
     * 
     * 搜索获取待审核文章
     * 
     */
    async getCheckArticle(classifyId: number, createdAt: string, endTime: string, title: string, username: string, top: boolean, pageNumber: number, pageSize: number) {
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
            const result = await this.userService.findOneWithRolesAndPermissions({ username }).toPromise();
            const userId = result.data.id;
            sqb.andWhere('article.userId = :userId', { userId });
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
            const data = await this.userService.findUserInfoByIds({ userIds: [i.userId] }).toPromise();
            const classify = await this.claRepo.findOne(i.classify);
            const a = {
                id: i.id,
                title: i.title,
                classify,
                sourceUrl: i.sourceUrl,
                cover: i.cover,
                abstract: i.abstract,
                content: i.content,
                top: i.top,
                source: i.source,
                createAt: i.createdAt,
                userId: data.data[0].id,
                username: data.data[0].username,
                status: i.status,
                recycling: i.recycling,
                createdAt: i.createdAt,
                keywords: i.keywords,
                like: i.like
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