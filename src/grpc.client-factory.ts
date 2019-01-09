import { Injectable } from '@nestjs/common';
import { Client, ClientGrpc, GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Injectable()
export class NotaddGrpcClientFactory {
    @Client(generateGrpcOptions('localhost:50051', 'notadd_module_user', 'user-module.proto'))
    public readonly userModuleClient: ClientGrpc;
}

export function generateGrpcOptions(url: string, packageName: string, protoFileName: string): GrpcOptions {
    return {
        transport: Transport.GRPC,
        options: {
            url,
            package: packageName,
            protoPath: join(__dirname, 'grpc/protobufs/' + protoFileName),
            loader: {
                arrays: true
            }
        }
    };
}