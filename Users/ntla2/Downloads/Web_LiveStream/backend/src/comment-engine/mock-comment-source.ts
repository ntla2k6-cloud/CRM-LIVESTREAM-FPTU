import { CommentSource, CommentPayload } from './comment-source.interface.js';

export class MockCommentSource implements CommentSource {
  private status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' = 'DISCONNECTED';
  private commentCallback?: (payload: CommentPayload) => void;
  private disconnectCallback?: () => void;
  private intervalId: NodeJS.Timeout | null = null;
  private mockUsernames = ['ntla2', 'fptu_fan', 'dangkytruong', 'sinhvien_123', 'hotgirl_00'];
  private mockContents = [
    'Cho em hỏi học phí kỳ 1 là bao nhiêu ạ?',
    'Em để lại SĐT 0987654321 tư vấn em nhé!',
    'Đại học FPT có cơ sở ở Đà Nẵng không?',
    'MOCK COMMENT: Test system flow',
    'Quan tâm ngành Truyền thông Đa phương tiện',
    'Chào anh chị, buổi live hay quá!',
    'MOCK COMMENT: Cần hỗ trợ 0901234567'
  ];

  async connect(targetId: string): Promise<void> {
    this.status = 'CONNECTING';
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.status = 'CONNECTED';
    console.log(`[MockSource] Đã kết nối tới Mock LIVE: ${targetId}`);
    
    // Generate mock comments every 3-8 seconds
    this.intervalId = setInterval(() => {
      if (this.status !== 'CONNECTED') return;
      
      const isLead = Math.random() > 0.7; // 30% chance of being a lead with a phone number
      const content = isLead ? `Tư vấn em số 09${Math.floor(Math.random() * 100000000)}` : this.mockContents[Math.floor(Math.random() * this.mockContents.length)];
      
      if (this.commentCallback) {
        this.commentCallback({
          platform: 'mock',
          platformCommentId: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          platformUserId: `user-${Math.floor(Math.random() * 1000)}`,
          username: this.mockUsernames[Math.floor(Math.random() * this.mockUsernames.length)],
          displayName: 'Mock User',
          avatar: '',
          content: content,
          timestamp: new Date()
        });
      }
    }, Math.floor(Math.random() * 5000) + 3000);
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status = 'DISCONNECTED';
    if (this.disconnectCallback) this.disconnectCallback();
    console.log('[MockSource] Đã ngắt kết nối');
  }

  onComment(callback: (payload: CommentPayload) => void): void {
    this.commentCallback = callback;
  }

  onGift(callback: (payload: any) => void): void {}
  onLike(callback: (payload: any) => void): void {}

  onDisconnected(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  getStatus() {
    return this.status;
  }
}
