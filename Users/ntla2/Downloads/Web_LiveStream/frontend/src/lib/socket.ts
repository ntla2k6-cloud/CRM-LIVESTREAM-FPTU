import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Kết nối realtime có xác thực: xin mã ngắn hạn (/api/socket/token) rồi gửi kèm khi bắt tay.
 * Mỗi lần kết nối lại cũng xin mã mới (mã cũ có thể hết hạn).
 */
export function connectSocket() {
  const socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb: (data: object) => void) => {
      fetch('/api/socket/token', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => cb({ token: d?.token }))
        .catch(() => cb({}));
    },
  });
  socket.connect();
  return socket;
}
