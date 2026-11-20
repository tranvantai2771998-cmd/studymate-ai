import React, { useState, useEffect } from 'react';
import {
  NotebookPen,
  ExternalLink,
  SlidersHorizontal,
  X,
  Check,
  Cloud,
  Copy,
} from 'lucide-react';
import { UserPreferences } from '../types';
import { DEFAULT_NOTEBOOKLM_URL, savePreferences } from '../data/storage';

interface NotebookLMBubbleProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  onOpenInAppNotebook: () => void;
}

export const NotebookLMBubble: React.FC<NotebookLMBubbleProps> = ({
  preferences,
  onUpdatePreferences,
  onOpenInAppNotebook,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(
    preferences.notebookLmUrl || DEFAULT_NOTEBOOKLM_URL
  );
  const [savedFlag, setSavedFlag] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setDraftUrl(preferences.notebookLmUrl || DEFAULT_NOTEBOOKLM_URL);
  }, [preferences.notebookLmUrl]);

  const activeUrl =
    (preferences.notebookLmUrl && preferences.notebookLmUrl.trim()) ||
    DEFAULT_NOTEBOOKLM_URL;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftUrl.trim() || DEFAULT_NOTEBOOKLM_URL;
    const updated: UserPreferences = {
      ...preferences,
      notebookLmUrl: cleaned,
    };
    savePreferences(updated);
    onUpdatePreferences(updated);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 2000);
  };

  const embedSnippet = `<button id="nlm-bubble-btn" type="button">NotebookLM</button>
<script>
  document.getElementById('nlm-bubble-btn').addEventListener('click', function () {
    const url = '${activeUrl}';
    const width = 420;
    const height = 650;
    const left = window.screen.width - width - 30;
    const top = window.screen.height - height - 80;

    window.open(
      url,
      'NotebookLMChat',
      \`width=\${width},height=\${height},left=\${left},top=\${top},resizable=yes,scrollbars=yes\`
    );
  });
</script>`;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore clipboard denial
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 print:hidden">
      {/* Quick Configuration & Dual-Workspace Popover */}
      {isMenuOpen && (
        <div className="w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <NotebookPen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Kết nối NotebookLM nhanh</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center justify-between transition-colors"
            >
              <span>Mở NotebookLM của bạn</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenInAppNotebook();
              }}
              className="w-full px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold flex items-center justify-between transition-colors"
            >
              <span>Mở Kho Drive &amp; Gemini Notebook</span>
              <Cloud className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSaveUrl} className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Liên kết NotebookLM mặc định
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                required
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="https://notebook.google.com/notebook/..."
                className="flex-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-semibold shrink-0 flex items-center gap-1"
              >
                {savedFlag ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{savedFlag ? 'Đã lưu' : 'Lưu'}</span>
              </button>
            </div>
          </form>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
              ID nút: #nlm-bubble-btn
            </span>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Đã chép mã' : 'Sao chép mã nhúng'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bubble Button (#nlm-bubble-btn) */}
      <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white p-1.5 rounded-2xl shadow-xl border border-slate-700/80">
        <a
          id="nlm-bubble-btn"
          href={activeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Mở NotebookLM của tôi"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm"
        >
          <NotebookPen className="w-4 h-4" />
          <span>NotebookLM</span>
          <ExternalLink className="w-3 h-3 opacity-85" />
        </a>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Tùy chỉnh liên kết NotebookLM"
          title="Tùy chỉnh liên kết NotebookLM & Kho Drive"
          className="p-2 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
