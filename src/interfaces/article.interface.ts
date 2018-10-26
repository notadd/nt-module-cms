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
    asbstact: string;
    content: string;
    top: boolean;
    source: string;
}