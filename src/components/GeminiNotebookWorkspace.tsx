import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Trash2,
  Plus,
  Download,
  CheckCircle2,
  Cloud,
  CloudUpload,
  RefreshCw,
  Send,
  MessageSquare,
  CheckSquare,
  Square,
  AlertTriangle,
  LogOut,
  Upload,
  X,
  FilePlus2,
  NotebookPen,
  Eye,
  Maximize2,
  FileText,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  StudySummary,
  ConceptNote,
  StudyMaterial,
  UserPreferences,
} from '../types';
import {
  loadSummaries,
  loadConcepts,
  loadMaterials,
  saveMaterials,
  logActivity,
} from '../data/storage';
import {
  exportSummaryToMarkdown,
  exportConceptToMarkdown,
  exportContentAsFile,
} from '../utils/exporter';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getDriveAccessToken,
  getCurrentDriveUser,
  ensureNotebookFolder,
  listNotebookFiles,
  createDriveNotebookDoc,
  updateDriveNotebookDoc,
  deleteDriveNotebookFile,
  readDriveNotebookFileContent,
  DriveNotebookFile,
  DriveFolderInfo,
} from '../utils/googleDrive';

interface GeminiNotebookWorkspaceProps {
  preferences: UserPreferences;
  compact?: boolean;
  externalSearchQuery?: string;
  externalSubject?: string;
  onMaterialsCountChange?: (count: number) => void;
  onExpandFullScreen?: () => void;
  onNotify?: (msg: string) => void;
}

