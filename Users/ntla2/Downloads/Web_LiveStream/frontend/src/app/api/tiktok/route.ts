import { NextResponse } from 'next/server';
import { TikTokLiveConnection } from 'tiktok-live-connector';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập TikTok Username' }, { status: 400 });
    }

    const cleanUsername = username.replace('@', '').trim();
    
    // Khởi tạo connection
    const tiktokLiveConnection = new TikTokLiveConnection(cleanUsername, {});
    
    // Thử kết nối (Promise)
    const state = await tiktokLiveConnection.connect();
    
    // Nếu kết nối thành công, lấy thông tin room
    const roomInfo = {
      roomId: state.roomId,
      roomTitle: state.roomInfo?.title || 'Đang phát LIVE',
      hostName: state.roomInfo?.owner?.nickname || cleanUsername,
      viewerCount: state.roomInfo?.viewerCount || 0,
    };
    
    // Ngắt kết nối ngay vì đây chỉ là API test
    tiktokLiveConnection.disconnect();

    return NextResponse.json({ 
      success: true, 
      message: `Kết nối thành công tới phiên LIVE của ${roomInfo.hostName}!`,
      roomInfo 
    });

  } catch (error: any) {
    console.error('TikTok API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message?.includes('not currently live') 
        ? 'Kênh này hiện không phát LIVE. Vui lòng thử lại khi kênh đang phát.' 
        : `Lỗi kết nối: ${error.message || 'Không xác định'}`
    }, { status: 400 });
  }
}
