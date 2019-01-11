import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CommentProperties } from "../entities/comment-properties.entity";
import { Repository } from "typeorm";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class CommentPropertiesService {
    constructor(
        @InjectRepository(CommentProperties) private readonly cpRepo: Repository<CommentProperties>,
    ) { }

    async getAllCommentProperties() {
        const data = await this.cpRepo.find();
        return data[0];
    }

    async updateCommentProperties(id: number, name: string) {
        const exist = await this.cpRepo.findOne(id);
        if (!exist) {
            throw new RpcException({ code: 404, message: '该配置文件不存在!' });
        }
        switch (name) {
            case 'enableComment':
                if (exist.enableComment === true) {
                    await this.cpRepo.update(id, { enableComment: false });
                }
                if (!exist.enableComment) {
                    await this.cpRepo.update(id, { enableComment: true });
                }
                break;
            case 'needAudit':
                if (exist.needAudit === true) {
                    await this.cpRepo.update(id, { needAudit: false });
                }
                if (!exist.needAudit) {
                    await this.cpRepo.update(id, { needAudit: true });
                };
                break;
            case 'enableStar':
                if (exist.enableStar === true) {
                    await this.cpRepo.update(id, { enableStar: false });
                }
                if (!exist.enableStar) {
                    await this.cpRepo.update(id, { enableStar: true });
                }
                break;
        }

    }

}