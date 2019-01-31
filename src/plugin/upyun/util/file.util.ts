
import { Injectable, HttpException, Inject } from "@nestjs/common";
import * as fs from "fs";

/* 异步操作文件的封装工具类 */
@Injectable()
export class FileUtil {

    constructor() { }

    async write(path: string, buffer: Buffer): Promise<void> {
        await new Promise((resolver, reject) => {
            fs.writeFile(path, buffer, (err) => {
                if (err) {
                    reject(new HttpException("文件写入磁盘错误:" + err.toString(), 406));
                    return;
                }
                resolver();
                return;
            });
        });
    }

    async read(path: string): Promise<Buffer> {
        const buffer: any = await new Promise((resolver, reject) => {
            fs.readFile(path, (err, buffer: Buffer) => {
                if (err) {
                    reject(new HttpException("读取文件错误:" + err.toString(), 406));
                    return;
                }
                resolver(buffer);
                return;
            });
        });
        return buffer;
    }

    async delete(path: string): Promise<void> {
        await new Promise((resolver, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(new HttpException("文件删除错误:" + err.toString(), 406));
                    return;
                }
                resolver();
                return;
            });
        });
    }

    async deleteIfExist(path: string): Promise<void> {
        if (fs.existsSync(path)) {
            await new Promise((resolver, reject) => {
                fs.unlink(path, (err) => {
                    if (err) {
                        reject(new HttpException("文件删除错误:" + err.toString(), 406));
                        return;
                    }
                    resolver();
                    return;
                });
            });
        }
    }

    // 获取文件状态，一般只有一个size能言用
    async size(path: string): Promise<number> {
        if (fs.existsSync(path)) {
            const size: any = await new Promise((resolver, reject) => {
                fs.stat(path, (err, stats: fs.Stats) => {
                    if (err) {
                        reject(new HttpException("获取文件状态错误:" + err.toString(), 406));
                        return;
                    }
                    resolver(stats.size);
                    return;
                });
            });
            return size;
        } else {
            return undefined;
        }
    }

    exist(path: string): boolean {
        return fs.existsSync(path);
    }

    async mkdir(path: string): Promise<void> {
        await new Promise((resolver, reject) => {
            fs.mkdir(path, (err) => {
                if (err) {
                    reject(new HttpException("创建目录错误:" + err.toString(), 406));
                    return;
                }
                resolver();
                return;
            });
        });
    }
}
