import { Injectable } from "@nestjs/common";
import { CreateClassify } from "../interfaces/classify.interface";
import { InjectRepository } from '@nestjs/typeorm';
import { ClassifyEntity } from "../entities/classify.entity";
import { ArticleEntity } from "../entities/article.entity";
import { TreeRepository, Repository, In } from "typeorm";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class ClassifyService {
    constructor(
        @InjectRepository(ClassifyEntity) private readonly claRepository: TreeRepository<ClassifyEntity>,
        @InjectRepository(ArticleEntity) private readonly artRepository: Repository<ArticleEntity>
    ) { }

    /**
     * 新增文章分类
     * 
     * @param classify 新增分类实体: {name:'xxx',parentId:1}
     */
    async addClassify(classify: CreateClassify) {
        try {
            const ignore = await this.claRepository.count();
            if (!classify.parent.id || ignore <= 0) {
                await this.claRepository.save({ name: classify.name });
                return { code: 200, message: '创建成功' };
            }
            if (classify.parent) {
                const exist = await this.claRepository.findOne({ id: classify.parent.id });
                if (!exist) {
                    return { code: 405, message: '当前分类父节点不存在' };
                }
                classify.parent = exist;
            }
            await this.claRepository.save(await this.claRepository.create(classify));
        } catch (err) {
            throw new RpcException({ code: 404, message: err.toString });
        }
        return { code: 200, message: '创建成功!' }
    }

    /**
     * 删除文章分类
     * 
     * @param id 文章分类id
     */
    async delClassify(id: number) {
        const classify: ClassifyEntity = await this.claRepository.findOne({ id });
        if (!classify) {
            return { code: 405, message: '当前分类不存在' };
        }
        const array = await this.getAllClassifyIds(id);
        const articles = await this.artRepository.count({ where: { classifyId: In(array) } });
        if (articles > 0) {
            throw new RpcException({ code: 403, message: '当前分类下有文章,不能删除' })
        }
        array.splice(array.indexOf(id), 1);
        if (array.length) {
            throw new RpcException({ code: 403, message: '当前分类下有子分类,不能删除' });
        }
        await this.claRepository.remove(classify);
        return { code: 200, message: '删除成功' };
    }

    /**
     * 获取该分类所有子分类id
     * 
     * @param idNum 指定分类id
     */
    async getAllClassifyIds(idNum: number): Promise<number[]> {
        const array: number[] = [];
        const classify = await this.claRepository.findOne({ id: idNum });
        await this.claRepository.findDescendants(classify).then(a => {
            if (a) {
                a.map(a => {
                    array.push(a.id);
                });
            }
        });
        return array;
    }

    /**
     * 修改分类
     * 
     * @param classify 被修改分类实体: {id:2,name:'xxx',parent:{id:1}}
     */
    async updateClassify(classify: ClassifyEntity) {
        const exist = await this.claRepository.findOne({ id: classify.id });
        if (!exist) {
            return { code: 404, message: '当前分类不存在!' };
        }
        if (classify.name && classify.name !== exist.name) {
            if (await this.claRepository.findOne({ where: { name: classify.name } })) {
                throw new RpcException({ code: 409, message: '该分类名称已存在!' });
            }
        }
        const parent = await this.claRepository.findOne({ id: classify.parent.id });
        if (!parent) {
            throw new RpcException({ code: 404, message: '该上级分类不存在' });
        }
        try {
            await this.claRepository.save(await this.claRepository.create(classify));
        } catch (err) {
            throw new RpcException({ code: 405, message: err.toString });
        }
    }


    /**
     * 查询所有分类
     * 
     * @param id 
     */
    async getAllClassify(id: number) {
        if (id) {
            const exist = await this.claRepository.findOne(id);
            if (!exist) {
                throw new RpcException({ code: 404, message: '该分类不存在!' });
            }
            const result = await this.claRepository.findDescendantsTree(exist);
            return { code: 200, message: '查询成功!', data: result };
        } else {
            const result = await this.claRepository.findTrees();
            return { code: 200, message: '查询成功!', data: result };
        }
    }

    /**
     * 查询分类详情
     * 
     * @param id 指定分类id
     */
    async getOneClassify(id: number) {
        const exist = await this.claRepository.findOne({ id });
        if (!exist) {
            throw new RpcException({ code: 200, message: '该分类不存在!' });
        }
        const data = await this.claRepository.findDescendantsTree(exist);
        return { data };
    }

    /**
     * 获取上级分类
     * 
     * @param id 指定分类id
     */
    async getParentClassify(id: number) {
        const exist = await this.claRepository.findOne({ id });
        if (!exist) {
            throw new RpcException({ code: 404, message: '该分类不存在!' });
        }
        const data = await this.claRepository.findAncestorsTree(exist);
        return { code: 200, message: '查询成功!', data: [data] }
    }

    /**
     * 移动分类下的文章至另一分类
     * 
     * @param classifyId 原分类id
     * @param newClassifyId 需要移至分类id
     */
    async mobileArticles(classifyId: number, newClassifyId: number) {
        const exist = await this.claRepository.findOne({ where: { id: classifyId } });
        if (!exist) {
            return { code: 404, message: '原分类不存在!' };
        }
        const newClassify = await this.claRepository.findOne({ where: { id: newClassifyId } });
        if (!newClassify) {
            return { code: 404, message: '所选分类不存在!' };
        }
        const array = await this.getAllClassifyIds(classifyId);
        try {
            // 修改文章分类
            await this.artRepository.update({ classifyId: In(array) }, { classifyId: newClassifyId });
        } catch (err) {
            throw new RpcException({ code: 405, message: err.toString });
        }
    }

}