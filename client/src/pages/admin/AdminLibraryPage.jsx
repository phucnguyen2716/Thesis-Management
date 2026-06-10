import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import JSZip from 'jszip';

const DISCIPLINES = [
  'Công nghệ thông tin & Khoa học dữ liệu',
  'Trí tuệ nhân tạo & Robot',
  'Kinh tế & Quản trị kinh doanh',
  'Phương pháp Nghiên cứu Khoa học',
  'Ngôn ngữ & Sư phạm học'
];

// Short label map for badge display
const DISCIPLINE_SHORT = {
  'Công nghệ thông tin & Khoa học dữ liệu': 'CNTT & DL',
  'Trí tuệ nhân tạo & Robot': 'AI & Robot',
  'Kinh tế & Quản trị kinh doanh': 'Kinh tế & QT',
  'Phương pháp Nghiên cứu Khoa học': 'PPNCKH',
  'Ngôn ngữ & Sư phạm học': 'Ngôn ngữ & SP'
};

const PRESET_COVERS = [
  { name: 'Sơn thạch', css: 'from-slate-700 via-teal-900 to-slate-900' },
  { name: 'Đại dương', css: 'from-cyan-800 via-blue-900 to-slate-950' },
  { name: 'Rừng thông', css: 'from-emerald-800 via-teal-950 to-emerald-950' },
  { name: 'Hoàng hôn', css: 'from-orange-800 via-red-950 to-stone-950' },
  { name: 'Thạch anh', css: 'from-purple-800 via-violet-950 to-indigo-950' }
];

// ─── Helper: split raw text into chapters ────────────────────────────────────
function splitIntoChapters(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const chapters = [];
  let currentChapter = null;
  const chapterRegex = /^(chương\s+\d+|chapter\s+\d+|phần\s+\d+|part\s+\d+|mục\s+\d+|\d+[\.]\s)/i;

  for (const line of lines) {
    const isHeading =
      chapterRegex.test(line) ||
      (line.length < 120 && line === line.toUpperCase() && line.length > 4 && !/^\d+$/.test(line));

    if (isHeading) {
      if (currentChapter && currentChapter.content.trim()) {
        chapters.push(currentChapter);
      }
      currentChapter = { title: line, content: '' };
    } else {
      if (!currentChapter) {
        currentChapter = { title: 'Phần mở đầu', content: '' };
      }
      currentChapter.content += (currentChapter.content ? '\n\n' : '') + line;
    }
  }
  if (currentChapter && currentChapter.content.trim()) {
    chapters.push(currentChapter);
  }

  if (chapters.length === 0 && rawText.trim()) {
    chapters.push({ title: 'Nội dung tài liệu', content: rawText.trim() });
  }

  return chapters;
}

// ─── DOCX Parser (mammoth) ────────────────────────────────────────────────────
async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return splitIntoChapters(result.value);
}

// ─── PDF Parser (PDF.js via CDN) ─────────────────────────────────────────────
async function parsePdf(file) {
  // Dynamically load PDF.js from CDN
  const PDFJS_VERSION = '3.11.174';
  const cdnBase = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

  // Load pdf.js main script if not already loaded
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${cdnBase}/pdf.min.js`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${cdnBase}/pdf.worker.min.js`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  let fullText = '';
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return splitIntoChapters(fullText);
}

