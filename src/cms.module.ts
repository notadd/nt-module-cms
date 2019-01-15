import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule, InjectRepository } from "@nestjs/typeorm";
import { NotaddGrpcClientFactory } from "./grpc.client-factory";
import { TreeRepository, Repository } from "typeorm";
import { Classify } from "./articles/entities/classify.entity";
import { Article } from "./articles/entities/article.entity";
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
import { DiscussController } from "./plugin/comment/controllers/discuss.controller";
import { DiscussService } from "./plugin/comment/services/discuss.service";
import { CommentProperties } from "./plugin/comment/entities/comment-properties.entity";
import {  Discuss } from "./plugin/comment/entities/discuss.entity";
import { CommentPropertiesController } from "./plugin/comment/controllers/comment-properties.controller";
import { CommentPropertiesService } from "./plugin/comment/services/comment-properties.service";
import { MessageBoard } from "./plugin/message-board/entities/message-board.entity";
import { ArtInfo } from "./articles/entities/art-info.entity";
import { ClassifyItem } from "./articles/entities/classify-item.entity";
import { Leaveword } from "./plugin/message-board/entities/leaveword.entity";
import { BoardItem } from "./plugin/message-board/entities/board-item.entity";
import { LeavewordInfo } from "./plugin/message-board/entities/leaveword-info.entity";
import { ClassifyItemController } from "./articles/controllers/classify-item.controller";
import { ClassifyItemService } from "./articles/services/classify-item.service";
import { MessageBoardController } from "./plugin/message-board/controllers/message-board.controller";
import { LeavewordController } from "./plugin/message-board/controllers/leaveword.conteroller";
import { BoardItemController } from "./plugin/message-board/controllers/board-item.controller";
import { MessageBoardService } from "./plugin/message-board/services/message-board.service";
import { LeavewordService } from "./plugin/message-board/services/leaveword.service";
import { BoardItemService } from "./plugin/message-board/services/board-item.service";
import { Message } from "./articles/entities/message.entity";
import { UserMessage } from "./articles/entities/user-message.entity";

@Module({
    imports: [
        TypeOrmModule.forRoot({

        }),
        TypeOrmModule.forFeature([Classify, ClassifyItem, Message, UserMessage, Article, ArtInfo, Item, PageSort, Page, Content, Discuss, CommentProperties, MessageBoard, Leaveword, BoardItem, LeavewordInfo]),
    ],
    controllers: [
        ArticleController,
        ClassifyController,
        ClassifyItemController,
        MessageController,
        UserMessageController,
        ItemController,
        PageSortController,
        PageController,
        DiscussController,
        CommentPropertiesController,
        MessageBoardController,
        LeavewordController,
        BoardItemController
    ],
    providers: [
        ArticleService,
        MessageService,
        ClassifyService,
        ClassifyItemService,
        UserMessageService,
        NotaddGrpcClientFactory,
        ItemService,
        PageSortService,
        PageService,
        DiscussService,
        CommentPropertiesService,
        MessageBoardService,
        LeavewordService,
        BoardItemService
    ]
})

export class CmsModule implements OnModuleInit {
    constructor(
        @InjectRepository(Classify) private readonly claRepository: TreeRepository<Classify>,
        @InjectRepository(PageSort) private readonly psRepository: TreeRepository<PageSort>,
        @InjectRepository(CommentProperties) private readonly cpRepo: Repository<CommentProperties>,
        private readonly classifyService: ClassifyService,
        private readonly pageSortService: PageSortService,
    ) { }

    async onModuleInit() {
        await this.createRootClassify();
        await this.createPageSortClassify();
        await this.createProperties();
    }

    private async createRootClassify() {
        const root = await this.claRepository.findOne({ where: { alias: '总分类' } });
        if (!root) {
            await this.classifyService.addClassify({ name: '总分类', alias: '总分类', parent: { id: 0 }, onlyChildrenArt: true });
        }
    }

    private async createPageSortClassify() {
        const root = await this.psRepository.findOne({ where: { alias: '总分类' } });
        if (!root) {
            await this.pageSortService.createPageSort({ name: '总分类', alias: '总分类', parent: { id: 0 } });
        }
    }

    private async createProperties() {
        const exist = await this.cpRepo.find();
        if (!exist.length) {
            await this.cpRepo.save(this.cpRepo.create({}));
        }
    }

}