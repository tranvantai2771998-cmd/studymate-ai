import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Brain,
  CheckCircle,
  Calendar,
  FolderArchive,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { NavigationTab, UserPreferences } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingTasksCount: number;
  preferences: UserPreferences;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  pendingTasksCount,
  preferences,
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'summarizer' as NavigationTab, label: 'Tóm tắt bài giảng', icon: FileText },
    { id: 'explainer' as NavigationTab, label: 'Giải thích kiến thức', icon: Brain },
    { id: 'quiz' as NavigationTab, label: 'Tạo câu hỏi trắc nghiệm', icon: CheckCircle },
    {
      id: 'planner' as NavigationTab,
      label: 'Kế hoạch học tập',
      icon: Calendar,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    { id: 'library' as NavigationTab, label: 'Thư viện tài liệu', icon: FolderArchive },
    { id: 'history' as NavigationTab, label: 'Lịch sử học tập', icon: History },
    { id: 'analytics' as NavigationTab, label: 'Thống kê tiến độ', icon: BarChart3 },
    { id: 'settings' as NavigationTab, label: 'Cài đặt', icon: Settings },
  ];

  const roleLabels: Record<string, string> = {
    medical: 'Sinh viên Y khoa',
    dental: 'Sinh viên Răng Hàm Mặt',
    university: 'Sinh viên Đại học',
    general: 'Người tự học',
  };

  return (
    <aside
      className={`relative z-30 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 print:hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-900/40">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif-display font-bold text-base text-white tracking-tight truncate flex items-center gap-1.5">
                StudyMate AI
              </span>
              <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase">
                Academic Assistant
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              {!isCollapsed && item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Mini Footer */}
      <div className="p-3 border-t border-slate-800">
        <div
          onClick={() => onSelectTab('settings')}
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
            {preferences.userName.slice(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{preferences.userName}</div>
              <div className="text-[11px] text-slate-400 truncate">
                {roleLabels[preferences.userRole] || 'Sinh viên'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
