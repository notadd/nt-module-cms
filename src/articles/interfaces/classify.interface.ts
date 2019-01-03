export interface CreateClassify {
    name: string;
    alias: string;
    onlyChildrenArt: boolean;
    parent: { id: number };
}