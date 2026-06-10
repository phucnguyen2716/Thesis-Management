import React, { useCallback, useEffect, useState } from 'react';
import {
  PROFILE_PORTALS,
  deleteProfileFile,
  formatFileSize,
  getProfileFileBlob,
  listProfileFiles,
  saveProfileFile,
} from '../../utils/profileFileStorage';
import { logStudentActivity } from '../../utils/studentActivityStats';

const ProfileFileVault = ({ portal = PROFILE_PORTALS.student, theme = 'student' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isLecturer = theme === 'lecturer';
  const accentBtn = isLecturer
    ? 'bg-teal-900 hover:bg-teal-950'
    : 'bg-primary hover:opacity-90';
  const accentText = isLecturer ? 'text-teal-800' : 'text-primary';
  const borderCls = isLecturer ? 'border-teal-100' : 'border-outline-variant';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listProfileFiles(portal);
      setFiles(list);
    } catch {
      setError('Không đọc được kho file trên trình duyệt.');
    } finally {
      setLoading(false);
    }
  }, [portal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onUpload = async e => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setBusy(true);
    setError('');
    try {
      for (const file of picked) {
        if (file.size > 15 * 1024 * 1024) {
          setError(`"${file.name}" vượt 15MB — bỏ qua.`);
          continue;
        }
        await saveProfileFile(portal, file);
        if (portal === PROFILE_PORTALS.student) {
          logStudentActivity('file_upload', { name: file.name });
        }
      }
      await refresh();
      if (portal === PROFILE_PORTALS.student) {
        window.dispatchEvent(new Event('profile-files-updated'));
      }
    } catch {
      setError('Lưu file thất bại.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const onDownload = async id => {
    try {
      const blob = await getProfileFileBlob(id);
      if (!blob) return;
      const meta = files.find(f => f.id === id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = meta?.name || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Tải file thất bại.');
    }
  };

  const onRemove = async id => {
    if (!window.confirm('Xóa file này khỏi kho lưu trữ?')) return;
    setBusy(true);
    try {
      await deleteProfileFile(id);
      await refresh();
      if (portal === PROFILE_PORTALS.student) {
        window.dispatchEvent(new Event('profile-files-updated'));
      }
    } catch {
      setError('Xóa file thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`bg-white rounded-2xl border ${borderCls} shadow-sm overflow-hidden w-full min-w-0`}>
      <div
        className={`p-4 sm:p-5 border-b ${borderCls} ${
          isLecturer ? 'bg-gradient-to-r from-teal-50 to-white' : 'bg-surface-container-low/50'
        }`}
      >
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined">folder_open</span>
          Kho tài liệu cá nhân
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Lưu trên trình duyệt (IndexedDB) — PDF, Word, ảnh… tối đa 15MB/file
        </p>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <label
          className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isLecturer
              ? 'border-teal-200 hover:border-teal-400 hover:bg-teal-50/50'
              : 'border-primary/30 hover:border-primary hover:bg-primary/5'
          } ${busy ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <span className={`material-symbols-outlined text-3xl ${accentText}`}>cloud_upload</span>
          <span className="text-sm font-bold text-slate-700">Chọn file để lưu</span>
          <span className="text-[10px] text-slate-400">Nhiều file cùng lúc được hỗ trợ</span>
          <input type="file" multiple className="hidden" onChange={onUpload} disabled={busy} />
        </label>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg font-medium">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Đang tải danh sách…</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Chưa có file nào được lưu.</p>
        ) : (
          <ul className="space-y-2 max-h-[280px] overflow-y-auto">
            {files.map(f => (
              <li
                key={f.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50"
              >
                <span className={`material-symbols-outlined ${accentText} shrink-0`}>
                  {f.mimeType?.includes('pdf')
                    ? 'picture_as_pdf'
                    : f.mimeType?.includes('image')
                      ? 'image'
                      : 'description'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatFileSize(f.size)} · {new Date(f.uploadedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDownload(f.id)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Tải xuống"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    title="Xóa"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-slate-400 text-center">
          {files.length} file · portal {portal}
        </p>
      </div>
    </section>
  );
};

export default ProfileFileVault;
