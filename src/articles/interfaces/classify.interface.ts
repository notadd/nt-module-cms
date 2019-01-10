export interface CreateClassify {
    name: string;
    alias: string;
    parent: { id: number };
    onlyChildrenArt: boolean;
    classifyItem?: {
        name: string;
        alias: string;
        required: boolean;
        order: number;
        itemId: number;
    }[];
}