import React, { useRef, useState } from 'react';
import { readAvatarFromFile, AVATAR_ACCEPT } from '../../utils/avatarImage';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';

const themes = {
  student: {
    ring: 'border-primary/30',
    btn: 'bg-primary text-on-primary hover:opacity-90',
    hint: 'text-on-surface-variant',
    err: 'text-red-600',
  },
  lecturer: {
    ring: 'border-teal-200',
    btn: 'bg-teal-900 text-white hover:bg-teal-950',
    hint: 'text-slate-500',
    err: 'text-red-600',
  },
};

const AvatarUpload = ({ value, onChange, theme = 'student', size = 'lg' }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const t = themes[theme] || themes.student;
  const src = value?.trim() || DEFAULT_AVATAR;
  const dim = size === 'lg' ? 'w-28 h-28' : size === 'md' ? 'w-20 h-20' : 'w-24 h-24';

  const onPick = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await readAvatarFromFile(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err.message || 'Upload thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const clearAvatar = () => {
    onChange('');
    setError('');
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${dim} rounded-2xl overflow-hidden border-4 ${t.ring} shadow-lg group`}>
        <img src={src} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${t.btn} disabled:opacity-60`}
      >
        {busy ? 'Đang xử lý...' : 'Chọn ảnh từ máy'}
      </button>
      {value && (
        <button
          type="button"
          onClick={clearAvatar}
          className={`text-[10px] font-semibold underline ${t.hint}`}
        >
          Xóa ảnh
        </button>
      )}
      <p className={`text-[10px] text-center max-w-[180px] ${t.hint}`}>JPG, PNG, WebP · tối đa 2MB</p>
      {error && <p className={`text-[10px] font-medium text-center ${t.err}`}>{error}</p>}
    </div>
  );
};

export default AvatarUpload;
