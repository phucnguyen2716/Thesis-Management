/** Lưu file hồ sơ trên IndexedDB — tách theo portal student | lecturer */

const DB_NAME = 'uef_portal_profile_files';
const DB_VERSION = 1;
const STORE = 'files';

export const PROFILE_PORTALS = {
  student: 'student',
  lecturer: 'lecturer',
};

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('portal', 'portal', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txStore(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export async function listProfileFiles(portal) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = txStore(db, 'readonly');
    const index = store.index('portal');
    const req = index.getAll(portal);
    req.onsuccess = () => {
      const items = (req.result || []).sort((a, b) => b.uploadedAt - a.uploadedAt);
      resolve(items.map(({ blob, ...meta }) => meta));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveProfileFile(portal, file) {
  const db = await openDb();
  const id = `${portal}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const record = {
    id,
    portal,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    uploadedAt: Date.now(),
    blob: file,
  };
  return new Promise((resolve, reject) => {
    const store = txStore(db, 'readwrite');
    const req = store.put(record);
    req.onsuccess = () =>
      resolve({
        id: record.id,
        portal: record.portal,
        name: record.name,
        mimeType: record.mimeType,
        size: record.size,
        uploadedAt: record.uploadedAt,
      });
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProfileFile(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getProfileFileBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = txStore(db, 'readonly').get(id);
    req.onsuccess = () => {
      const rec = req.result;
      if (!rec?.blob) {
        resolve(null);
        return;
      }
      resolve(rec.blob);
    };
    req.onerror = () => reject(req.error);
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
