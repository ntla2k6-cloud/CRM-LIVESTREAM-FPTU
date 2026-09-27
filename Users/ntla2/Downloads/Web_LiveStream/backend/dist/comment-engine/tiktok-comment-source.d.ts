import { CommentSource, CommentPayload } from './comment-source.interface.js';
export declare class TiktokCommentSource implements CommentSource {
    private connection;
    private status;
    private commentCallback?;
    private giftCallback?;
    private likeCallback?;
    connect(targetId: string): Promise<void>;
    disconnect(): void;
    onComment(callback: (payload: CommentPayload) => void): void;
    onGift(callback: (payload: any) => void): void;
    onLike(callback: (payload: any) => void): void;
    getStatus(): "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
}
