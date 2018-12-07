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
}

export  interface artResult {
    id: number;
    title: string;
    classifyId: number;
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