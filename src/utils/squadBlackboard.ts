/**
 * MODULE BLACKBOARD MEMORY - BẢNG TIN GIAO THƯƠNG NỘI BỘ BĂNG ĐỒNG ĐỘI
 * Giúp 5 Vai trò (Định hướng, Thực thi, Sáng tạo, Kết nối, Phản biện)
 * có thể trao đổi, phối hợp và lưu trữ tiến trình theo thời gian thực.
 */

export interface TeamMessage {
  id: string;
  senderRole: 'Trưởng nhóm (Định hướng)' | 'Thực thi (Chuyên môn)' | 'Sáng tạo (Giải pháp)' | 'Kết nối (Gắn kết)' | 'Phản biện (Kiểm soát)';
  content: string;
  timestamp: string;
  actionRequired?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface SquadState {
  currentVision: string;
  activeGoal: string;
  messages: TeamMessage[];
  lastUpdated: string;
}

const SQUAD_STORAGE_KEY = 'STUDYMATE_SQUAD_BLACKBOARD';

export const getSquadBlackboard = (): SquadState => {
  try {
    const raw = localStorage.getItem(SQUAD_STORAGE_KEY);
    if (!raw) {
      return {
        currentVision: 'Học tập để phát triển hệ thống tự hành - Phục vụ Anh Tài',
        activeGoal: 'Vận hành nhịp nhàng 5 Vai trò theo phương pháp Lắng nghe -> Cảm nhận -> Suy luận -> Trải nghiệm',
        messages: [],
        lastUpdated: new Date().toISOString(),
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      currentVision: 'Học tập để phát triển hệ thống tự hành - Phục vụ Anh Tài',
      activeGoal: 'Vận hành nhịp nhàng 5 Vai trò theo phương pháp Lắng nghe -> Cảm nhận -> Suy luận -> Trải nghiệm',
      messages: [],
      lastUpdated: new Date().toISOString(),
    };
  }
};

export const postToBlackboard = (
  senderRole: TeamMessage['senderRole'],
  content: string,
  actionRequired?: string
): TeamMessage => {
  const board = getSquadBlackboard();
  const newMsg: TeamMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderRole,
    content,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    actionRequired,
    status: 'PENDING',
  };

  board.messages.push(newMsg);
  // Giữ lại 30 tin nhắn phối hợp gần nhất để tiết kiệm bộ nhớ
  if (board.messages.length > 30) {
    board.messages.shift();
  }
  board.lastUpdated = new Date().toISOString();

  try {
    localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(board));
  } catch (err) {
    console.warn('Lỗi ghi Blackboard:', err);
  }

  return newMsg;
};