export const GeminiNotebookWorkspace: React.FC<GeminiNotebookWorkspaceProps> = ({
  preferences,
  compact = false,
  externalSearchQuery,
  externalSubject,
  onMaterialsCountChange,
  onExpandFullScreen,
  onNotify,
}) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [summaries, setSummaries] = useState<StudySummary[]>([]);
  const [concepts, setConcepts] = useState<ConceptNote[]>([]);

  // Local search & filter (used in compact/drawer mode or when external filters aren't passed)
  const [localSearch, setLocalSearch] = useState('');
  const [localSubject, setLocalSubject] = useState('all');

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : localSearch;
  const activeSubject = externalSubject !== undefined ? externalSubject : localSubject;

  // Google Drive states
  const [driveUser, setDriveUser] = useState<FirebaseUser | null>(() => getCurrentDriveUser());
  const [driveToken, setDriveToken] = useState<string | null>(() => getDriveAccessToken());
  const [driveFolder, setDriveFolder] = useState<DriveFolderInfo | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveNotebookFile[]>([]);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [readingDriveFileId, setReadingDriveFileId] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Confirmation modal for Drive mutations/deletions
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    items: string[];
    confirmLabel: string;
    variant: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // New source material modal
  const [newMaterialModal, setNewMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matSubject, setMatSubject] = useState(
    preferences.currentSubjects[0] || 'Nội khoa Tim mạch'
  );
  const [matType, setMatType] = useState<StudyMaterial['materialType']>('lecture_note');
  const [matContent, setMatContent] = useState('');
  const [matSyncDrive, setMatSyncDrive] = useState(true);
  const [isReadingMatFile, setIsReadingMatFile] = useState(false);

  // In-app preview modal (for both local sources and Google Drive files)
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    kind: string;
    subject: string;
    content: string;
    driveFile?: DriveNotebookFile;
  } | null>(null);

  // Gemini Notebook Q&A states
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notebookQuestion, setNotebookQuestion] = useState('');
  const [notebookMessages, setNotebookMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      text: string;
      citations?: { sourceIndex?: number; sourceTitle: string; page?: number | null; excerpt: string }[];
      keyInsights?: string[];
      suggestedQuestions?: string[];
      fallbackMessage?: string;
    }>
  >([]);
  const [isQueryingNotebook, setIsQueryingNotebook] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 3500);
    }
  };

  useEffect(() => {
    const loadedMats = loadMaterials();
    const loadedSums = loadSummaries();
    const loadedCons = loadConcepts();
    setMaterials(loadedMats);
    setSummaries(loadedSums);
    setConcepts(loadedCons);
    onMaterialsCountChange?.(loadedMats.length);

    setSelectedSourceIds([
      ...loadedMats.slice(0, 3).map((m) => `mat:${m.id}`),
      ...loadedSums.slice(0, 2).map((s) => `sum:${s.id}`),
    ]);
  }, []);

  const refreshDriveRepository = async (tokenOverride?: string) => {
    const token = tokenOverride || driveToken || getDriveAccessToken();
    if (!token) return;
    setIsSyncingDrive(true);
    setDriveError(null);
    try {
      const folder = await ensureNotebookFolder(token);
      setDriveFolder(folder);
      const files = await listNotebookFiles(token, folder.id);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Không thể tải danh sách tệp từ Google Drive.');
      if (String(err.message).includes('hết hạn')) {
        setDriveToken(null);
      }
    } finally {
      setIsSyncingDrive(false);
    }
  };

  useEffect(() => {
    const existingToken = getDriveAccessToken();
    const existingUser = getCurrentDriveUser();
    if (existingToken && existingUser) {
      setDriveUser(existingUser);
      setDriveToken(existingToken);
      refreshDriveRepository(existingToken);
    }

    const unsubscribe = initDriveAuth(
      async (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
        await refreshDriveRepository(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
        setDriveFolder(null);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateMaterialsState = (updated: StudyMaterial[]) => {
    setMaterials(updated);
    saveMaterials(updated);
    onMaterialsCountChange?.(updated.length);
  };

  const notebookSources = useMemo(() => {
    const matSources = materials.map((m) => ({
      uid: `mat:${m.id}`,
      rawId: m.id,
      kind: 'Tài liệu nguồn' as const,
      title: m.title,
      subject: m.subject,
      content: m.content,
      createdAt: m.createdAt,
    }));
    const sumSources = summaries.map((s) => ({
      uid: `sum:${s.id}`,
      rawId: s.id,
      kind: 'Tóm tắt' as const,
      title: s.title,
      subject: s.subject,
      content: exportSummaryToMarkdown(s),
      createdAt: s.createdAt,
    }));
    const conSources = concepts.map((c) => ({
      uid: `con:${c.id}`,
      rawId: c.id,
      kind: 'Khái niệm' as const,
      title: c.topic,
      subject: c.subject,
      content: exportConceptToMarkdown(c),
      createdAt: c.createdAt,
    }));
    return [...matSources, ...sumSources, ...conSources];
  }, [materials, summaries, concepts]);

  const filteredNotebookSources = useMemo(() => {
    return notebookSources.filter((src) => {
      if (activeSubject !== 'all' && src.subject !== activeSubject) return false;
      if (
        activeSearch &&
        !src.title.toLowerCase().includes(activeSearch.toLowerCase()) &&
        !src.content.toLowerCase().includes(activeSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [notebookSources, activeSubject, activeSearch]);

  const allFilteredSourcesSelected =
    filteredNotebookSources.length > 0 &&
    filteredNotebookSources.every((src) => selectedSourceIds.includes(src.uid));

  const handleToggleSelectAllSources = () => {
    const filteredIds = filteredNotebookSources.map((s) => s.uid);
    if (allFilteredSourcesSelected) {
      setSelectedSourceIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedSourceIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleConnectGoogleDrive = async () => {
    setIsConnectingDrive(true);
    setDriveError(null);
    try {
      const { user, accessToken } = await signInWithGoogleDrive();
      setDriveUser(user);
      setDriveToken(accessToken);
      await refreshDriveRepository(accessToken);
      notify('Đã kết nối Google Drive trực tiếp trong Kho Notebook!');
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Đăng nhập Google Drive thất bại.');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    await signOutGoogleDrive();
    setDriveUser(null);
    setDriveToken(null);
    setDriveFolder(null);
    setDriveFiles([]);
    notify('Đã ngắt kết nối Google Drive.');
  };

  const syncSingleDocToDrive = async (doc: {
    studymateId: string;
    studymateType: string;
    title: string;
    subject: string;
    content: string;
  }) => {
    const token = driveToken || getDriveAccessToken();
    if (!token) {
      notify('Vui lòng đăng nhập Google Drive ở khung Kho lưu trữ phía trên.');
      return;
    }

    const folder = driveFolder || (await ensureNotebookFolder(token));
    setDriveFolder(folder);

    const existing = driveFiles.find(
      (f) => f.appProperties?.studymateId === doc.studymateId || f.name === doc.title
    );

    if (existing) {
      setConfirmModal({
        title: 'Cập nhật tài liệu trên Google Drive?',
        description: `Tệp "${existing.name}" đã có trong thư mục "${folder.name}". Xác nhận ghi đè nội dung mới nhất lên tệp Google Docs này?`,
        items: [existing.name],
        confirmLabel: 'Xác nhận cập nhật',
        variant: 'warning',
        onConfirm: async () => {
          setIsSyncingDrive(true);
          try {
            await updateDriveNotebookDoc(token, existing.id, {
              title: doc.title,
              content: doc.content,
              appProperties: {
                studymateId: doc.studymateId,
                studymateType: doc.studymateType,
                subject: doc.subject,
              },
            });
            await refreshDriveRepository(token);
            notify(`Đã cập nhật "${doc.title}" trên Google Drive!`);
          } finally {
            setIsSyncingDrive(false);
          }
        },
      });
      return;
    }

    setIsSyncingDrive(true);
    try {
      await createDriveNotebookDoc(token, folder.id, {
        title: doc.title,
        content: doc.content,
        appProperties: {
          studymateId: doc.studymateId,
          studymateType: doc.studymateType,
          subject: doc.subject,
        },
      });
      await refreshDriveRepository(token);
      notify(`Đã lưu "${doc.title}" vào Google Drive!`);
    } catch (err: any) {
      setDriveError(err.message || 'Không thể lưu tài liệu lên Google Drive.');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleSyncAllToDrive = async () => {
    const token = driveToken || getDriveAccessToken();
    if (!token) return;
    setIsSyncingDrive(true);
    setDriveError(null);
    try {
      const folder = driveFolder || (await ensureNotebookFolder(token));
      setDriveFolder(folder);
      const currentFiles = await listNotebookFiles(token, folder.id);

      const allDocs = [
        ...materials.map((m) => ({
          studymateId: `mat:${m.id}`,
          studymateType: 'material',
          title: m.title,
          subject: m.subject,
          content: `# ${m.title}\nMôn học: ${m.subject}\n\n${m.content}`,
        })),
        ...summaries.map((s) => ({
          studymateId: `sum:${s.id}`,
          studymateType: 'summary',
          title: s.title,
          subject: s.subject,
          content: exportSummaryToMarkdown(s),
        })),
        ...concepts.map((c) => ({
          studymateId: `con:${c.id}`,
          studymateType: 'concept',
          title: c.topic,
          subject: c.subject,
          content: exportConceptToMarkdown(c),
        })),
      ];

      const toCreate = allDocs.filter(
        (d) => !currentFiles.some((f) => f.appProperties?.studymateId === d.studymateId)
      );
      const toUpdate = allDocs.filter((d) =>
        currentFiles.some((f) => f.appProperties?.studymateId === d.studymateId)
      );

      for (const doc of toCreate) {
        await createDriveNotebookDoc(token, folder.id, {
          title: doc.title,
          content: doc.content,
          appProperties: {
            studymateId: doc.studymateId,
            studymateType: doc.studymateType,
            subject: doc.subject,
          },
        });
      }

      if (toUpdate.length > 0) {
        setIsSyncingDrive(false);
        setConfirmModal({
          title: `Cập nhật ${toUpdate.length} tài liệu đã tồn tại trên Google Drive?`,
          description:
            toCreate.length > 0
              ? `Đã tạo mới ${toCreate.length} tệp. Còn ${toUpdate.length} tệp đã tồn tại trong "${folder.name}" — xác nhận ghi đè phiên bản mới nhất:`
              : `Có ${toUpdate.length} tài liệu đã tồn tại trong "${folder.name}". Xác nhận cập nhật nội dung mới nhất lên Google Drive:`,
          items: toUpdate.map((d) => d.title),
          confirmLabel: `Cập nhật ${toUpdate.length} tệp`,
          variant: 'warning',
          onConfirm: async () => {
            setIsSyncingDrive(true);
            try {
              for (const doc of toUpdate) {
                const match = currentFiles.find(
                  (f) => f.appProperties?.studymateId === doc.studymateId
                );
                if (match) {
                  await updateDriveNotebookDoc(token, match.id, {
                    title: doc.title,
                    content: doc.content,
                    appProperties: {
                      studymateId: doc.studymateId,
                      studymateType: doc.studymateType,
                      subject: doc.subject,
                    },
                  });
                }
              }
              await refreshDriveRepository(token);
              notify(`Đã đồng bộ xong ${allDocs.length} tài liệu lên Google Drive!`);
            } finally {
              setIsSyncingDrive(false);
            }
          },
        });
        return;
      }

      await refreshDriveRepository(token);
      notify(
        toCreate.length > 0
          ? `Đã đồng bộ ${toCreate.length} tài liệu mới lên Google Drive!`
          : 'Tất cả tài liệu đã được đồng bộ trước đó.'
      );
    } catch (err: any) {
      setDriveError(err.message || 'Đồng bộ Google Drive gặp sự cố.');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleOpenDriveFileInApp = async (file: DriveNotebookFile) => {
    const token = driveToken || getDriveAccessToken();
    if (!token) return;
    setReadingDriveFileId(file.id);
    setDriveError(null);
    try {
      const content = await readDriveNotebookFileContent(token, file);
      setPreviewDoc({
        title: file.name,
        kind: 'Tệp Google Drive',
        subject: file.appProperties?.subject || preferences.currentSubjects[0] || 'Chung',
        content: content.trim() || '(Tệp trống)',
        driveFile: file,
      });
    } catch (err: any) {
      setDriveError(err.message || `Không thể đọc nội dung "${file.name}".`);
    } finally {
      setReadingDriveFileId(null);
    }
  };

  const handleImportDriveFile = async (file: DriveNotebookFile, preloadedContent?: string) => {
    const token = driveToken || getDriveAccessToken();
    if (!token) return;
    setIsSyncingDrive(true);
    setDriveError(null);
    try {
      const content =
        preloadedContent !== undefined
          ? preloadedContent
          : await readDriveNotebookFileContent(token, file);
      const newMat: StudyMaterial = {
        id: `mat-drive-${Date.now()}`,
        title: file.name,
        subject: file.appProperties?.subject || preferences.currentSubjects[0] || 'Chung',
        content: content.trim() || '(Tệp trống)',
        materialType: 'lecture_note',
        tags: ['Google Drive', 'Notebook'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [newMat, ...materials];
      updateMaterialsState(updated);
      setSelectedSourceIds((prev) => [`mat:${newMat.id}`, ...prev]);
      notify(`Đã nạp "${file.name}" từ Google Drive vào nguồn Gemini Notebook!`);
    } catch (err: any) {
      setDriveError(err.message || 'Không thể đọc nội dung tệp từ Google Drive.');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleRequestDeleteDriveFile = (file: DriveNotebookFile) => {
    const token = driveToken || getDriveAccessToken();
    if (!token) return;
    setConfirmModal({
      title: 'Xóa tệp khỏi Google Drive?',
      description: `Bạn có chắc chắn muốn xóa vĩnh viễn tệp "${file.name}" khỏi thư mục "${driveFolder?.name || 'StudyMate AI - Gemini Notebook'}" trên Google Drive?`,
      items: [file.name],
      confirmLabel: 'Xóa vĩnh viễn',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncingDrive(true);
        try {
          await deleteDriveNotebookFile(token, file.id);
          await refreshDriveRepository(token);
          notify(`Đã xóa "${file.name}" khỏi Google Drive.`);
        } finally {
          setIsSyncingDrive(false);
        }
      },
    });
  };

  const handleUploadMaterialFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!matTitle.trim()) setMatTitle(cleanName);

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMatContent(String(ev.target?.result || ''));
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }

    if (lower.endsWith('.docx') || lower.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = String(ev.target?.result || '');
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setIsReadingMatFile(true);
        try {
          const res = await fetch('/api/documents/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: lower.endsWith('.pdf') ? 'application/pdf' : undefined,
              data: base64,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setMatContent(data.text || '');
          notify(`Đã trích xuất nội dung từ "${file.name}"!`);
        } catch (err: any) {
          notify(err.message || `Không thể trích xuất tệp ${file.name}`);
        } finally {
          setIsReadingMatFile(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      notify('Vui lòng chọn tệp định dạng .txt, .md, .json, .docx hoặc .pdf.');
    }
  };

  const handleSaveNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim() || !matContent.trim()) return;

    const newMat: StudyMaterial = {
      id: `mat-${Date.now()}`,
      title: matTitle.trim(),
      subject: matSubject,
      content: matContent.trim(),
      materialType: matType,
      tags: ['Notebook', matSubject],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newMat, ...materials];
    updateMaterialsState(updated);
    setSelectedSourceIds((prev) => [`mat:${newMat.id}`, ...prev]);
    setNewMaterialModal(false);
    setMatTitle('');
    setMatContent('');

    if (driveToken && matSyncDrive) {
      await syncSingleDocToDrive({
        studymateId: `mat:${newMat.id}`,
        studymateType: 'material',
        title: newMat.title,
        subject: newMat.subject,
        content: `# ${newMat.title}\nMôn học: ${newMat.subject}\n\n${newMat.content}`,
      });
    } else {
      notify('Đã thêm tài liệu vào Kho Gemini Notebook!');
    }
  };

  const handleDeleteMaterial = (id: string) => {
    const updated = materials.filter((m) => m.id !== id);
    updateMaterialsState(updated);
    setSelectedSourceIds((prev) => prev.filter((sid) => sid !== `mat:${id}`));
    notify('Đã xóa tài liệu khỏi kho.');
  };

  const toggleSourceSelection = (uid: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleExportNotebookBundle = () => {
    const activeSources = notebookSources.filter((s) => selectedSourceIds.includes(s.uid));
    if (activeSources.length === 0) {
      notify('Hãy chọn ít nhất 1 nguồn để xuất gói tài liệu Markdown.');
      return;
    }
    const dateSlug = new Date().toISOString().split('T')[0];
    const bundleContent = [
      `# StudyMate AI — Gói Nguồn Gemini Notebook (${dateSlug})`,
      `Tổng số nguồn: ${activeSources.length}`,
      '',
      ...activeSources.map(
        (src, idx) =>
          `---\n\n## [Nguồn ${idx + 1}] ${src.title}\n*Phân loại: ${src.kind} · Môn học: ${src.subject}*\n\n${src.content}\n`
      ),
    ].join('\n');

    exportContentAsFile(`StudyMate-Notebook-Sources-${dateSlug}.md`, bundleContent, 'text/markdown');
    notify(`Đã xuất gói ${activeSources.length} nguồn (.md)!`);
  };

  const handleAskGeminiNotebook = async (
    customQuestion?: string,
    mode: 'qa' | 'study_guide' | 'compare' | 'briefing' = 'qa'
  ) => {
    const q = (customQuestion ?? notebookQuestion).trim();
    if (!q) return;

    const activeSources = notebookSources.filter((s) => selectedSourceIds.includes(s.uid));
    if (activeSources.length === 0) {
      notify('Hãy chọn ít nhất 1 tài liệu nguồn ở danh sách bên cạnh.');
      return;
    }

    if (!customQuestion) setNotebookQuestion('');
    setNotebookMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsQueryingNotebook(true);

    try {
      const res = await fetch('/api/gemini/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          mode,
          sources: activeSources.map((s) => ({
            id: s.uid,
            title: s.title,
            subject: s.subject,
            content: s.content,
          })),
          history: notebookMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể hỏi Gemini Notebook.');

      setNotebookMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || '',
          citations: data.citations || [],
          keyInsights: data.keyInsights || [],
          suggestedQuestions: data.suggestedQuestions || [],
          fallbackMessage: data._fallback ? (data._fallbackMessage || 'Nội dung dự phòng - cần kiểm chứng.') : undefined,
        },
      ]);
    } catch (err: any) {
      setNotebookMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err.message || 'Có lỗi xảy ra khi truy vấn Gemini Notebook.' },
      ]);
    } finally {
      setIsQueryingNotebook(false);
    }
  };

  const handleSaveNotebookNote = async (text: string, syncToDrive = false) => {
    const newMat: StudyMaterial = {
      id: `mat-note-${Date.now()}`,
      title: `Ghi chú Gemini Notebook (${new Date().toLocaleDateString('vi-VN')})`,
      subject: preferences.currentSubjects[0] || 'Tổng hợp',
      content: text,
      materialType: 'lecture_note',
      tags: ['Gemini Notebook', 'Tổng hợp'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newMat, ...materials];
    updateMaterialsState(updated);
    setSelectedSourceIds((prev) => [`mat:${newMat.id}`, ...prev]);
    logActivity('summary', newMat.title, newMat.subject, 'Lưu từ Gemini Notebook', newMat.id);

    if (syncToDrive && driveToken) {
      await syncSingleDocToDrive({
        studymateId: `mat:${newMat.id}`,
        studymateType: 'material',
        title: newMat.title,
        subject: newMat.subject,
        content: `# ${newMat.title}\nMôn học: ${newMat.subject}\n\n${newMat.content}`,
      });
    } else {
      notify('Đã lưu ghi chú từ Gemini Notebook vào Kho tài liệu!');
    }
  };

  return (
    <div className="space-y-5">
      {localToast && (
        <div className="fixed top-5 right-5 z-[60] bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{localToast}</span>
        </div>
      )}

      {/* Embedded Google Drive Repository Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
              <Cloud className="w-4 h-4" />
              <span>Kho lưu trữ Google Drive · Nhúng trực tiếp</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Thư mục &ldquo;{driveFolder?.name || 'StudyMate AI - Gemini Notebook'}&rdquo;
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Quản lý, đọc nội dung trực tiếp, đồng bộ hai chiều và phân tích cùng Gemini Notebook ngay trong ứng dụng mà không cần chuyển trang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onExpandFullScreen && (
              <button
                type="button"
                onClick={onExpandFullScreen}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Mở toàn màn hình</span>
              </button>
            )}

            {driveToken ? (
              <>
                <button
                  type="button"
                  onClick={() => refreshDriveRepository()}
                  disabled={isSyncingDrive}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllToDrive}
                  disabled={isSyncingDrive}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Đồng bộ tất cả lên Drive</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogleDrive}
                  className="px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={isConnectingDrive}
                className="gsi-material-button"
              >
                <div className="gsi-material-button-state" />
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isConnectingDrive ? 'Đang kết nối...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {driveError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{driveError}</span>
          </div>
        )}

        {/* List of files inside Google Drive repository — opened directly in-app */}
        {driveToken && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Tệp trong Kho Drive ({driveFiles.length}) — Nhấn vào tệp để xem trực tiếp
              </span>
              <span className="text-[11px] text-slate-400">
                {driveUser?.displayName || driveUser?.email}
              </span>
            </div>

            {driveFiles.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Thư mục Drive đang trống. Hãy nhấn &quot;Đồng bộ tất cả lên Drive&quot; để đẩy kho tài liệu lên Google Drive.
              </p>
            ) : (
              <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-2 max-h-52 overflow-y-auto pr-1`}>
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 text-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenDriveFileInApp(file)}
                      className="min-w-0 flex-1 text-left flex items-center gap-2"
                      title="Đọc nội dung tệp trực tiếp trong ứng dụng"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {readingDriveFileId === file.id
                            ? 'Đang mở nội dung...'
                            : file.modifiedTime
                              ? `Cập nhật: ${new Date(file.modifiedTime).toLocaleString('vi-VN')}`
                              : 'Google Docs'}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenDriveFileInApp(file)}
                        disabled={readingDriveFileId === file.id}
                        className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        title="Xem trực tiếp trong app"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImportDriveFile(file)}
                        disabled={isSyncingDrive}
                        className="px-2 py-1 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-[11px] font-medium"
                        title="Nạp làm nguồn cho Gemini Notebook"
                      >
                        Nạp vào Notebook
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteDriveFile(file)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                        title="Xóa khỏi Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Standalone search bar when embedded inside drawer/compact mode */}
      {externalSearchQuery === undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Tìm nguồn tài liệu trong Notebook..."
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={localSubject}
            onChange={(e) => setLocalSubject(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Tất cả môn học</option>
            {preferences.currentSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* 2-Column Gemini Notebook Workspace */}
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-12 gap-4' : 'lg:grid-cols-12 gap-6'}`}>
        {/* Left Column: Sources Repository */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Nguồn tài liệu ({selectedSourceIds.length}/{notebookSources.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Chọn các nguồn để Gemini Notebook phân tích &amp; trích dẫn
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportNotebookBundle}
                disabled={selectedSourceIds.length === 0}
                title="Xuất các nguồn đang chọn thành 1 tệp Markdown"
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Gói .MD</span>
              </button>
              <button
                type="button"
                onClick={() => setNewMaterialModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Thêm nguồn</span>
              </button>
            </div>
          </div>

          {filteredNotebookSources.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>Hiển thị {filteredNotebookSources.length} nguồn phù hợp</span>
              <button
                type="button"
                onClick={handleToggleSelectAllSources}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {allFilteredSourcesSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
          )}

          <div className={`space-y-2 ${compact ? 'max-h-[340px]' : 'max-h-[430px]'} overflow-y-auto pr-1`}>
            {filteredNotebookSources.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Không có tài liệu nào khớp bộ lọc. Nhấn &quot;Thêm nguồn&quot; hoặc nạp từ Google Drive ở trên.
              </p>
            ) : (
              filteredNotebookSources.map((src) => {
                const checked = selectedSourceIds.includes(src.uid);
                return (
                  <div
                    key={src.uid}
                    className={`p-3 rounded-xl border transition-colors text-xs space-y-1.5 ${
                      checked
                        ? 'border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSourceSelection(src.uid)}
                        className="flex items-start gap-2 text-left flex-1 min-w-0"
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                            {src.kind} · {src.subject}
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                            {src.title}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              title: src.title,
                              kind: src.kind,
                              subject: src.subject,
                              content: src.content,
                            })
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Xem nội dung nguồn"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {driveToken && (
                          <button
                            type="button"
                            onClick={() =>
                              syncSingleDocToDrive({
                                studymateId: src.uid,
                                studymateType: src.kind,
                                title: src.title,
                                subject: src.subject,
                                content: src.content,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="Lưu lên Google Drive"
                          >
                            <CloudUpload className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {src.uid.startsWith('mat:') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(src.rawId)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Xóa tài liệu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Gemini Notebook Multi-source Assistant */}
        <div
          className={`lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 ${
            compact ? 'min-h-[440px]' : 'min-h-[540px]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <NotebookPen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Trợ lý Gemini Notebook (Đa nguồn)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={isQueryingNotebook}
                  onClick={() =>
                    handleAskGeminiNotebook(
                      'Hãy tạo tài liệu Study Guide hệ thống hóa toàn bộ kiến thức từ các nguồn đã chọn.',
                      'study_guide'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-[11px] font-semibold"
                >
                  Study Guide
                </button>
                <button
                  type="button"
                  disabled={isQueryingNotebook}
                  onClick={() =>
                    handleAskGeminiNotebook(
                      'Hãy lập bản tổng hợp Briefing nêu bật điểm cốt lõi và mối liên hệ giữa các nguồn.',
                      'briefing'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-semibold"
                >
                  Briefing Doc
                </button>
                <button
                  type="button"
                  disabled={isQueryingNotebook}
                  onClick={() =>
                    handleAskGeminiNotebook(
                      'So sánh đối chiếu các khái niệm, cơ chế và chỉ định lâm sàng giữa các tài liệu đã chọn.',
                      'compare'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-[11px] font-semibold"
                >
                  So sánh nguồn
                </button>
              </div>
            </div>

            {/* Chat / Output Feed */}
            <div className={`space-y-3 ${compact ? 'max-h-[300px]' : 'max-h-[380px]'} overflow-y-auto pr-1`}>
              {notebookMessages.length === 0 ? (
                <div className="p-6 text-center space-y-2 text-xs text-slate-500">
                  <MessageSquare className="w-8 h-8 text-purple-400 mx-auto opacity-75" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Sẵn sàng phân tích trên {selectedSourceIds.length} tài liệu nguồn đã chọn
                  </p>
                  <p className="max-w-md mx-auto">
                    Đặt câu hỏi bất kỳ hoặc nhấn nút Study Guide / Briefing Doc / So sánh nguồn để Gemini tổng hợp kèm trích dẫn trực tiếp từ kho của bạn.
                  </p>
                </div>
              ) : (
                notebookMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl text-xs space-y-2.5 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white ml-8'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-2'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    {msg.fallbackMessage && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                        ⚠️ {msg.fallbackMessage}
                      </div>
                    )}

                    {msg.keyInsights && msg.keyInsights.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                          Điểm rút ra cốt lõi:
                        </span>
                        {msg.keyInsights.map((ins, iIdx) => (
                          <div
                            key={iIdx}
                            className="text-[11px] text-purple-950 dark:text-purple-100 flex items-start gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                            <span>{ins}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Trích dẫn từ kho lưu trữ:
                        </span>
                        {msg.citations.map((cit, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-[11px]"
                          >
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              [{cit.sourceIndex || cIdx + 1}] {cit.sourceTitle}
                              {cit.page ? `, Trang ${cit.page}` : ''}:
                            </span>{' '}
                            <span className="text-slate-600 dark:text-slate-300">{cit.excerpt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.role === 'assistant' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions?.map((sq, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleAskGeminiNotebook(sq, 'qa')}
                              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-[11px] text-slate-700 dark:text-slate-300 text-left"
                            >
                              {sq}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSaveNotebookNote(msg.text, false)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                          >
                            Lưu vào Kho
                          </button>
                          {driveToken && (
                            <button
                              type="button"
                              onClick={() => handleSaveNotebookNote(msg.text, true)}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1"
                            >
                              <CloudUpload className="w-3 h-3" />
                              <span>Lưu &amp; Drive</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isQueryingNotebook && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  <span>Gemini Notebook đang đối chiếu các nguồn tài liệu...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskGeminiNotebook();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800"
          >
            <input
              type="text"
              value={notebookQuestion}
              onChange={(e) => setNotebookQuestion(e.target.value)}
              placeholder="Hỏi Gemini Notebook dựa trên các tài liệu đã chọn..."
              disabled={isQueryingNotebook}
              className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isQueryingNotebook || !notebookQuestion.trim()}
              className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Hỏi</span>
            </button>
          </form>
        </div>
      </div>

      {/* New Source Material Modal */}
      {newMaterialModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thêm tài liệu vào Kho Gemini Notebook
              </h3>
              <button
                type="button"
                onClick={() => setNewMaterialModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMaterial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề tài liệu
                </label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Ví dụ: Phác đồ điều trị Tăng huyết áp ESC 2024"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Môn học
                  </label>
                  <select
                    value={matSubject}
                    onChange={(e) => setMatSubject(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    {preferences.currentSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Loại tài liệu
                  </label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    <option value="lecture_note">Ghi chú bài giảng</option>
                    <option value="textbook_chapter">Chương giáo trình</option>
                    <option value="clinical_guideline">Hướng dẫn lâm sàng</option>
                    <option value="research_paper">Bài báo nghiên cứu</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nội dung tài liệu
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    <Upload className="w-3 h-3" />
                    <span>{isReadingMatFile ? 'Đang trích xuất...' : 'Tải từ .txt/.md/.docx/.pdf'}</span>
                    <input
                      type="file"
                      accept=".txt,.md,.json,.docx,.pdf"
                      onChange={handleUploadMaterialFile}
                      disabled={isReadingMatFile}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={6}
                  required
                  value={matContent}
                  onChange={(e) => setMatContent(e.target.value)}
                  placeholder="Dán nội dung tài liệu học tập hoặc tải lên từ tệp (.txt, .md, .docx, .pdf)..."
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              {driveToken && (
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matSyncDrive}
                    onChange={(e) => setMatSyncDrive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Đồng bộ ngay lên thư mục Google Drive (Google Docs)</span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewMaterialModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isReadingMatFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                >
                  Lưu vào Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Document & Drive File Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  {previewDoc.kind} · {previewDoc.subject}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {previewDoc.content}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {previewDoc.driveFile && (
                <button
                  type="button"
                  onClick={async () => {
                    const f = previewDoc.driveFile!;
                    const txt = previewDoc.content;
                    setPreviewDoc(null);
                    await handleImportDriveFile(f, txt);
                  }}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nạp vào nguồn Gemini Notebook</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Google Drive Mutations/Deletions */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            {confirmModal.items.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2.5 space-y-1 text-xs">
                {confirmModal.items.map((item, i) => (
                  <div key={i} className="text-slate-700 dark:text-slate-200 truncate">
                    • {item}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
