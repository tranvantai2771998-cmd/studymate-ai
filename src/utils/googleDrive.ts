import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
};

const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const app = getApps().length > 0 ? getApp() : (hasFirebaseConfig ? initializeApp(firebaseConfig) : null);
const auth = app ? getAuth(app) : null;

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const NOTEBOOK_FOLDER_NAME = 'StudyMate AI - Gemini Notebook';

// In-memory only access token cache (never persisted to localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveNotebookFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  appProperties?: Record<string, string>;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    onAuthFailure?.();
    return () => {};
  }
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  if (!auth) {
    throw new Error('Tính năng Google Drive chưa được cấu hình Firebase. Vui lòng liên hệ quản trị viên.');
  }
  isSigningIn = true;
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được quyền truy cập Google Drive từ tài khoản Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogleDrive = async (): Promise<void> => {
  cachedAccessToken = null;
  if (auth) await auth.signOut();
};

export const getDriveAccessToken = (): string | null => cachedAccessToken;
export const getCurrentDriveUser = (): User | null => auth?.currentUser ?? null;

async function driveFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('Phiên kết nối Google Drive đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!res.ok) {
    let errMessage = `Lỗi Google Drive (${res.status})`;
    try {
      const errJson = await res.json();
      errMessage = errJson?.error?.message || errMessage;
    } catch {
      // ignore parse failure
    }
    throw new Error(errMessage);
  }

  if (res.status === 204) return null;
  return res;
}

export async function ensureNotebookFolder(accessToken: string): Promise<DriveFolderInfo> {
  const q = encodeURIComponent(
    `name = '${NOTEBOOK_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&pageSize=5`,
    accessToken
  );
  const data = await res!.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  const createRes = await driveFetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: NOTEBOOK_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Kho lưu trữ tài liệu học tập StudyMate AI đồng bộ với Gemini Notebook / NotebookLM',
      }),
    }
  );
  return createRes!.json();
}

export async function listNotebookFiles(
  accessToken: string,
  folderId: string
): Promise<DriveNotebookFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,appProperties)&pageSize=100`,
    accessToken
  );
  const data = await res!.json();
  return data.files || [];
}

function buildMultipartBody(
  metadata: Record<string, any>,
  content: string,
  contentType = 'text/plain; charset=UTF-8'
) {
  const boundary = `studymate_boundary_${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${contentType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;
  return { boundary, body };
}

export async function createDriveNotebookDoc(
  accessToken: string,
  folderId: string,
  params: {
    title: string;
    content: string;
    appProperties?: Record<string, string>;
  }
): Promise<DriveNotebookFile> {
  const metadata = {
    name: params.title,
    parents: [folderId],
    mimeType: 'application/vnd.google-apps.document',
    appProperties: params.appProperties || {},
  };
  const { boundary, body } = buildMultipartBody(metadata, params.content);

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,appProperties',
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return res!.json();
}

export async function updateDriveNotebookDoc(
  accessToken: string,
  fileId: string,
  params: {
    title: string;
    content: string;
    appProperties?: Record<string, string>;
  }
): Promise<DriveNotebookFile> {
  const metadata = {
    name: params.title,
    appProperties: params.appProperties || {},
  };
  const { boundary, body } = buildMultipartBody(metadata, params.content);

  const res = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,appProperties`,
    accessToken,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return res!.json();
}

export async function deleteDriveNotebookFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, accessToken, {
    method: 'DELETE',
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function readDriveNotebookFileContent(
  accessToken: string,
  file: DriveNotebookFile
): Promise<string> {
  if (file.mimeType === 'application/vnd.google-apps.document') {
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
      accessToken
    );
    return res!.text();
  }

  if (
    file.mimeType === 'application/pdf' ||
    file.mimeType.includes('wordprocessingml') ||
    file.name.toLowerCase().endsWith('.pdf') ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      accessToken
    );
    const buffer = await res!.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const extractRes = await fetch('/api/documents/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.mimeType,
        data: base64,
      }),
    });
    const extracted = await extractRes.json();
    if (!extractRes.ok) {
      throw new Error(extracted.message || `Không thể trích xuất nội dung từ tệp ${file.name}`);
    }
    return extracted.text || '';
  }

  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    accessToken
  );
  return res!.text();
}
