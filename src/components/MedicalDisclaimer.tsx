import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  compact?: boolean;
  className?: string;
}

export const MedicalDisclaimer: React.FC<Props> = ({ compact = false, className = '' }) => (
  <div
    className={`flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 ${className}`}
    role="note"
    aria-label="Miễn trừ trách nhiệm y khoa"
  >
    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
    <p className={compact ? 'text-[11px] leading-relaxed' : 'text-xs leading-relaxed'}>
      <span className="font-semibold">Chỉ dùng cho mục đích học tập.</span>{' '}
      Nội dung AI có thể chưa đầy đủ hoặc sai và <span className="font-semibold">không thay thế</span> chẩn đoán, kê đơn, điều trị
      hoặc tư vấn của bác sĩ/nhân viên y tế. Với tình huống khẩn cấp hoặc vấn đề sức khỏe cá nhân, hãy liên hệ cơ sở y tế.
    </p>
  </div>
);

export const AiFallbackWarning: React.FC<{ message?: string; className?: string }> = ({ message, className = '' }) => (
  <div
    className={`flex items-start gap-2 rounded-xl border border-orange-200/80 bg-orange-50/80 px-3 py-2 text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200 ${className}`}
    role="status"
  >
    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
    <p className="text-xs leading-relaxed">
      <span className="font-semibold">Nội dung dự phòng.</span>{' '}
      {message || 'Kết nối AI gặp sự cố nên hệ thống hiển thị dữ liệu dự phòng mang tính tham khảo. Cần kiểm chứng trước khi sử dụng.'}
    </p>
  </div>
);
