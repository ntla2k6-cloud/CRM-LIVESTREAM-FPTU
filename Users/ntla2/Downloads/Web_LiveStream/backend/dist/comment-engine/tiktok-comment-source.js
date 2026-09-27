import { TikTokLiveConnection } from 'tiktok-live-connector';
export class TiktokCommentSource {
    connection = null;
    status = 'DISCONNECTED';
    commentCallback;
    giftCallback;
    likeCallback;
    async connect(targetId) {
        if (this.status === 'CONNECTED' || this.status === 'CONNECTING') {
            this.disconnect();
        }
        this.status = 'CONNECTING';
        try {
            this.connection = new TikTokLiveConnection(targetId, {});
            this.connection.on('chat', (data) => {
                if (this.commentCallback) {
                    this.commentCallback({
                        platform: 'tiktok',
                        platformCommentId: data.msgId || data.createTime?.toString() || Math.random().toString(),
                        platformUserId: data.userId,
                        username: data.uniqueId,
                        displayName: data.nickname,
                        avatar: data.profilePictureUrl,
                        content: data.comment,
                        timestamp: new Date(parseInt(data.createTime) || Date.now()),
                        rawPayload: data
                    });
                }
            });
            this.connection.on('gift', (data) => {
                if (this.giftCallback)
                    this.giftCallback(data);
            });
            this.connection.on('like', (data) => {
                if (this.likeCallback)
                    this.likeCallback(data);
            });
            this.connection.on('error', (err) => {
                console.error('[TikTokSource] Lỗi kết nối:', err);
                this.status = 'ERROR';
            });
            this.connection.on('disconnected', () => {
                console.log('[TikTokSource] Mất kết nối');
                this.status = 'DISCONNECTED';
                if (this.disconnectCallback)
                    this.disconnectCallback();
            });
            await this.connection.connect();
            this.status = 'CONNECTED';
            console.log(`[TikTokSource] Đã kết nối tới @${targetId}`);
        }
        catch (err) {
            console.error('[TikTokSource] Lỗi khi kết nối:', err.message);
            this.status = 'ERROR';
            throw err;
        }
    }
    disconnect() {
        if (this.connection) {
            try {
                this.connection.disconnect();
            }
            catch (e) { }
        }
        this.connection = null;
        this.status = 'DISCONNECTED';
    }
    onComment(callback) {
        this.commentCallback = callback;
    }
    onGift(callback) {
        this.giftCallback = callback;
    }
    onLike(callback) {
        this.likeCallback = callback;
    }
    disconnectCallback;
    onDisconnected(callback) {
        this.disconnectCallback = callback;
    }
    getStatus() {
        return this.status;
    }
}
//# sourceMappingURL=tiktok-comment-source.js.map