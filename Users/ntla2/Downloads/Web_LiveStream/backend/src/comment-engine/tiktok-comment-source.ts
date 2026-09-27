import { CommentSource, CommentPayload } from './comment-source.interface.js';

import { TikTokLiveConnection } from 'tiktok-live-connector';

export class TiktokCommentSource implements CommentSource {
  private connection: any = null;
  private status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' = 'DISCONNECTED';
  
  private commentCallback?: (payload: CommentPayload) => void;
  private giftCallback?: (payload: any) => void;
  private likeCallback?: (payload: any) => void;

  async connect(targetId: string): Promise<void> {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') {
      this.disconnect();
    }
    this.status = 'CONNECTING';

    try {
      this.connection = new TikTokLiveConnection(targetId, {});

      this.connection.on('chat', (data: any) => {
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

      this.connection.on('gift', (data: any) => {
        if (this.giftCallback) this.giftCallback(data);
      });
      
      this.connection.on('like', (data: any) => {
        if (this.likeCallback) this.likeCallback(data);
      });

      this.connection.on('error', (err: any) => {
        console.error('[TikTokSource] Lỗi kết nối:', err);
        this.status = 'ERROR';
      });

      this.connection.on('disconnected', () => {
        console.log('[TikTokSource] Mất kết nối');
        this.status = 'DISCONNECTED';
        if (this.disconnectCallback) this.disconnectCallback();
      });

      await this.connection.connect();
      this.status = 'CONNECTED';
      console.log(`[TikTokSource] Đã kết nối tới @${targetId}`);
    } catch (err: any) {
      console.error('[TikTokSource] Lỗi khi kết nối:', err.message);
      this.status = 'ERROR';
      throw err;
    }
  }

  disconnect(): void {
    if (this.connection) {
      try {
        this.connection.disconnect();
      } catch (e) {}
    }
    this.connection = null;
    this.status = 'DISCONNECTED';
  }

  onComment(callback: (payload: CommentPayload) => void): void {
    this.commentCallback = callback;
  }

  onGift(callback: (payload: any) => void): void {
    this.giftCallback = callback;
  }

  onLike(callback: (payload: any) => void): void {
    this.likeCallback = callback;
  }

  private disconnectCallback?: () => void;

  onDisconnected(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  getStatus() {
    return this.status;
  }
}
