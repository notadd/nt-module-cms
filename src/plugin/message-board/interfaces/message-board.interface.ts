export interface CreateBoardInput {
    name: string;
    alias: string;
    boardItem: {
        name: string;
        alias: string;
        required: boolean;
        itemId: number;
    }[]
}

export class UpdateBoardInput {
    id: number;
    name: string;
    alias: string;
}

export class UpdateBoardItemInput {
    id: number;
    name: string;
    alias: string;
    item: number;
    required: boolean;
}