import React, { useState } from 'react';
import {
  Settings,
  User,
  GraduationCap,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { UserPreferences, ExaminationDate, UserRole } from '../../types';
import { savePreferences } from '../../data/storage';

interface SettingsModuleProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [userName, setUserName] = useState(preferences.userName);
  const [userRole, setUserRole] = useState<UserRole>(preferences.userRole);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(preferences.dailyStudyGoalMinutes);
  const [subjects, setSubjects] = useState<string[]>([...preferences.currentSubjects]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [examDates, setExamDates] = useState<ExaminationDate[]>([...preferences.examinationDates]);

  // New exam form
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubject, setNewExamSubject] = useState(preferences.currentSubjects[0] || '');
  const [newExamDate, setNewExamDate] = useState('');

  const [isSaved, setIsSaved] = useState(false);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim() || subjects.includes(newSubjectInput.trim())) return;
    setSubjects([...subjects, newSubjectInput.trim()]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (sub: string) => {
    if (subjects.length <= 1) {
      alert('Bạn phải giữ ít nhất 1 môn học!');
      return;
    }
    setSubjects(subjects.filter((s) => s !== sub));
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDate) return;

    const newExam: ExaminationDate = {
      id: `ex-${Date.now()}`,
      title: newExamTitle.trim(),
      subject: newExamSubject || subjects[0] || 'Chuyên khoa',
      date: newExamDate,
    };

    setExamDates([...examDates, newExam]);
    setNewExamTitle('');
    setNewExamDate('');
  };

  const handleRemoveExam = (id: string) => {
    setExamDates(examDates.filter((e) => e.id !== id));
  };

  const handleSaveAll = () => {
    const updated: UserPreferences = {
      ...preferences,
      userName: userName.trim() || 'Học viên Y khoa',
      userRole,
      dailyStudyGoalMinutes: Number(dailyGoalMinutes),
      currentSubjects: subjects,
      examinationDates: examDates,
    };

    savePreferences(updated);
    onUpdatePreferences(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            <Settings className="w-4 h-4" />
            <span>Tùy chỉnh hồ sơ & Kế hoạch học tập</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Cài đặt cá nhân hóa
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Đã lưu thành công!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info & Role */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Thông tin người học</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tên hiển thị / Danh xưng
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Đối tượng người dùng / Chuyên ngành
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value="medical">Sinh viên Y khoa & Bác sĩ lâm sàng</option>
                <option value="dental">Sinh viên Răng Hàm Mặt & Bác sĩ Nha khoa</option>
                <option value="university">Sinh viên Đại học tổng hợp</option>
                <option value="general">Người tự học chuyên sâu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mục tiêu học tập hàng ngày (phút)
              </label>
              <select
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value={60}>60 phút (1 giờ / ngày)</option>
                <option value={90}>90 phút (1.5 giờ / ngày)</option>
                <option value={120}>120 phút (2 giờ / ngày - Khuyên dùng)</option>
                <option value={180}>180 phút (3 giờ / ngày - Ôn thi)</option>
                <option value={240}>240 phút (4 giờ / ngày - Cấp tốc)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current Subjects List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Môn học & Chuyên khoa đang theo dõi</span>
          </h3>

          <form onSubmit={handleAddSubject} className="flex gap-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              placeholder="Thêm môn mới (ví dụ: Miễn dịch học)..."
              className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Thêm
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {subjects.map((sub) => (
              <div
                key={sub}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{sub}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(sub)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Examination Dates Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Kỳ thi & Mục tiêu sắp tới</span>
        </h3>

        {/* Add Exam Form */}
        <form onSubmit={handleAddExam} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="sm:col-span-2">
            <input
              type="text"
              required
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              placeholder="Tên kỳ thi (ví dụ: Thi Hết môn Dược lý)"
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <select
              value={newExamSubject}
              onChange={(e) => setNewExamSubject(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              required
              value={newExamDate}
              onChange={(e) => setNewExamDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shrink-0"
            >
              Thêm
            </button>
          </div>
        </form>

        {/* Exam list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {examDates.map((ex) => {
            const diffDays = Math.ceil((new Date(ex.date).getTime() - Date.now()) / 86400000);
            return (
              <div
                key={ex.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{ex.subject}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {diffDays > 0 ? `Còn ${diffDays} ngày` : 'Đã đến ngày thi'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {ex.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ngày thi: {ex.date}
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveExam(ex.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
