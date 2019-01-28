export interface CreateLeavewordInput {
    userId: number;
    messageBoardId: number;
    infoKVs: {
        infoItemId: number;
        artInfoValue: string
    }[]
}