export interface CreateLeavewordInput {
    userId: number;
    messageBoardId: number;
    infoKVs: {
        key: number;
        value: string
    }[]
}