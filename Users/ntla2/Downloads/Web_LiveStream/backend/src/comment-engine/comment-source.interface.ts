export interface CommentPayload {
  platform: string;
  platformCommentId: string;
  platformUserId?: string;
  username: string;
  displayName?: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  rawPayload?: any;
}

export interface CommentSource {
  connect(targetId: string): Promise<void>;
  disconnect(): void;
  
  onComment(callback: (payload: CommentPayload) => void): void;
  onGift(callback: (payload: any) => void): void;
  onLike(callback: (payload: any) => void): void;
  onDisconnected(callback: () => void): void;
  
  getStatus(): 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
}
