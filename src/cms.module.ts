import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule, InjectRepository } from "@nestjs/typeorm";
import { NotaddGrpcClientFactory } from "./grpc.client-factory";
import { TreeRepository } from "typeorm";
import { Classify } from "./articles/entities/classify.entity";
import { MessageEntity } from "./articles/entities/message.entity";
import { Article } from "./articles/entities/article.entity";
import { UserMessage } from "./articles/entities/user-message.entity";
import { ArticleController } from "./articles/controllers/article.controller";
import { ClassifyController } from "./articles/controllers/classify.controller";
import { MessageController } from "./articles/controllers/message.controller";
import { UserMessageController } from "./articles/controllers/user-message.controller";
import { ItemController } from "./articles/controllers/item.controller";
import { ArticleService } from "./articles/services/article.service";
import { MessageService } from "./articles/services/message.service";
import { ClassifyService } from "./articles/services/classify.service";
import { UserMessageService } from "./articles/services/user-message.service";
import { ItemService } from "./articles/services/item.service";
import { Item } from "./articles/entities/item.entity";
import { PageSort } from "./pages/entities/page-sort.entity";
import { Page } from "./pages/entities/page.entity";
import { PageController } from "./pages/controllers/page.controller";
import { PageSortService } from "./pages/services/page-sort.service";
import { PageService } from "./pages/services/page.service";
import { PageSortController } from "./pages/controllers/page-sort.controller";
import { Content } from "./pages/entities/content.entity";

@Module({
    imports: [
        TypeOrmModule.forRoot({

        }),
        TypeOrmModule.forFeature([Classify, MessageEntity, Article, UserMessage, Item, PageSort, Page, Content]),
    ],
    controllers: [
        ArticleController,
        ClassifyController,
        MessageController,
        UserMessageController,
        ItemController,
        PageSortController,
        PageController
    ],
    providers: [
        ArticleService,
        MessageService,
        ClassifyService,
        UserMessageService,
        NotaddGrpcClientFactory,
        ItemService,
        PageSortService,
        PageService
    ]
})

export class CmsModule implements OnModuleInit {
    constructor(
        @InjectRepository(Classify) private readonly claRepository: TreeRepository<Classify>,
        private readonly classifyService: ClassifyService,
    ) { }

    async onModuleInit() {
        await this.createRootClassify();
    }

    private async createRootClassify() {
        const root = await this.claRepository.findOne({ where: { alias: '总分类' } });
        if (!root) {
            await this.classifyService.addClassify({ name: '总分类', alias: '总分类' , parent: { id: 0 }, onlyChildrenArt: true });
        }
    }
}