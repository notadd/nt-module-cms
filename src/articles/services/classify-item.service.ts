import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassifyItem } from "../entities/classify-item.entity";
import { classifyItemInput } from "../interfaces/classify-item.interface";
import { RpcException } from "@nestjs/microservices";
import { ArtInfo } from "../entities/art-info.entity";
import { Item } from "../entities/item.entity";
import { Article } from "../entities/article.entity";

@Injectable()
export class ClassifyItemService {
    constructor(
        @InjectRepository(ClassifyItem) private readonly ciRepo: Repository<ClassifyItem>,
        @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
        @InjectRepository(ArtInfo) private readonly aiRepo: Repository<ArtInfo>,
        @InjectRepository(Article) private readonly artRepo: Repository<Article>,
    ) { }


    /**
     * 修改文章分类中的信息项
     * 
     * @param classifyItem 需要修改的实体
     */
    async updateClassifyItem(classifyItem: classifyItemInput) {
        const exist = await this.ciRepo.findOne(classifyItem.id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该信息项不存在!' });
        }
        if (classifyItem.alias && classifyItem.alias !== exist.alias) {
            if (await this.ciRepo.findOne({ where: { alias: classifyItem.alias } })) {
                throw new RpcException({ code: 406, message: '别名重复!' });
            }
        }
            const item = await this.itemRepo.findOne(classifyItem.item);
            await this.ciRepo.save(this.ciRepo.create({
                id: classifyItem.id,
                name: classifyItem.name,
                alias: classifyItem.alias,
                item,
                order: classifyItem.order,
                required: classifyItem.required
            }));
    }

    /**
     * 删除文章分类中的信息项
     * 
     * @param id 文章中信息项的id
     * 
     */
    async deleteClassifyItem(id: number) {
        const exist = await this.ciRepo.findOne(id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该信息项不存在!' });
        }
        await this.ciRepo.remove(exist);
        const arts = await this.artRepo.find({where:{classify:exist.classify}});
        const ids = arts.map(item=>item.id);
        const infos = await this.aiRepo.createQueryBuilder('artInfo')
            .leftJoinAndSelect('artInfo.article','Article')
            .where('Article.id IN(:...ids)',{ids})
            .getMany();
        await this.aiRepo.remove(infos);
        // wdnmd,这谁顶的住啊.删除文章分类中的信息项时,同时需要删除该文章分类下文章对应的信息项的值.目前没有实现方法,先放着..
        // const item = await this.itemRepo.findOne(exist.item);
        // await this.aiRepo.find({
        //     where: {
        //         item,
        //         article
        //     }
        // })
    }

}