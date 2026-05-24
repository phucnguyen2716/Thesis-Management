import React, { useCallback, useEffect, useRef, useState } from 'react';
import { countWords, loadPracticeDraft, savePracticeDraft } from '../../utils/thesisPracticeStorage';

const TEMPLATES = [
  {
    id: 'intro',
    label: 'Mở đầu',
    html: `<h1 style="text-align:center">MỞ ĐẦU</h1>
<p><strong>1. Lý do chọn đề tài</strong></p>
<p>Trong bối cảnh chuyển đổi số tại các trường đại học...</p>
<p><strong>2. Mục tiêu nghiên cứu</strong></p>
<ul><li>Mục tiêu tổng quát: ...</li><li>Mục tiêu cụ thể: ...</li></ul>`,
  },
  {
    id: 'ch1',
    label: 'Chương 1',
    html: `<h1 style="text-align:center">CHƯƠNG 1<br/>TỔNG QUAN LÝ THUYẾT</h1>
<p><strong>1.1. Cơ sở lý thuyết</strong></p>
<p>Nội dung trình bày các khái niệm, mô hình liên quan...</p>
<p><strong>1.2. Tổng quan tài liệu</strong></p>
<p>Các nghiên cứu trong và ngoài nước về chủ đề...</p>`,
  },
  {
    id: 'conclusion',
    label: 'Kết luận',
    html: `<h1 style="text-align:center">KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN</h1>
<p><strong>Kết luận:</strong> Đề tài đã đạt được các mục tiêu đề ra...</p>
<p><strong>Hạn chế:</strong> Phạm vi nghiên cứu còn...</p>
<p><strong>Hướng phát triển:</strong> Mở rộng mẫu khảo sát...</p>`,
  },
];

