import { NestFactory } from '@nestjs/core';

import { CmsModule } from './cms.module';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.createMicroservice(CmsModule, {
        transport: Transport.GRPC,
        options: {
            url: 'localhost:50050',
            package: 'notadd_module_cms',
            protoPath: join(__dirname, './protobufs/cms.proto')
        }
    });
    await app.listenAsync();
}

bootstrap();