// ─── PPTX Parser (JSZip) ─────────────────────────────────────────────────────
async function parsePptx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = [];

  zip.forEach((relativePath, zipEntry) => {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(relativePath) && !zipEntry.dir) {
      slideFiles.push({ path: relativePath, entry: zipEntry });
    }
  });

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.path.match(/slide(\d+)/)?.[1] || '0');
    const numB = parseInt(b.path.match(/slide(\d+)/)?.[1] || '0');
    return numA - numB;
  });

  const chapters = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const { entry } = slideFiles[i];
    const xmlStr = await entry.async('string');
    const textMatches = [...xmlStr.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)];
    const texts = textMatches.map(m => m[1].trim()).filter(Boolean);
    if (texts.length === 0) continue;
    chapters.push({
      title: `Slide ${i + 1}: ${texts[0]}`,
      content: texts.slice(1).join('\n\n') || texts[0]
    });
  }

  if (chapters.length === 0) {
    chapters.push({ title: 'Nội dung bài thuyết trình', content: 'Không trích xuất được nội dung từ file.' });
  }
  return chapters;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    title: '',
    author: '',
    discipline: DISCIPLINES[0],
    summary: '',
    coverCss: PRESET_COVERS[0].css,
    chapters: [{ title: 'Chương 1: Mở đầu', content: '' }]
  });

  const [importTab, setImportTab] = useState('manual');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importProgress, setImportProgress] = useState('');
  const fileInputRef = useRef(null);

  const loadBooks = () => {
    const raw = localStorage.getItem('thesisLecturerLibrary');
    setBooks(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    loadBooks();
    window.addEventListener('storage', loadBooks);
    return () => window.removeEventListener('storage', loadBooks);
  }, []);

  const saveBooksList = (updated) => {
    localStorage.setItem('thesisLecturerLibrary', JSON.stringify(updated));
    setBooks(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleOpenCreate = () => {
    setForm({
      title: '',
      author: '',
      discipline: DISCIPLINES[0],
      summary: '',
      coverCss: PRESET_COVERS[0].css,
      chapters: [{ title: 'Chương 1: Mở đầu', content: '' }]
    });
    setImportTab('manual');
    setImportError('');
    setImportSuccess('');
    setImportProgress('');
    setModal({ mode: 'create' });
  };

  const handleOpenEdit = (book) => {
    setForm({
      title: book.title,
      author: book.author,
      discipline: book.discipline,
      summary: book.summary,
      coverCss: book.coverCss,
      chapters: book.chapters.map(ch => ({ ...ch }))
    });
    setImportTab('manual');
    setImportError('');
    setImportSuccess('');
    setImportProgress('');
    setModal({ mode: 'edit', bookId: book.id });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa cuốn sách này khỏi thư viện?')) {
      saveBooksList(books.filter(b => b.id !== id));
    }
  };

  const handleAddChapterForm = () => {
    setForm(prev => ({
      ...prev,
      chapters: [...prev.chapters, { title: `Chương ${prev.chapters.length + 1}: `, content: '' }]
    }));
  };

  const handleRemoveChapterForm = (idx) => {
    if (form.chapters.length === 1) return;
    setForm(prev => ({ ...prev, chapters: prev.chapters.filter((_, i) => i !== idx) }));
  };

  const handleChapterChangeForm = (idx, field, val) => {
    setForm(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) => i === idx ? { ...ch, [field]: val } : ch)
    }));
  };

  // ─── File Import Handler ────────────────────────────────────────────────────
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError('');
    setImportSuccess('');
    setImportProgress('');

    try {
      const fileName = file.name.toLowerCase();
      let parsedChapters = [];

      if (fileName.endsWith('.docx')) {
        setImportProgress('Đang trích xuất văn bản từ Word...');
        parsedChapters = await parseDocx(file);
      } else if (fileName.endsWith('.pdf')) {
        setImportProgress('Đang tải PDF.js và đọc file...');
        parsedChapters = await parsePdf(file);
      } else if (fileName.endsWith('.pptx')) {
        setImportProgress('Đang phân tích các slide PowerPoint...');
        parsedChapters = await parsePptx(file);
      } else {
        setImportError('Chỉ hỗ trợ .docx, .pdf và .pptx. Vui lòng chọn đúng loại file.');
        setImportLoading(false);
        return;
      }

      if (parsedChapters.length === 0) {
        setImportError('Không tìm thấy nội dung nào trong file. Hãy kiểm tra lại file.');
        setImportLoading(false);
        return;
      }

      const baseName = file.name.replace(/\.(docx|pdf|pptx)$/i, '');
      setForm(prev => ({
        ...prev,
        title: prev.title || baseName,
        chapters: parsedChapters
      }));

      setImportSuccess(
        `✅ Nhập thành công ${parsedChapters.length} chương từ "${file.name}".`
      );
      setImportTab('manual');
    } catch (err) {
      console.error('Import error:', err);
      setImportError('Lỗi khi đọc file: ' + (err.message || 'Không xác định. Vui lòng thử lại.'));
    } finally {
      setImportLoading(false);
      setImportProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || !form.summary.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin sách!');
      return;
    }
    const validChapters = form.chapters.filter(ch => ch.title.trim() && ch.content.trim());
    if (validChapters.length === 0) {
      alert('Vui lòng có ít nhất một chương có nội dung!');
      return;
    }

    if (modal.mode === 'create') {
      const newBook = {
        id: `lib-book-${Date.now()}`,
        title: form.title.trim(),
        author: form.author.trim(),
        discipline: form.discipline,
        summary: form.summary.trim(),
        coverCss: form.coverCss,
        rating: 5.0,
        pages: validChapters.length * 15 + Math.floor(Math.random() * 15) + 12,
        dateAdded: Date.now(),
        chapters: validChapters
      };
      saveBooksList([newBook, ...books]);
    } else {
      const updated = books.map(b => b.id === modal.bookId ? {
        ...b,
        title: form.title.trim(),
        author: form.author.trim(),
        discipline: form.discipline,
        summary: form.summary.trim(),
        coverCss: form.coverCss,
        pages: validChapters.length * 15 + Math.floor(Math.random() * 15) + 12,
        chapters: validChapters
      } : b);
      saveBooksList(updated);
    }
    setModal(null);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.summary.toLowerCase().includes(search.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'All' || book.discipline === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="max-w-6xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Thư viện tham khảo</h1>
          <p className="text-slate-400 text-sm">
            CRUD kho tài liệu sách tham khảo · Hỗ trợ nhập từ file <span className="text-amber-400 font-semibold">Word, PDF & PowerPoint</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase shrink-0 hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Thêm sách tham khảo
        </button>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm sách, tác giả, tóm tắt..."
          className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
        />
        <select
          value={selectedDiscipline}
          onChange={e => setSelectedDiscipline(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
        >
          <option value="All">Tất cả nhóm ngành</option>
          {DISCIPLINES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {filteredBooks.length > 0 ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4 w-20">Bìa</th>
                <th className="p-4">Thông tin sách</th>
                <th className="p-4 w-36">Chuyên ngành</th>
                <th className="p-4 w-28">Chương sách</th>
                <th className="p-4 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBooks.map(book => (
                <tr key={book.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4">
                    <div className={`w-12 h-16 rounded bg-gradient-to-br ${book.coverCss} flex items-center justify-center p-1 border border-white/10 text-white overflow-hidden shadow`}>
                      <span className="text-[6px] font-black text-center line-clamp-2 leading-none uppercase">{book.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <h3 className="font-bold text-white text-sm leading-tight mb-1">{book.title}</h3>
                    <p className="text-slate-400 font-semibold mb-2">Tác giả: {book.author}</p>
                    <p className="text-slate-500 font-medium line-clamp-2">{book.summary}</p>
                  </td>
                  <td className="p-4">
                    {/* Fixed badge: short label + full name tooltip */}
                    <span
                      className="inline-block px-2 py-1 rounded-md bg-slate-800 text-amber-400 font-bold text-[10px] uppercase border border-slate-700 leading-tight whitespace-nowrap"
                      title={book.discipline}
                    >
                      {DISCIPLINE_SHORT[book.discipline] || book.discipline}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-amber-400">{book.chapters.length} chương</span>
                    <p className="text-slate-500 text-[10px] mt-0.5">{book.pages || 100} trang</p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(book)}
                        className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(book.id)}
                        className="px-2.5 py-1.5 rounded bg-red-950/40 hover:bg-red-900/40 text-red-400 font-bold transition-all border border-red-950"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <span className="material-symbols-outlined text-4xl">local_library</span>
            <p className="text-sm font-semibold">Chưa có cuốn sách tham khảo nào</p>
            <p className="text-xs text-slate-600 max-w-md mx-auto">Không tìm thấy sách tham khảo nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>

      {/* CRUD Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4 my-4 flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-black text-white">
                {modal.mode === 'create' ? 'Thêm sách tham khảo mới' : 'Sửa sách tham khảo'}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Import / Manual Tabs */}
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setImportTab('manual')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                  importTab === 'manual'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Soạn thủ công
              </button>
              <button
                type="button"
                onClick={() => setImportTab('import')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                  importTab === 'import'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Import Word / PDF / PPT
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">

              {/* ── IMPORT TAB ── */}
              {importTab === 'import' && (
                <div className="space-y-4">
                  {/* Drop zone */}
                  <div
                    onClick={() => !importLoading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all group ${
                      importLoading
                        ? 'border-blue-700 bg-blue-950/20 cursor-wait'
                        : 'border-slate-700 hover:border-amber-500/60 cursor-pointer bg-slate-800/30 hover:bg-amber-500/5'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-5xl transition-colors ${
                      importLoading ? 'text-blue-400 animate-pulse' : 'text-slate-600 group-hover:text-amber-400'
                    }`}>
                      {importLoading ? 'hourglass_top' : 'cloud_upload'}
                    </span>
                    <div className="text-center space-y-1.5">
                      <p className={`text-sm font-bold transition-colors ${
                        importLoading ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'
                      }`}>
                        {importLoading ? (importProgress || 'Đang xử lý file...') : 'Nhấn để chọn file'}
                      </p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {[
                          { icon: 'description', ext: '.docx', label: 'Word', color: 'text-blue-400' },
                          { icon: 'picture_as_pdf', ext: '.pdf', label: 'PDF', color: 'text-red-400' },
                          { icon: 'slideshow', ext: '.pptx', label: 'PowerPoint', color: 'text-orange-400' },
                        ].map(f => (
                          <span key={f.ext} className={`inline-flex items-center gap-1 text-[11px] font-bold ${f.color}`}>
                            <span className="material-symbols-outlined text-sm">{f.icon}</span>
                            {f.ext}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Hệ thống sẽ tự động trích xuất và tách thành các chương
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.pdf,.pptx"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </div>

                  {/* Status messages */}
                  {importLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-950/40 border border-blue-900 text-blue-300 text-xs font-semibold">
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      {importProgress || 'Đang phân tích và trích xuất nội dung từ file...'}
                    </div>
                  )}
                  {importError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-900 text-red-300 text-xs font-semibold">
                      <span className="material-symbols-outlined text-base">error</span>
                      {importError}
                    </div>
                  )}
                  {importSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs font-semibold space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        {importSuccess}
                      </div>
                      <p className="text-emerald-500 pl-6">Chuyển sang tab "Soạn thủ công" để xem và chỉnh sửa các chương đã trích xuất.</p>
                    </div>
                  )}

                  {/* How it works */}
                  <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cách hoạt động</p>
                    <div className="space-y-2.5">
                      {[
                        {
                          icon: 'description',
                          color: 'text-blue-400',
                          label: 'File Word (.docx)',
                          desc: 'Phát hiện tự động tiêu đề chương (Chương 1, Phần 2, IN HOA...) và tách thành các chương riêng biệt.'
                        },
                        {
                          icon: 'picture_as_pdf',
                          color: 'text-red-400',
                          label: 'File PDF (.pdf)',
                          desc: 'Trích xuất toàn bộ văn bản thuần từ PDF, sau đó tự động nhận diện và phân chia theo chương.'
                        },
                        {
                          icon: 'slideshow',
                          color: 'text-orange-400',
                          label: 'File PowerPoint (.pptx)',
                          desc: 'Mỗi slide trở thành một chương. Tiêu đề slide = tên chương, nội dung slide = nội dung chương.'
                        },
                      ].map(item => (
                        <div key={item.icon} className="flex gap-3 items-start">
                          <span className={`material-symbols-outlined text-base ${item.color} shrink-0 mt-0.5`}>{item.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-300">{item.label}</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── MANUAL TAB ── */}
              {importTab === 'manual' && (
                <>
                  {importSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs font-semibold">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Đã nhập từ file: {form.chapters.length} chương · Kiểm tra và hoàn thiện thông tin bên dưới.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs text-slate-400 font-bold uppercase">
                      Tên cuốn sách *
                      <input
                        required
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Tên cuốn sách nghiên cứu"
                        className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium text-sm"
                      />
                    </label>
                    <label className="block text-xs text-slate-400 font-bold uppercase">
                      Tác giả *
                      <input
                        required
                        value={form.author}
                        onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        placeholder="Ví dụ: GS. TS. Nguyễn Văn A"
                        className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium text-sm"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs text-slate-400 font-bold uppercase">
                      Nhóm ngành *
                      <select
                        value={form.discipline}
                        onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}
                        className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
                      >
                        {DISCIPLINES.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                    <div className="block text-xs text-slate-400 font-bold uppercase">
                      Màu bìa sách *
                      <div className="flex gap-2.5 h-[42px] items-center mt-1.5">
                        {PRESET_COVERS.map(cover => (
                          <button
                            key={cover.name}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, coverCss: cover.css }))}
                            className={`w-7 h-7 rounded-full bg-gradient-to-br ${cover.css} border transition-all relative flex items-center justify-center shrink-0 ${
                              form.coverCss === cover.css ? 'scale-110 border-white ring-2 ring-amber-500' : 'border-slate-700 opacity-80 hover:opacity-100'
                            }`}
                            title={cover.name}
                          >
                            {form.coverCss === cover.css && (
                              <span className="material-symbols-outlined text-[10px] text-white font-bold">check</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label className="block text-xs text-slate-400 font-bold uppercase">
                    Tóm tắt ngắn gọn *
                    <textarea
                      required
                      rows={2}
                      value={form.summary}
                      onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                      placeholder="Mô tả tóm tắt nội dung chính..."
                      className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium resize-none text-sm"
                    />
                  </label>

                  {/* Chapters Editor */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Các chương ({form.chapters.length})
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddChapterForm}
                        className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Thêm chương
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto border border-slate-800 p-3 bg-slate-950/50 rounded-xl divide-y divide-slate-800">
                      {form.chapters.map((ch, idx) => (
                        <div key={idx} className="space-y-3 pt-3 first:pt-0 relative">
                          {form.chapters.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChapterForm(idx)}
                              className="absolute right-1 top-1 text-slate-500 hover:text-red-400 transition-colors"
                              title="Xóa chương này"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          )}

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">
                              Tiêu đề chương {idx + 1}
                            </label>
                            <input
                              type="text"
                              required
                              value={ch.title}
                              onChange={e => handleChapterChangeForm(idx, 'title', e.target.value)}
                              placeholder={`Chương ${idx + 1}: Tên chương`}
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">
                              Nội dung chương {idx + 1}
                            </label>
                            <textarea
                              required
                              rows={4}
                              value={ch.content}
                              onChange={e => handleChapterChangeForm(idx, 'content', e.target.value)}
                              placeholder="Viết nội dung bài viết nghiên cứu tại đây..."
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white leading-relaxed resize-y"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase hover:bg-amber-400 active:scale-[0.98] transition-all"
              >
                Lưu vào thư viện
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 font-bold text-xs uppercase hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminLibraryPage;