const TOOLBAR_GROUPS = [
  {
    label: 'Font',
    items: [
      { cmd: 'fontName', arg: 'Times New Roman', icon: 'text_fields', title: 'Times New Roman' },
      { cmd: 'fontName', arg: 'Arial', icon: 'title', title: 'Arial' },
      { cmd: 'fontSize', arg: '3', icon: 'format_size', title: 'Cỡ chữ' },
      { cmd: 'bold', icon: 'format_bold', title: 'In đậm' },
      { cmd: 'italic', icon: 'format_italic', title: 'In nghiêng' },
      { cmd: 'underline', icon: 'format_underlined', title: 'Gạch chân' },
    ],
  },
  {
    label: 'Đoạn',
    items: [
      { cmd: 'justifyLeft', icon: 'format_align_left', title: 'Căn trái' },
      { cmd: 'justifyCenter', icon: 'format_align_center', title: 'Căn giữa' },
      { cmd: 'justifyRight', icon: 'format_align_right', title: 'Căn phải' },
      { cmd: 'justifyFull', icon: 'format_align_justify', title: 'Căn đều' },
      { cmd: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Danh sách' },
      { cmd: 'insertOrderedList', icon: 'format_list_numbered', title: 'Đánh số' },
    ],
  },
  {
    label: 'Chèn',
    items: [
      { cmd: 'formatBlock', arg: 'h1', icon: 'looks_one', title: 'Tiêu đề 1' },
      { cmd: 'formatBlock', arg: 'h2', icon: 'looks_two', title: 'Tiêu đề 2' },
      { cmd: 'formatBlock', arg: 'p', icon: 'notes', title: 'Đoạn văn' },
      { cmd: 'insertHorizontalRule', icon: 'horizontal_rule', title: 'Đường kẻ' },
      { cmd: 'removeFormat', icon: 'format_clear', title: 'Xóa định dạng' },
    ],
  },
];

const WordPlayground = () => {
  const editorRef = useRef(null);
  const saveTimer = useRef(null);
  const [title, setTitle] = useState('Đồ án luyện tập');
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [zoom, setZoom] = useState(100);

  const syncStats = useCallback(() => {
    const html = editorRef.current?.innerHTML || '';
    const text = editorRef.current?.innerText || '';
    setWords(countWords(html));
    setChars(text.replace(/\s/g, '').length);
  }, []);

  useEffect(() => {
    const draft = loadPracticeDraft();
    setTitle(draft.title || 'Đồ án luyện tập');
    if (editorRef.current) {
      editorRef.current.innerHTML = draft.html || '';
      syncStats();
    }
    if (draft.updatedAt) setSavedAt(draft.updatedAt);
  }, [syncStats]);

  const persist = useCallback(() => {
    if (!editorRef.current) return;
    const data = savePracticeDraft({ title, html: editorRef.current.innerHTML });
    setSavedAt(data.updatedAt);
  }, [title]);

  const scheduleSave = useCallback(() => {
    syncStats();
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 800);
  }, [persist, syncStats]);

  const exec = (cmd, arg = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    scheduleSave();
  };

  const applyTemplate = tpl => {
    if (!editorRef.current) return;
    if (editorRef.current.innerText.trim() && !window.confirm('Thay nội dung hiện tại bằng mẫu?')) return;
    editorRef.current.innerHTML = tpl.html;
    scheduleSave();
  };

  const handlePrint = () => window.print();

  const handleCopy = async () => {
    const text = editorRef.current?.innerText || '';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] bg-[#f3f2f1] rounded-2xl border border-outline-variant overflow-hidden shadow-lg">
      {/* Word-like title bar */}
      <div className="bg-[#185abd] text-white px-4 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-xl">description</span>
          <input
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              clearTimeout(saveTimer.current);
              saveTimer.current = setTimeout(persist, 500);
            }}
            className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-sm font-semibold min-w-0 flex-1 max-w-md truncate"
          />
          <span className="text-[10px] opacity-70 hidden sm:inline">— Luyện tập đồ án</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 rounded text-[10px] font-bold bg-white/15 hover:bg-white/25"
          >
            Sao chép
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-2 py-1 rounded text-[10px] font-bold bg-white/15 hover:bg-white/25"
          >
            In / PDF
          </button>
        </div>
      </div>

      {/* Ribbon */}
      <div className="bg-white border-b border-slate-200 px-2 py-2 shrink-0 overflow-x-auto">
        <div className="flex flex-wrap gap-3 min-w-max">
          {TOOLBAR_GROUPS.map(group => (
            <div key={group.label} className="flex flex-col border-r border-slate-100 pr-3 last:border-0">
              <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">{group.label}</span>
              <div className="flex gap-0.5">
                {group.items.map(item => (
                  <button
                    key={`${item.cmd}-${item.arg || item.icon}`}
                    type="button"
                    title={item.title}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => exec(item.cmd, item.arg)}
                    className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700"
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col border-r border-slate-100 pr-3">
            <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Mẫu</span>
            <div className="flex gap-1">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="px-2 h-8 rounded bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Thu phóng</span>
            <div className="flex items-center gap-1 h-8">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(70, z - 10))}
                className="w-7 h-7 rounded hover:bg-slate-100 text-sm font-bold"
              >
                −
              </button>
              <span className="text-[10px] font-bold w-10 text-center">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(130, z + 10))}
                className="w-7 h-7 rounded hover:bg-slate-100 text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document canvas */}
      <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#e8e6e3]">
        <div
          className="mx-auto bg-white shadow-2xl transition-transform origin-top"
          style={{
            width: '21cm',
            minHeight: '29.7cm',
            maxWidth: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={scheduleSave}
            className="word-playground-editor outline-none px-[2.5cm] py-[2cm] min-h-[25cm] text-[13pt] leading-[1.5] text-black"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
            data-placeholder="Bắt đầu soạn đồ án của bạn..."
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[#185abd] text-white text-[10px] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <span>Trang 1 · Khổ A4 (luyện tập)</span>
        <span>
          {words} từ · {chars} ký tự
          {savedAt && (
            <span className="opacity-70 ml-2">
              · Đã lưu {new Date(savedAt).toLocaleTimeString('vi-VN')}
            </span>
          )}
        </span>
      </div>

      <style>{`
        .word-playground-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .word-playground-editor h1 { font-size: 16pt; font-weight: bold; margin: 1em 0 0.5em; }
        .word-playground-editor h2 { font-size: 14pt; font-weight: bold; margin: 0.8em 0 0.4em; }
        .word-playground-editor p { margin: 0 0 0.6em; text-align: justify; }
        .word-playground-editor ul, .word-playground-editor ol { margin: 0 0 0.6em 1.5em; }
        @media print {
          body * { visibility: hidden; }
          .word-playground-editor, .word-playground-editor * { visibility: visible; }
          .word-playground-editor {
            position: absolute; left: 0; top: 0; width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default WordPlayground;
