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
    infoKVs?: {
        artInfoId: number;
        artInfoValue: string;
        infoItemId?: number }[];
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
        artInfoId: number;
        artInfoValue: string;
        infoItemId?: number
    }[];
    userId: number;
}

export  interface artResult {
    id: number;
    title: string;
    classify: {
        id: number;
        name: string;
        alias: string;
        onlyChildrenArt: boolean;
    };
    sourceUrl: string;
    cover: string;
    abstract: string;
    content: string;
    top: boolean;
    source: string;
    userId: number;
    username: string;
}