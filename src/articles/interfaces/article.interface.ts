export interface inputArticle {
    title: string;
    userId: number;
    classifyId: number;
    cover: string;
    abstract: string;
    content: string;
    top: boolean;
    source: string;
    sourceUrl: string;
    createAt: string;
    infoKVs?: { key: number; value: string }[];
}

export interface updateArticle {
    id: number;
    title: string;
    classifyId: number;
    sourceUrl: string;
    cover: string;
    abstract: string;
    content: string;
    top: boolean;
    source: string;
    modifyAt?:string;
    status?: number;
    infoKVs?: {
        key: number;
        value: string;
        relationId?: number
    }[];
}

export  interface artResult {
    id: number;
    title: string;
    classifyName: string;
    sourceUrl: string;
    cover: string;
    abstract: string;
    content: string;
    top: boolean;
    source: string;
    userId: number;
    userName: string;
}