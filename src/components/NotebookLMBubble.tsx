import React, { useState, useEffect } from 'react';
import { NotebookPen, Cloud, X, Maximize2 } from 'lucide-react';
import { UserPreferences } from '../types';
import { GeminiNotebookWorkspace } from './GeminiNotebookWorkspace';
import { getDriveAccessToken, initDriveAuth } from '../utils/googleDrive';

interface NotebookLMBubbleProps {
  preferences: UserPreferences;
  onOpenInAppNotebook: () => void;
}

export const NotebookLMBubble: React.FC<NotebookLMBubbleProps> = ({
  preferences,
  onOpenInAppNotebook,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() =>
    Boolean(getDriveAccessToken())
  );

  useEffect(() => {
    setIsDriveConnected(Boolean(getDriveAccessToken()));
    const unsubscribe = initDriveAuth(
      (_user, token) => setIsDriveConnected(Boolean(token)),
      () => setIsDriveConnected(false)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <>
      {/* Embedded Slide-Over Kho Drive & Gemini Notebook Workspace */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <section
            aria-label="Kho Drive & Gemini Notebook nhúng trực tiếp"
            className="relative z-10 w-full max-w-5xl h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Embedded Workspace Header */}
            <div className="h-14 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white flex items-center justify-center shrink-0">
                  <NotebookPen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Kho Drive &amp; Gemini Notebook
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Không gian lưu trữ &amp; hỏi đáp tài liệu nhúng trực tiếp trong StudyMate AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenInAppNotebook();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mở toàn trang trong Thư viện</span>
                  <span className="sm:hidden">Toàn trang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Đóng Kho Drive & Gemini Notebook"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Scrollable Workspace Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <GeminiNotebookWorkspace
                preferences={preferences}
                compact
                onExpandFullScreen={() => {
                  setIsDrawerOpen(false);
                  onOpenInAppNotebook();
                }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Floating Launcher Bubble Button (#nlm-bubble-btn) */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          id="nlm-bubble-btn"
          type="button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          title="Mở Kho Drive & Gemini Notebook trực tiếp tại đây"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white text-xs font-bold shadow-xl border border-white/15 transition-all cursor-pointer"
        >
          <span className="relative flex items-center justify-center">
            <Cloud className="w-4 h-4" />
            {isDriveConnected && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-teal-600"
                title="Google Drive đã kết nối"
              />
            )}
          </span>
          <span>Kho Drive &amp; Gemini Notebook</span>
        </button>
      </div>
    </>
  );
};
