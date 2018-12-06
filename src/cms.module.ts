import { Module } from "@nestjs/common";
import { ArticleController } from "./controllers/article.controller";
import { ClassifyController } from "./controllers/classify.controller";
import { MessageController } from "./controllers/message.controller";
import { ArticleService } from "./services/article.service";
import { MessageService } from "./services/message.service";
import { ClassifyService } from "./services/classify.service";
import { ClassifyEntity } from "./entities/classify.entity";
import { MessageEntity } from "./entities/message.entity";
import { ArticleEntity } from "./entities/article.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotaddGrpcClientFactory } from "./grpc.client-factory";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            
        }),
        TypeOrmModule.forFeature([ClassifyEntity,MessageEntity,ArticleEntity,]),
    ],
    controllers: [
        ArticleController,
        ClassifyController,
        MessageController,
    ],
    providers: [
        ArticleService,
        MessageService,
        ClassifyService,
        NotaddGrpcClientFactory
    ]
})
export class CmsModule { }