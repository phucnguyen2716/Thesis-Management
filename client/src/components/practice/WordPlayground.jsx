import React, { useCallback, useEffect, useRef, useState } from 'react';
import { countWords, loadPracticeDraft, savePracticeDraft } from '../../utils/thesisPracticeStorage';
import {
  loadTemplates,
  saveTemplates,
  DEFAULT_TEMPLATES,
  savePracticeSubmission,
  loadPracticeSubmissions
} from '../../utils/thesisPracticeTemplates';

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
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const [title, setTitle] = useState('Đồ án luyện tập');
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [containerWidth, setContainerWidth] = useState(800);
  const [pageHeight, setPageHeight] = useState(1122);

  // States mới cho việc quản lý mẫu và AI chấm điểm
  const [templates, setTemplates] = useState([]);
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('Tất cả');
  const [activeTemplateId, setActiveTemplateId] = useState('master_ch');
  const [isMultilevelActive, setIsMultilevelActive] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingStep, setGradingStep] = useState('');
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });

  const syncStats = useCallback(() => {
    const html = editorRef.current?.innerHTML || '';
    const text = editorRef.current?.innerText || '';
    setWords(countWords(html));
    setChars(text.replace(/\s/g, '').length);
    if (pageRef.current) {
      setPageHeight(pageRef.current.scrollHeight);
    }
  }, []);

  const loadSubmissions = useCallback(() => {
    const list = loadPracticeSubmissions();
    // Lấy bài nộp của tài khoản hiện tại
    const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "Sinh viên Demo"}');
    const filtered = list.filter(s => s.studentName === user.fullName).sort((a, b) => b.updatedAt - a.updatedAt);
    setMySubmissions(filtered);
    
    // Nếu có bài đã nộp và được GV chấm, cập nhật điểm số hiển thị
    if (filtered.length > 0 && gradeResult?.id === filtered[0].id) {
      setGradeResult(filtered[0]);
    }
  }, [gradeResult?.id]);

  useEffect(() => {
    // Tải danh sách templates từ local
    let tpls = loadTemplates();
    // Đảm bảo đồng bộ với các mẫu chương mới
    if (!tpls.some(t => t.id === 'intro')) {
      saveTemplates(DEFAULT_TEMPLATES);
      tpls = DEFAULT_TEMPLATES;
    }
    setTemplates(tpls);

    const draft = loadPracticeDraft();
    setTitle(draft.title || 'Đồ án luyện tập');
    if (editorRef.current) {
      editorRef.current.innerHTML = draft.html || '';
      syncStats();
    }
    if (draft.updatedAt) setSavedAt(draft.updatedAt);
    
    loadSubmissions();

    // Đồng bộ hóa template mặc định theo nội dung draft
    if (draft.html) {
      const match = tpl => draft.html.includes(tpl.requiredSections?.[0] || '___');
      const matched = tpls.find(match);
      if (matched) {
        setActiveTemplateId(matched.id);
        setSelectedChapterFilter(matched.chapterTag);
      }
    }

    const handleUpdate = () => {
      loadSubmissions();
    };
    const handleTemplatesUpdate = () => {
      setTemplates(loadTemplates());
    };
    window.addEventListener('practice-submissions-updated', handleUpdate);
    window.addEventListener('practice-templates-updated', handleTemplatesUpdate);

    return () => {
      window.removeEventListener('practice-submissions-updated', handleUpdate);
      window.removeEventListener('practice-templates-updated', handleTemplatesUpdate);
    };
  }, [syncStats, loadSubmissions]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, []);

  // Lắng nghe sự kiện click toàn cục để xóa lựa chọn hình ảnh khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (editorRef.current && editorRef.current.contains(e.target)) {
        return;
      }
      if (e.target.closest('.image-edit-toolbar')) {
        return;
      }
      if (selectedImage) {
        if (editorRef.current) {
          const imgs = editorRef.current.querySelectorAll('img');
          imgs.forEach(img => img.classList.remove('img-selected'));
        }
        setSelectedImage(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [selectedImage]);

  const handleEditorClick = (e) => {
    const editor = editorRef.current;
    if (!editor) return;

    const imgs = editor.querySelectorAll('img');
    imgs.forEach(img => img.classList.remove('img-selected'));

    if (e.target.tagName === 'IMG') {
      e.target.classList.add('img-selected');
      setSelectedImage(e.target);
      
      const canvasContainer = e.target.closest('.relative');
      if (canvasContainer) {
        const canvasRect = canvasContainer.getBoundingClientRect();
        const imgRect = e.target.getBoundingClientRect();
        const top = imgRect.top - canvasRect.top - 48;
        const left = imgRect.left - canvasRect.left + (imgRect.width / 2) - 130;
        setImgToolbarPos({ top, left });
      }
    } else {
      setSelectedImage(null);
    }
  };

  const handleAlignImage = (align) => {
    if (!selectedImage) return;
    if (align === 'left') {
      selectedImage.style.margin = '12px auto 12px 0';
      selectedImage.style.display = 'block';
    } else if (align === 'center') {
      selectedImage.style.margin = '12px auto';
      selectedImage.style.display = 'block';
    } else if (align === 'right') {
      selectedImage.style.margin = '12px 0 12px auto';
      selectedImage.style.display = 'block';
    }
    scheduleSave();
    setTimeout(recalculateToolbarPos, 50);
  };

  const handleResizeImage = (widthPercent) => {
    if (!selectedImage) return;
    selectedImage.style.width = `${widthPercent}%`;
    selectedImage.style.height = 'auto';
    scheduleSave();
    setTimeout(recalculateToolbarPos, 50);
  };

  const handleDeleteImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
    scheduleSave();
  };

  const recalculateToolbarPos = () => {
    if (!selectedImage) return;
    const canvasContainer = selectedImage.closest('.relative');
    if (canvasContainer) {
      const canvasRect = canvasContainer.getBoundingClientRect();
      const imgRect = selectedImage.getBoundingClientRect();
      const top = imgRect.top - canvasRect.top - 48;
      const left = imgRect.left - canvasRect.left + (imgRect.width / 2) - 130;
      setImgToolbarPos({ top, left });
    }
  };

  const handleFilterChapterChange = (tag) => {
    setSelectedChapterFilter(tag);
  };

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
    if (editorRef.current.innerText.trim() && !window.confirm('Thay nội dung hiện tại bằng mẫu? Dữ liệu soạn thảo cũ sẽ mất.')) return;
    editorRef.current.innerHTML = tpl.html;
    setActiveTemplateId(tpl.id);
    scheduleSave();
  };

  const handlePrint = () => window.print();

  const handleCopy = async () => {
    const text = editorRef.current?.innerText || '';
    try {
      await navigator.clipboard.writeText(text);
      alert('Đã sao chép nội dung văn bản vào bộ nhớ tạm!');
    } catch {
      /* ignore */
    }
  };

  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        e.preventDefault();
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 12px auto;" alt="Pasted Image" />`;
          document.execCommand('insertHTML', false, imgHtml);
          scheduleSave();
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Lắng nghe phím bấm để tự tăng đề mục con khi gõ Enter (ví dụ 1.1 -> 1.2, 1.11 -> 1.12)
  const handleKeyDown = (e) => {
    if (selectedImage && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      handleDeleteImage();
      return;
    }
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      // Tìm dòng văn bản hiện tại bằng cách đi ngược lên thẻ div hoặc p con của editorRef
      let container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentNode;
      }

      // Đảm bảo container nằm trong editorRef
      if (!editorRef.current || !editorRef.current.contains(container)) return;

      // Đưa con trỏ về đúng thẻ trực tiếp bên dưới editorRef
      while (container && container.parentNode !== editorRef.current && container !== editorRef.current) {
        container = container.parentNode;
      }

      let lineText = '';
      if (container === editorRef.current) {
        // Nếu ở trực tiếp dưới editorRef mà không có thẻ wrapper, ghép các sibling từ vị trí con trỏ ngược lại
        let node = range.startContainer;
        let textParts = [];
        let curr = node;
        while (curr && curr !== editorRef.current) {
          textParts.unshift(curr.textContent || '');
          curr = curr.previousSibling;
        }
        lineText = textParts.join('');
      } else {
        lineText = container.innerText || '';
      }
      
      // Tìm số thứ tự phân cấp như 1.1, 1.11, 1.12, 1.3, 2.1... ở đầu dòng
      // Chấp nhận định dạng như "1.1.", "1.1", "1.11. ", "1.11 "
      const match = lineText.match(/^(\d+(?:\.\d+)+)\.?\s*(.*)$/);

      if (match) {
        const fullPrefix = match[1]; // e.g. "1.11"
        const restOfText = match[2]?.trim() || '';

        // Nếu dòng hiện tại trống (chỉ có số thứ tự), gõ Enter sẽ xóa số thứ tự (giống Word)
        if (!restOfText) {
          e.preventDefault();
          container.innerHTML = '<br>';
          scheduleSave();
          return;
        }

        // Tính số thứ tự kế tiếp
        const parts = fullPrefix.split('.');
        const lastIndex = parts.length - 1;
        const lastNum = parseInt(parts[lastIndex], 10);

        if (!isNaN(lastNum)) {
          parts[lastIndex] = lastNum + 1;
          const nextPrefix = parts.join('.');

          e.preventDefault();

          // Tạo một dòng mới
          const newDiv = document.createElement('div');
          newDiv.innerHTML = `<strong>${nextPrefix}. </strong>&nbsp;`;

          // Chèn dòng mới vào sau dòng hiện tại
          if (container.nextSibling) {
            editorRef.current.insertBefore(newDiv, container.nextSibling);
          } else {
            editorRef.current.appendChild(newDiv);
          }

          // Đưa con trỏ và chọn vùng soạn thảo tại dòng mới
          const newRange = document.createRange();
          newRange.selectNodeContents(newDiv);
          newRange.collapse(false); // Di chuyển con trỏ xuống cuối dòng mới
          selection.removeAllRanges();
          selection.addRange(newRange);

          scheduleSave();
        }
      }
    }
  };

  // Hàm chèn mục lục con nhanh vào vị trí trỏ chuột
  const insertQuickHeading = (headingStr) => {
    editorRef.current?.focus();
    
    let finalHeading = headingStr;
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      let currentHeading = headingStr;
      let exists = true;
      let safetyCounter = 0;
      
      while (exists && safetyCounter < 100) {
        safetyCounter++;
        // Kiểm tra xem tiêu đề này đã tồn tại ở đầu đoạn/dòng chưa
        const escapedHeading = currentHeading.replace(/\./g, '\\.');
        const regex = new RegExp('(?:^|\\s|\\n)' + escapedHeading + '(?:\\.|\\s|\\xa0|$)', 'i');
        if (regex.test(text)) {
          // Nếu đã tồn tại, tự động tăng chỉ số cuối lên +1
          const currentParts = currentHeading.split('.');
          const lastIdx = currentParts.length - 1;
          const lastNum = parseInt(currentParts[lastIdx], 10);
          if (!isNaN(lastNum)) {
            currentParts[lastIdx] = lastNum + 1;
            currentHeading = currentParts.join('.');
          } else {
            exists = false;
          }
        } else {
          exists = false;
        }
      }
      finalHeading = currentHeading;
    }

    // Chèn dạng in đậm và ngắt dòng
    const htmlToInsert = `<strong>${finalHeading} </strong>&nbsp;`;
    document.execCommand('insertHTML', false, htmlToInsert);
    scheduleSave();
  };

  const getNextHeadingSuggestion = () => {
    if (!editorRef.current) return '1.1';
    const text = editorRef.current.innerText || '';
    
    const regex = /(?:^|\s|\n)(\d+(?:\.\d+)+)(?:\.|\s|\xa0|$)/g;
    let match;
    let lastHeading = null;
    
    while ((match = regex.exec(text)) !== null) {
      lastHeading = match[1];
    }
    
    if (!lastHeading) return '1.1';
    
    const parts = lastHeading.split('.');
    const lastIdx = parts.length - 1;
    const lastNum = parseInt(parts[lastIdx], 10);
    if (!isNaN(lastNum)) {
      parts[lastIdx] = lastNum + 1;
      return parts.join('.');
    }
    return '1.1';
  };

  // Logic AI chấm điểm giả lập cực kỳ chi tiết
  const runAiGrading = () => {
    setIsGrading(true);
    let step = 0;
    const steps = [
      'Đang quét văn bản và phân tích số từ...',
      'Đang kiểm tra định dạng phông chữ Times New Roman...',
      'Đang phân tích cấu trúc các đề mục chương...',
      'Đang quét tiểu mục con bắt buộc (1.1, 1.3, 1.11, 2.1...)...',
      'Đang kiểm tra mật độ từ khóa khoa học và tính hàn lâm...',
      'Đang lập báo cáo đề xuất cải tiến và tổng hợp điểm số...'
    ];
    setGradingStep(steps[0]);

    const timer = setInterval(() => {
      step++;
      if (step < steps.length) {
        setGradingStep(steps[step]);
      } else {
        clearInterval(timer);
        performEvaluation();
      }
    }, 450);
  };

  const performEvaluation = () => {
    const html = editorRef.current?.innerHTML || '';
    const text = editorRef.current?.innerText || '';
    const wordCount = countWords(html);

    // Lấy template hiện hành
    const template = templates.find(t => t.id === activeTemplateId) || templates[0];

    // Khởi tạo các điểm tiêu chí
    let contentScore = 5.0;
    let methodScore = 6.0;
    let originalityScore = 7.0;
    let presentationScore = 6.0;
    const feedback = [];

    // 1. Chấm điểm Nội dung (Đếm từ)
    if (wordCount >= template.minWords) {
      contentScore = Math.min(10.0, 8.5 + (wordCount - template.minWords) / 150);
      feedback.push({
        type: 'success',
        title: 'Nội dung dồi dào',
        text: `Đạt yêu cầu độ dài tối thiểu (${wordCount}/${template.minWords} từ). Cung cấp đủ thông tin phân tích.`
      });
    } else {
      contentScore = Math.max(3.0, (wordCount / template.minWords) * 7.5);
      feedback.push({
        type: 'warning',
        title: 'Độ dài chưa đạt',
        text: `Văn bản hơi ngắn (${wordCount}/${template.minWords} từ). Bạn cần viết cụ thể, mở rộng lý thuyết và phân tích để bài viết có chiều sâu khoa học.`
      });
    }

    // 2. Chấm điểm Cấu trúc (Bắt buộc)
    const missingSections = [];
    const foundSections = [];
    template.requiredSections?.forEach(sec => {
      const regex = new RegExp(sec.replace('.', '\\.'), 'i');
      if (regex.test(text)) {
        foundSections.push(sec);
      } else {
        missingSections.push(sec);
      }
    });

    if (missingSections.length === 0) {
      methodScore = 9.5;
      feedback.push({
        type: 'success',
        title: 'Cấu trúc hoàn hảo',
        text: 'Văn bản của bạn chứa đầy đủ tất cả đề mục bắt buộc theo barem khung của giảng viên.'
      });
    } else {
      methodScore = Math.max(4.0, 9.5 - missingSections.length * 1.5);
      feedback.push({
        type: 'warning',
        title: 'Thiếu tiêu đề bắt buộc',
        text: `Thiếu các tiêu đề bắt buộc: ${missingSections.join(', ')}. Hãy gõ thêm để đảm bảo tính cấu trúc.`
      });
    }

    // Kiểm tra thêm định dạng số phân cấp nhỏ (như 1.11, 1.12, 1.3)
    const needsMultiLevel = template.id !== 'intro' && template.id !== 'conclusion';
    if (needsMultiLevel) {
      const regexMulti = /\b\d+\.\d+\b/g;
      const multiHeadings = text.match(regexMulti) || [];
      if (multiHeadings.length > 0) {
        const uniqueHeadings = [...new Set(multiHeadings)];
        methodScore = Math.min(10.0, methodScore + 0.5);
        feedback.push({
          type: 'success',
          title: 'Sử dụng tiểu mục con tốt',
          text: `Phát hiện các mục lục nhỏ phân cấp: ${uniqueHeadings.slice(0, 4).join(', ')}... Bố cục chi tiết và rất chuyên nghiệp.`
        });
      } else {
        feedback.push({
          type: 'info',
          title: 'Khuyên dùng mục lục con',
          text: 'Nên chia nhỏ đoạn văn thành các đề mục con như 1.1, 1.2, 1.3 hoặc các tiểu mục nhỏ 1.11, 1.12 để người đọc dễ theo dõi.'
        });
      }
    }

    // 3. Chấm điểm Trình bày (Định dạng)
    const hasTimesNewRoman = html.includes('Times New Roman') || editorRef.current?.style.fontFamily.includes('Times New Roman');
    const hasJustify = html.includes('justify') || html.includes('text-align: justify');
    const hasLists = html.includes('<ol>') || html.includes('<ul>');

    if (hasTimesNewRoman) {
      presentationScore += 2.0;
    } else {
      feedback.push({
        type: 'warning',
        title: 'Sai Phông chữ chuẩn',
        text: 'Văn bản chưa sử dụng phông chữ "Times New Roman" chuẩn. Hãy bôi đen toàn bộ và chọn định dạng Font.'
      });
    }

    if (hasJustify) {
      presentationScore += 2.0;
    } else {
      feedback.push({
        type: 'warning',
        title: 'Chưa căn đều hai bên',
        text: 'Văn bản của bạn chưa được căn đều hai bên (Justify). Hãy nhấn nút "Căn đều" trên thanh công cụ để định dạng ngay ngắn.'
      });
    }

    if (hasLists || isMultilevelActive) {
      presentationScore += 1.0;
    }

    presentationScore = Math.min(10.0, Math.max(4.0, presentationScore));
    if (presentationScore >= 8.5) {
      feedback.push({
        type: 'success',
        title: 'Định dạng chuẩn chỉ',
        text: 'Đạt điểm tối đa về căn lề, kiểu phông chữ Times New Roman và cấu trúc định dạng chuẩn Microsoft Word.'
      });
    }

    // 4. Chấm điểm Tính mới / Khoa học (Originality)
    const academicWords = ['phân tích', 'thiết kế', 'hệ thống', 'nghiên cứu', 'thực nghiệm', 'đánh giá', 'blockchain', 'ứng dụng', 'mô hình', 'phát triển', 'quy trình', 'cơ sở', 'lý thuyết'];
    let hits = 0;
    academicWords.forEach(w => {
      if (text.toLowerCase().includes(w)) hits++;
    });

    originalityScore = Math.min(10.0, 6.0 + (hits / academicWords.length) * 4.0);
    if (hits >= 6) {
      feedback.push({
        type: 'success',
        title: 'Văn phong học thuật tốt',
        text: 'Văn bản chứa nhiều thuật ngữ khoa học chuyên môn chính xác. Thể hiện tư duy nghiên cứu rõ ràng.'
      });
    } else {
      feedback.push({
        type: 'info',
        title: 'Cải thiện hành văn',
        text: 'Nên bổ sung thêm các thuật ngữ phân tích chuyên sâu, mô tả các công nghệ ứng dụng cụ thể thay vì dùng từ ngữ đời thường.'
      });
    }

    const overallScore = Math.round(((contentScore + methodScore + originalityScore + presentationScore) / 4) * 10) / 10;
    const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "Sinh viên Demo"}');

    const newSubmission = {
      id: `prc-${Date.now()}`,
      title: title || 'Đồ án luyện tập',
      studentName: user.fullName || 'Sinh viên Demo',
      studentId: user.studentId || 'UEF-2021-DEMO',
      templateId: template.id,
      templateLabel: template.label,
      html: html,
      words: wordCount,
      aiScore: overallScore,
      aiRubric: {
        content: Math.round(contentScore * 10) / 10,
        method: Math.round(methodScore * 10) / 10,
        originality: Math.round(originalityScore * 10) / 10,
        presentation: Math.round(presentationScore * 10) / 10
      },
      aiFeedback: feedback,
      teacherGraded: false,
      teacherGrade: null,
      teacherFeedback: '',
      updatedAt: Date.now()
    };

    const saved = savePracticeSubmission(newSubmission);
    setGradeResult(saved);
    setIsGrading(false);
    setShowGradeModal(true);
  };

  const latestSub = mySubmissions[0];
  const unscaledWidth = 794;
  const unscaledHeight = 1122;
  const autoScale = containerWidth < unscaledWidth ? Math.max(0.35, (containerWidth - 16) / unscaledWidth) : 1;
  const finalScale = autoScale * (zoom / 100);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)] bg-[#f3f2f1] rounded-2xl border border-outline-variant overflow-visible md:overflow-hidden shadow-lg relative">
      {/* Header thanh công cụ sticky */}
      <div className="sticky top-0 z-30 flex flex-col shrink-0 shadow-md">
        {/* Word-like title bar */}
        <div className="bg-[#185abd] text-white px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 w-full md:w-auto">
            <span className="material-symbols-outlined text-lg shrink-0">description</span>
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                clearTimeout(saveTimer.current);
                saveTimer.current = setTimeout(persist, 500);
              }}
              className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs font-semibold min-w-0 flex-1 max-w-md truncate focus:bg-white focus:text-[#185abd] focus:outline-none"
            />
            <span className="text-[9px] opacity-70 hidden sm:inline shrink-0">— Luyện tập cấu trúc</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {latestSub && (
              <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                Lần nộp cuối: {latestSub.teacherGraded ? `GV Chấm ${latestSub.teacherGrade}/10` : `AI Chấm ${latestSub.aiScore}/10`}
              </div>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-white/15 hover:bg-white/25 transition-colors"
            >
              Sao chép
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-white/15 hover:bg-white/25 transition-colors"
            >
              In / PDF
            </button>
            <button
              type="button"
              onClick={runAiGrading}
              className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-slate-900 hover:bg-yellow-300 transition-all shadow flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">auto_awesome</span>
              AI Chấm
            </button>
          </div>
        </div>

        {/* Ribbon */}
        <div className="bg-white border-b border-slate-200 px-3 py-1.5 shrink-0 overflow-x-auto">
          <div className="flex flex-row gap-4 min-w-max items-center">
            {TOOLBAR_GROUPS.map(group => (
              <div key={group.label} className="flex flex-col border-r border-slate-100 pr-4 last:border-0">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">{group.label}</span>
                <div className="flex gap-0.5">
                  {group.items.map(item => (
                    <button
                      key={`${item.cmd}-${item.arg || item.icon}`}
                      type="button"
                      title={item.title}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => exec(item.cmd, item.arg)}
                      className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700 active:bg-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Đánh số nhiều cấp đặc biệt */}
            <div className="flex flex-col border-r border-slate-100 pr-4">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Đánh số nâng cao</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Bật/Tắt Đánh số nhiều cấp (1.1, 1.2, 1.1.1)"
                  onClick={() => {
                    setIsMultilevelActive(!isMultilevelActive);
                    scheduleSave();
                  }}
                  className={`px-2.5 h-8 rounded flex items-center gap-1 text-[10px] font-bold transition-all ${
                    isMultilevelActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">format_list_numbered_rtl</span>
                  Số nhiều cấp
                </button>
              </div>
            </div>

            {/* Lọc chương luyện tập */}
            <div className="flex flex-col border-r border-slate-100 pr-4">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Chọn chương luyện tập</span>
              <div className="flex items-center gap-1.5 h-8">
                <select
                  value={selectedChapterFilter}
                  onChange={e => {
                    handleFilterChapterChange(e.target.value);
                  }}
                  className="h-8 px-2.5 rounded border border-slate-200 text-[10px] font-bold text-slate-700 bg-white focus:outline-none focus:border-teal-800"
                >
                  <option value="Tất cả">Tất cả (3 Chương)</option>
                  <option value="Chương Mở đầu">Chương Mở đầu</option>
                  <option value="Chương 1">Chương 1: Cơ sở lý thuyết</option>
                  <option value="Chương 2">Chương 2: Phân tích & Thiết kế</option>
                  <option value="Chương 3">Chương 3: Thực nghiệm</option>
                  <option value="Chương Kết luận">Chương Kết luận & Hướng đi</option>
                </select>
              </div>
            </div>

            {/* Áp dụng Templates */}
            <div className="flex flex-col border-r border-slate-100 pr-4">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Mẫu cấu trúc</span>
              <div className="flex gap-1">
                {templates
                  .filter(t => selectedChapterFilter === 'Tất cả' || t.chapterTag === selectedChapterFilter)
                  .map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={`px-3.5 h-8 rounded text-[10px] font-black uppercase tracking-wider transition-colors ${
                        activeTemplateId === t.id 
                          ? 'bg-teal-800 text-white shadow-sm' 
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                      }`}
                      title={t.description}
                    >
                      {t.id === 'master_ch' ? 'Tất cả' : t.label.replace('Mẫu ', '')}
                    </button>
                  ))}
              </div>
            </div>

            {/* Thu phóng */}
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Thu phóng</span>
              <div className="flex items-center gap-1.5 h-8">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(70, z - 10))}
                  className="w-7 h-7 rounded hover:bg-slate-100 text-sm font-bold flex items-center justify-center border border-slate-200"
                >
                  −
                </button>
                <span className="text-[10px] font-black w-10 text-center text-slate-700">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(130, z + 10))}
                  className="w-7 h-7 rounded hover:bg-slate-100 text-sm font-bold flex items-center justify-center border border-slate-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin mẫu đang chọn */}
      {templates.find(t => t.id === activeTemplateId) && (
        <div className="bg-teal-50/60 border-b border-teal-100 px-6 py-2 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-800 text-base">info</span>
            <span className="font-medium text-slate-700">
              Đang viết theo mẫu: <strong className="text-teal-900">{templates.find(t => t.id === activeTemplateId).label}</strong>
            </span>
            <span className="text-[10px] text-slate-400">|</span>
            <span className="text-slate-500">
              Tối thiểu: <strong>{templates.find(t => t.id === activeTemplateId).minWords} từ</strong>
            </span>
            <span className="text-[10px] text-slate-400">|</span>
            <span className="text-slate-500">
              Đề mục bắt buộc: <code className="bg-white px-1.5 py-0.5 rounded border border-teal-100 text-[11px] font-bold text-teal-800">{templates.find(t => t.id === activeTemplateId).requiredSections?.join(', ')}</code>
            </span>
          </div>
          {latestSub && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px]">Trạng thái bài nộp:</span>
              {latestSub.teacherGraded ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  Giảng viên chấm: {latestSub.teacherGrade}/10
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  AI Đánh giá hoàn tất: {latestSub.aiScore}/10 (Tự động chấm bởi AI)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-2 md:p-8 bg-[#e8e6e3] relative flex justify-center items-start"
      >
        <div
          style={{
            width: `${unscaledWidth * finalScale}px`,
            height: `${pageHeight * finalScale}px`,
            overflow: 'hidden',
            position: 'relative',
          }}
          className="shrink-0 shadow-2xl transition-all duration-200"
        >
          <div
            ref={pageRef}
            className="bg-white transition-transform duration-200"
            style={{
              width: `${unscaledWidth}px`,
              minHeight: `${unscaledHeight}px`,
              transform: `scale(${finalScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={scheduleSave}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onClick={handleEditorClick}
              className={`word-playground-editor outline-none px-[2.5cm] py-[2.5cm] min-h-[24.7cm] text-[13pt] leading-[1.5] text-black ${
                isMultilevelActive ? 'multilevel-active' : ''
              }`}
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
              data-placeholder="Bắt đầu soạn đồ án của bạn tại đây... Hãy chèn các chương mẫu ở trên hoặc tự do sáng tạo đề mục!"
            />
          </div>
        </div>

        {/* Floating Image Editor Toolbar */}
        {selectedImage && (
          <div
            className="image-edit-toolbar absolute bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800 animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: `${imgToolbarPos.top}px`,
              left: `${imgToolbarPos.left}px`,
              zIndex: 100,
            }}
          >
            {/* Alignment controls */}
            <div className="flex items-center gap-0.5 border-r border-slate-700 pr-2">
              <button
                type="button"
                onClick={() => handleAlignImage('left')}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center"
                title="Căn trái"
              >
                <span className="material-symbols-outlined text-base">format_align_left</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlignImage('center')}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center"
                title="Căn giữa"
              >
                <span className="material-symbols-outlined text-base">format_align_center</span>
              </button>
              <button
                type="button"
                onClick={() => handleAlignImage('right')}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center"
                title="Căn phải"
              >
                <span className="material-symbols-outlined text-base">format_align_right</span>
              </button>
            </div>

            {/* Size controls */}
            <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
              <button
                type="button"
                onClick={() => handleResizeImage(50)}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold"
                title="Kích thước 50%"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleResizeImage(75)}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold"
                title="Kích thước 75%"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handleResizeImage(100)}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold"
                title="Kích thước 100%"
              >
                100%
              </button>
            </div>

            {/* Delete control */}
            <button
              type="button"
              onClick={handleDeleteImage}
              className="w-7 h-7 rounded hover:bg-red-500 hover:text-white text-red-400 flex items-center justify-center transition-colors"
              title="Xóa hình ảnh"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-[#185abd] text-white text-[10px] px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none z-10">
        <span className="font-medium">Khổ giấy A4 (Luyện tập) · Times New Roman</span>
        <span>
          <strong>{words}</strong> từ · <strong>{chars}</strong> ký tự
          {savedAt && (
            <span className="opacity-70 ml-2 font-light">
              · Tự động lưu nháp: {new Date(savedAt).toLocaleTimeString('vi-VN')}
            </span>
          )}
        </span>
      </div>

      {/* AI Grading Loader Overlay */}
      {isGrading && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse mb-6">
            <span className="material-symbols-outlined text-4xl text-slate-900 animate-spin">auto_awesome</span>
          </div>
          <h3 className="text-xl font-bold tracking-wide uppercase mb-2 text-yellow-300">Gemini AI Chấm điểm</h3>
          <p className="text-sm font-semibold tracking-wider opacity-90 h-6 animate-pulse text-center max-w-md px-6">
            {gradingStep}
          </p>
          <div className="w-64 h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 w-3/4 animate-[loading_2s_ease-in-out_infinite] rounded-full"></div>
          </div>
        </div>
      )}

      {/* Detailed Evaluation Modal */}
      {showGradeModal && gradeResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[2rem] border border-outline-variant shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in scale-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#185abd] to-slate-900 p-6 text-white flex justify-between items-center shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 shadow">
                  <span className="material-symbols-outlined text-2xl font-bold">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-[0.2em]">Báo cáo đánh giá AI</h3>
                  <p className="text-[10px] font-bold text-white/70 uppercase mt-0.5">{gradeResult.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGradeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Giảng viên đã chấm đè */}
              {gradeResult.teacherGraded && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow shrink-0">
                    <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Giảng viên đã đánh giá chính thức</h4>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{gradeResult.teacherGrade} / 10</p>
                    <p className="text-xs font-semibold text-slate-700 mt-2 leading-relaxed italic bg-white/80 p-3 rounded-lg border border-emerald-100">
                      &ldquo; {gradeResult.teacherFeedback || 'Chất lượng bài làm tốt, định dạng đều đặn.'} &rdquo;
                    </p>
                    <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                      {[
                        { label: 'Nội dung', val: gradeResult.teacherRubric?.content },
                        { label: 'Phương pháp', val: gradeResult.teacherRubric?.method },
                        { label: 'Tính mới', val: gradeResult.teacherRubric?.originality },
                        { label: 'Trình bày', val: gradeResult.teacherRubric?.presentation }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white p-1.5 rounded-lg border border-emerald-100/50">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{item.label}</p>
                          <p className="text-xs font-black text-emerald-700">{item.val || 8.0}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bảng điểm AI chính */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Vòng tròn điểm số */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Điểm AI Đề xuất</span>
                  <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-lg border-4 border-[#185abd]/10">
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-r-transparent animate-[spin_3s_linear_infinite]" />
                    <div className="text-center">
                      <span className="text-4xl font-black tracking-tight text-slate-900">{gradeResult.aiScore}</span>
                      <span className="text-xs font-semibold text-slate-400 block mt-1">/ 10</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-[#185abd] uppercase tracking-wider mt-4 px-3 py-1 bg-[#185abd]/10 rounded-full">
                    {gradeResult.aiScore >= 8.5 ? 'Xuất sắc' : gradeResult.aiScore >= 7.0 ? 'Khá tốt' : 'Cần cải thiện'}
                  </p>
                </div>

                {/* Chi tiết 4 tiêu chí của AI */}
                <div className="md:col-span-7 space-y-3.5">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Chi tiết tiêu chí</h4>
                  {[
                    { label: 'Cấu trúc & Đề mục (Method)', val: gradeResult.aiRubric.method, icon: 'schema', color: 'bg-blue-500' },
                    { label: 'Nội dung & Độ dài (Content)', val: gradeResult.aiRubric.content, icon: 'article', color: 'bg-emerald-500' },
                    { label: 'Định dạng & Trình bày (Presentation)', val: gradeResult.aiRubric.presentation, icon: 'border_color', color: 'bg-purple-500' },
                    { label: 'Văn phong chuyên môn (Originality)', val: gradeResult.aiRubric.originality, icon: 'lightbulb', color: 'bg-amber-500' }
                  ].map((rub, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-sm text-white p-0.5 rounded ${rub.color}`}>{rub.icon}</span>
                          {rub.label}
                        </span>
                        <span className="font-black text-[#185abd]">{rub.val} / 10</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${rub.color} rounded-full`} style={{ width: `${rub.val * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Đề xuất chi tiết từ AI */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-amber-500 text-sm">tips_and_updates</span>
                  Đề xuất chỉnh sửa của Gemini AI
                </h4>
                <div className="space-y-2.5">
                  {gradeResult.aiFeedback.map((f, i) => (
                    <div 
                      key={i} 
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                        f.type === 'success' 
                          ? 'bg-emerald-50/50 border-emerald-100 text-slate-700' 
                          : f.type === 'warning' 
                            ? 'bg-red-50/50 border-red-100 text-slate-700' 
                            : 'bg-blue-50/50 border-blue-100 text-slate-700'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                        f.type === 'success' ? 'text-emerald-600' : f.type === 'warning' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        {f.type === 'success' ? 'check_circle' : f.type === 'warning' ? 'warning' : 'info'}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-xs mb-0.5">{f.title}</p>
                        <p className="leading-relaxed font-medium">{f.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Đã ghi nhận bài nộp thử của bạn vào hệ thống lớp học.
              </span>
              <button
                type="button"
                onClick={() => setShowGradeModal(false)}
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow"
              >
                Đồng ý & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS CSS CSS */}
      <style>{`
        .word-playground-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .word-playground-editor h1 { font-size: 16pt; font-weight: bold; margin: 1em 0 0.5em; text-align: center; font-family: "Times New Roman", Times, serif; }
        .word-playground-editor h2 { font-size: 14pt; font-weight: bold; margin: 0.8em 0 0.4em; font-family: "Times New Roman", Times, serif; }
        .word-playground-editor p { margin: 0 0 0.6em; text-align: justify; font-family: "Times New Roman", Times, serif; }
        .word-playground-editor ul { margin: 0 0 0.6em 1.5em; list-style-type: disc; }
        .word-playground-editor ol { margin: 0 0 0.6em 1.5em; list-style-type: decimal; }
        .word-playground-editor img { max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 4px; border: 1px solid #ddd; }
        
        /* Chế độ đánh số nhiều cấp bằng CSS counter */
        .word-playground-editor.multilevel-active ol {
          counter-reset: item;
          list-style-type: none !important;
          margin-left: 0;
          padding-left: 1.5rem;
        }
        .word-playground-editor.multilevel-active ol > li {
          display: block;
          position: relative;
          margin-bottom: 0.25rem;
        }
        .word-playground-editor.multilevel-active ol > li::before {
          content: counters(item, ".") ". ";
          counter-increment: item;
          font-weight: bold;
          color: #1e293b;
          margin-right: 0.5rem;
        }
        
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
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
