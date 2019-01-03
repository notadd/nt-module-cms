import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PageSort } from "../entities/page-sort.entity";
import { TreeRepository, In } from "typeorm";
import { RpcException } from "@nestjs/microservices";
import { Page } from "../entities/page.entity";

@Injectable()
export class PageSortService {
    constructor(
        @InjectRepository(PageSort) private readonly psRepo: TreeRepository<PageSort>,
        @InjectRepository(Page) private readonly pageRepo: TreeRepository<Page>,
    ) { }

    async createPageSort(pageSort: PageSort) {
        try {
            const ignore = await this.psRepo.count();
            if (!pageSort.parent.id || ignore <= 0) {
                await this.psRepo.save({ name: pageSort.name, alias: pageSort.alias });
                return { code: 200, message: '创建成功' };
            }
            if (pageSort.parent) {
                const exist = await this.psRepo.findOne(pageSort.parent.id);
                if (!exist) {
                    throw new RpcException({ code: 406, message: '当前分类父节点不存在!' });
                }
                pageSort.parent = exist;
            }
            const result = await this.psRepo.findOne({ where: { alias: pageSort.alias } });
            if (result) {
                throw new RpcException({ code: 406, message: '别名重复!' });
            }
            await this.psRepo.save(this.psRepo.create(pageSort));
        } catch (error) {
            throw new RpcException({ code: 500, message: error.toString() });
        }
    }

    async updatePageSort(pageSort: PageSort) {
        const exist = await this.psRepo.findOne(pageSort.id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该页面分类不存在!' });
        }
        if (pageSort.alias && pageSort.alias !== exist.alias) {
            if (await this.psRepo.findOne({ alias: pageSort.alias })) {
                throw new RpcException({ code: 406, message: '别名重复!' });
            }
        }
        const parent = await this.psRepo.findOne(pageSort.parent.id);
        if (!parent) {
            throw new RpcException({ code: 404, message: '该上级分类不存在!' });
        }
        try {
            await this.psRepo.save(await this.psRepo.create(pageSort));
        } catch (error) {
            throw new RpcException({ code: 500, message: error.toString() });
        }
    }

    async deletePageSort(id: number) {
        const pageSort = await this.psRepo.findOne(id);
        if (!pageSort) {
            throw new RpcException({ code: 404, message: '该页面分类不存在!' });
        }
        const array = await this.getAllClassifyIds(id);
        const pages = await this.pageRepo.count({ where: { pageSort: In(array) } });
        if (pages > 0) {
            throw new RpcException({ code: 403, message: '当前分类下有页面,不能删除' })
        }
        array.splice(array.indexOf(id), 1);
        if (array.length) {
            throw new RpcException({ code: 403, message: '当前分类下有子分类,不能删除' });
        }
        await this.psRepo.remove(pageSort);
    }

    async getAllPageSort() {
        const result = await this.psRepo.findTrees();
        return { code: 200, message: '查询成功!', data: result };
    }

    async getOnePageSort(id:number) {
        const exist = await this.psRepo.findOne(id);
        if(!exist){
            throw new RpcException({code:200,message:'该页面分类不存在!'});
        }
        const data = await this.psRepo.findDescendantsTree(exist);
        return data;
    }

    async getAllClassifyIds(idNum: number): Promise<number[]> {
        const array: number[] = [];
        const classify = await this.psRepo.findOne({ id: idNum });
        await this.psRepo.findDescendants(classify).then(a => {
            if (a) {
                a.map(a => {
                    array.push(a.id);
                });
            }
        });
        return array;
    }

}