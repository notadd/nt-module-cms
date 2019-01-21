import { NestFactory } from '@nestjs/core';

import { CmsModule } from './cms.module';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.createMicroservice(CmsModule, {
        transport: Transport.GRPC,
        options: {
            url: 'localhost:50052',
            package: 'nt_module_cms',
            protoPath: join(__dirname, 'nt_module_cms.proto'),
            loader: {
                arrays: true
            }
        }
    });
    await app.listenAsync();
}

bootstrap();