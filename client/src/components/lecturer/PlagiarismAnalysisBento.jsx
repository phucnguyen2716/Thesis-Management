import React, { useState } from 'react';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { STATUS_CONFIG } from '../../data/lecturerMockData';
import { getPlagiarismThresholds } from '../../utils/adminContentStore';

const ACCENT = '#115e59';
const ACCENT_LIGHT = '#e6fffa';

const getPlagiarismSeverity = (percent) => {
  if (percent < 15) return { label: 'Thấp (Low)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (percent <= 30) return { label: 'Trung bình (Moderate)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (percent <= 50) return { label: 'Cao (High)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { label: 'Nghiêm trọng (Severe)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
};

const SimilarityRing = ({ percent }) => {
  const deg = Math.min(100, Math.max(0, percent)) * 3.6;
  const severity = getPlagiarismSeverity(percent);
  return (
    <div className="flex flex-col items-center gap-3 shrink-0 mx-auto sm:mx-0">
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full opacity-25"
          style={{
            background: `conic-gradient(from 180deg at 50% 50%, ${ACCENT} 0deg, ${ACCENT} ${deg}deg, ${ACCENT_LIGHT} ${deg}deg, ${ACCENT_LIGHT} 360deg)`,
          }}
        />
        <div className="w-[85%] h-[85%] rounded-full bg-white flex flex-col items-center justify-center border-4 border-teal-800 shadow-inner">
          <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-800">{percent}%</span>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
            Trùng lặp
          </span>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold border ${severity.color} tracking-wide text-center uppercase shadow-sm`}>
        Mức độ: {severity.label}
      </div>
    </div>
  );
};


const HeatmapGrid = ({ cells, sections }) => {
  const getCellBg = (opacity) => {
    if (!opacity || opacity <= 2) {
      return '#f1f5f9'; // off-white slate background for empty/0% cells
    }
    // Interpolated teal background
    return `rgba(17, 94, 89, ${Math.max(0.15, opacity / 100)})`;
  };

  return (
    <section className="col-span-full xl:col-span-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 flex flex-col w-full min-w-0 items-center justify-between">
      <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2 w-full">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bản đồ nhiệt Đạo văn</h3>
        <span className="material-symbols-outlined text-teal-800 shrink-0">{LECTURER_ICONS.ai}</span>
      </div>
      <div className="w-full max-w-[280px] grid grid-cols-10 gap-1.5 mx-auto py-2">
        {cells.map((opacity, i) => (
          <div
            key={i}
            className="rounded-md min-h-0 aspect-square shadow-sm transition-all hover:scale-110"
            style={{ backgroundColor: getCellBg(opacity) }}
            title={`Phân đoạn ${i + 1}: ${opacity}% trùng lặp`}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider gap-2 w-full pt-2 border-t border-slate-50">
        <span className="truncate">{sections[0] || 'Mở đầu'}</span>
        <span className="truncate text-right">{sections[sections.length - 1] || 'Kết luận'}</span>
      </div>
    </section>
  );
};

const highlightStudentText = (text, excerpt) => {
  const needle = (excerpt || '').replace(/^\.+|\.+$/g, '').slice(0, 80).trim();
  if (!needle || needle.length < 15) {
    return text.split('\n\n').map((p, i) => (
      <p key={i} className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">
        {p}
      </p>
    ));
  }
  const idx = text.toLowerCase().indexOf(needle.slice(0, 40).toLowerCase());
  if (idx === -1) {
    return text.split('\n\n').map((p, i) => (
      <p key={i} className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">
        {p}
      </p>
    ));
  }
  const before = text.slice(0, idx);
  const matchLen = Math.min(280, text.length - idx);
  const matched = text.slice(idx, idx + matchLen);
  const after = text.slice(idx + matchLen);
  return (
    <>
      {before && <p className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">{before}</p>}
      <p className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">
        <mark className="bg-teal-100 text-teal-900 border-b-2 border-teal-700 px-1 rounded-sm break-words">
          {matched}
        </mark>
      </p>
      {after && <p className="text-sm leading-relaxed text-slate-800">{after}</p>}
    </>
  );
};

const statusBadgeClass = status => {
  if (status === 'acceptable') {
    return 'bg-emerald-600 text-white shadow-sm ring-2 sm:ring-4 ring-emerald-100';
  }
  if (status === 'flagged') {
    return 'bg-red-600 text-white shadow-sm ring-2 sm:ring-4 ring-red-100';
  }
  return 'bg-amber-500 text-white shadow-sm ring-2 sm:ring-4 ring-amber-100';
};

const PlagiarismAnalysisBento = ({ submission, zoom = 100, onZoomIn, onZoomOut }) => {
  const statusCfg = STATUS_CONFIG[submission.status] || STATUS_CONFIG.review;
  const cells = submission.heatmapGrid || [];
  const thresholds = getPlagiarismThresholds();

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Heatmap HTML layout (A mini 10x6 grid for the document overview)
    const heatmapHtml = cells.length > 0 ? `
      <div style="margin-top: 15px; margin-bottom: 30px; page-break-inside: avoid;">
        <div style="font-size: 11px; font-weight: 800; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.08em; text-align: center;">Bản đồ nhiệt phân đoạn trùng lặp (Tài liệu 60 phân đoạn):</div>
        <div style="display: grid; grid-template-cols: repeat(10, 26px); gap: 6px; justify-content: center; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; width: fit-content; margin: 0 auto;">
          ${cells.map((val, idx) => {
            let bg = '#f1f5f9';
            if (val > 40) { bg = 'rgba(239, 68, 68, 0.85)'; } // red
            else if (val > 20) { bg = 'rgba(245, 158, 11, 0.85)'; } // amber
            else if (val > 2) { bg = 'rgba(17, 94, 89, ' + Math.max(0.2, val / 100) + ')'; } // teal
            return '<div style="background-color: ' + bg + '; width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.06);" title="Phân đoạn ' + (idx + 1) + ': ' + val + '%"></div>';
          }).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; max-width: 320px; margin: 6px auto 0 auto; letter-spacing: 0.05em;">
          <span>Mở đầu</span>
          <span>Kết luận</span>
        </div>
      </div>
    ` : '';

    const cleanUrl = (u) => u ? u.replace(/\/$/, '').toLowerCase() : '';
    const sourcesHtml = (submission.sources || [])
      .filter(src => {
        const isLocal = src.url && (src.url.startsWith('local-') || src.url.startsWith('/theses/') || src.url.startsWith('/uploads/'));
        return !isLocal;
      })
      .map((src, i) => {
      const linkUrl = src.url;
      const linkLabel = src.url;
      const badgeBg = i === 0 ? '#115e59' : '#0284c7';
      
      const sourceMatches = (submission.matches || matches || []).filter(m => {
        const mUrl = m.url || m.sourceUrl || '';
        return cleanUrl(mUrl) === cleanUrl(linkUrl);
      });

      let matchesHtmlSnippet = '';
      if (sourceMatches.length > 0) {
        matchesHtmlSnippet = `
          <div style="margin-top: 8px; padding: 8px 12px; background-color: #fcfcfc; border-left: 3px solid #0f766e; border-radius: 0 6px 6px 0; font-size: 11px; color: #475569;">
            ${sourceMatches.map((m, mIdx) => `
              <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; color: #0f766e; margin-bottom: 2px;">• Văn bản trùng khớp:</div>
                <div style="font-style: italic; background-color: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef3c7;">"${m.excerpt}"</div>
                ${m.sourceExcerpt ? `
                  <div style="font-weight: bold; color: #64748b; margin-top: 4px; margin-bottom: 2px;">• Trích dẫn từ nguồn:</div>
                  <div style="font-style: italic; background-color: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; color: #64748b;">"${m.sourceExcerpt}"</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 40px; vertical-align: top; padding-top: 12px;">${i + 1}</td>
          <td style="text-align: center; width: 80px; vertical-align: top; padding-top: 12px;">
            <span class="source-badge" style="background-color: ${badgeBg};">${src.percent}%</span>
          </td>
          <td style="vertical-align: top; padding-top: 12px; padding-bottom: 12px;">
            <div style="margin-top: 2px;">
              <a href="${linkUrl}" target="_blank" class="source-link" style="font-weight: 700; font-size: 13px;">${linkLabel}</a>
            </div>
            ${matchesHtmlSnippet}
          </td>
        </tr>
      `;
    }).join('');


    const matchesHtml = (submission.matches || []).map((m, idx) => {
      let highlightedStudentText = m.excerpt || m.studentExcerpt || m.text || '';
      const escapedExcerpt = highlightedStudentText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      return `
        <div class="match-card">
          <div class="match-header">
            <span class="match-id">MẪU ĐỐI CHIẾU TRÙNG KHỚP #${idx + 1}</span>
            <span class="match-score">Độ tương đồng: ${m.percent || m.similarity || 0}%</span>
          </div>
          
          <div class="match-text-title">Văn bản trong đồ án nộp</div>
          <div class="match-text-content">
            "${escapedExcerpt}"
          </div>
          
          <div class="match-text-title">Nội dung đối chiếu trong tài liệu gốc</div>
          <div class="source-excerpt">
            "${m.sourceExcerpt || 'Không trích xuất trực tiếp được từ nguồn gốc (phát hiện tương đồng ngữ nghĩa).'}"
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; margin-top: 8px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <div><strong style="color: #1e293b;">Nguồn đối chiếu:</strong> ${m.sourceTitle || m.sourceName || 'Tài liệu mạng xã hội / internet'}</div>
            ${m.url && m.url !== '#' ? `<div><strong style="color: #1e293b;">Đường dẫn:</strong> <a href="${m.url}" target="_blank" class="source-link" style="font-size: 11px;">${m.url}</a></div>` : ''}
            <div><strong style="color: #1e293b;">Phương pháp phát hiện:</strong> ${m.sourceMeta || (m.detectedBy ? (Array.isArray(m.detectedBy) ? m.detectedBy.join(', ') : m.detectedBy) : 'Semantic Match & N-Gram Search')}</div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo Đạo văn - ${submission.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              padding: 40px; 
              color: #0f172a; 
              line-height: 1.6; 
              background-color: #ffffff;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 4px solid #115e59; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .brand-section {
              text-align: left;
            }
            .university-title {
              font-size: 11px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 0;
            }
            .faculty-title {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin: 4px 0 0 0;
            }
            .system-tag {
              font-size: 10px;
              font-weight: 600;
              color: #0d9488;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-top: 4px;
            }
            .report-badge {
              background-color: #0f172a;
              color: #ffffff;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .title { 
              font-size: 24px; 
              font-weight: 800; 
              color: #115e59; 
              margin: 20px 0 5px 0; 
              text-align: center;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 13px;
              color: #475569;
              text-align: center;
              margin-bottom: 30px;
              font-weight: 500;
            }
            .meta-grid { 
              display: grid; 
              grid-template-cols: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 30px; 
              background-color: #f8fafc; 
              padding: 20px; 
              border-radius: 12px; 
              border: 1px solid #e2e8f0; 
            }
            .meta-item { 
              font-size: 13px; 
            }
            .meta-label { 
              font-weight: 700; 
              color: #64748b; 
              text-transform: uppercase; 
              font-size: 9px; 
              letter-spacing: 0.05em; 
            }
            .meta-value { 
              font-size: 13px; 
              color: #0f172a; 
              font-weight: 600; 
              margin-top: 4px; 
            }
            .score-container { 
              display: flex; 
              gap: 20px; 
              margin-bottom: 35px; 
            }
            .score-card { 
              flex: 1; 
              padding: 22px; 
              border-radius: 16px; 
              text-align: center; 
              color: white; 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .score-title { 
              font-size: 10px; 
              font-weight: 800; 
              text-transform: uppercase; 
              letter-spacing: 0.1em; 
              opacity: 0.9; 
            }
            .score-value { 
              font-size: 40px; 
              font-weight: 900; 
              margin: 8px 0; 
            }
            .score-status { 
              font-size: 10px; 
              font-weight: 800; 
              background: rgba(255, 255, 255, 0.2); 
              padding: 5px 12px; 
              border-radius: 20px; 
              display: inline-block; 
              letter-spacing: 0.05em;
            }
            .section-title { 
              font-size: 14px; 
              font-weight: 800; 
              text-transform: uppercase; 
              color: #115e59; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 6px; 
              margin-top: 35px;
              margin-bottom: 20px; 
              letter-spacing: 0.05em;
            }
            .source-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .source-table th {
              background-color: #f1f5f9;
              color: #475569;
              text-align: left;
              padding: 10px 12px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              border-bottom: 2px solid #e2e8f0;
            }
            .source-table td {
              padding: 12px;
              font-size: 12px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            .source-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              color: white;
              font-size: 11px;
              font-weight: 700;
            }
            .source-link {
              color: #0284c7;
              text-decoration: none;
              font-weight: 500;
              word-break: break-all;
            }
            .source-link:hover {
              text-decoration: underline;
            }
            .match-card { 
              margin-bottom: 20px; 
              padding: 16px; 
              border: 1px solid #e2e8f0; 
              border-radius: 12px; 
              background-color: #f8fafc;
              page-break-inside: avoid;
            }
            .match-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
            }
            .match-id { 
              font-size: 11px; 
              font-weight: 800; 
              color: #115e59; 
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .match-score {
              font-size: 11px;
              font-weight: 700;
              color: #ef4444;
              background-color: #fee2e2;
              padding: 2px 8px;
              border-radius: 12px;
            }
            .match-text-title {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 4px;
              letter-spacing: 0.02em;
            }
            .match-text-content { 
              font-size: 12px; 
              color: #1e293b; 
              margin-bottom: 12px;
              background-color: #ffffff;
              padding: 10px;
              border-radius: 6px;
              border-left: 3px solid #cbd5e1;
            }
            .match-text-content mark {
              background-color: #ccfbf1;
              color: #115e59;
              font-weight: 600;
            }
            .source-excerpt { 
              font-size: 12px; 
              font-style: italic; 
              color: #475569; 
              margin-bottom: 12px;
              background-color: #ffffff;
              padding: 10px;
              border-radius: 6px;
              border-left: 3px solid #0284c7;
            }
            .match-meta { 
              font-size: 11px; 
              font-weight: 600; 
              color: #334155; 
              margin-top: 8px;
            }
            .match-url {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
              word-break: break-all;
            }
            .footer-sig-container {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 40px;
              margin-top: 60px;
              text-align: center;
              page-break-inside: avoid;
            }
            .sig-title {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              margin-bottom: 60px;
            }
            .sig-name {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand-section">
              <h4 class="university-title">Trường Đại học Kinh tế - Tài chính TP.HCM (UEF)</h4>
              <h3 class="faculty-title">${submission.faculty || 'Khoa Công nghệ thông tin'}</h3>
              <div class="system-tag">Hệ thống Quản lý khóa luận eThesis</div>
            </div>
            <div class="report-badge">Bản xác thực báo cáo</div>
          </div>
          
          <h1 class="title">Báo cáo Phân tích Trùng lặp & Đạo văn</h1>
          <p class="subtitle">Được cấp tự động bởi trợ lý AI học thuật eThesis</p>
          
          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Đề tài đồ án</div>
              <div class="meta-value">${submission.title}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Sinh viên thực hiện</div>
              <div class="meta-value">${submission.student} (${submission.studentId})</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Trạng thái ghi nhận</div>
              <div class="meta-value" style="color: ${submission.similarity > 40 ? '#dc2626' : submission.similarity > 20 ? '#d97706' : '#16a34a'}">
                ${statusCfg.label}
              </div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Ngày thực hiện quét</div>
              <div class="meta-value">${new Date().toLocaleString('vi-VN')}</div>
            </div>
          </div>

          <div class="score-container">
            <div class="score-card" style="background-color: #115e59;">
              <div class="score-title">Tỷ lệ tương đồng tổng thể</div>
              <div class="score-value">${submission.similarity}%</div>
              <div class="score-status">MỨC ĐỘ: ${submission.similarity < 15 ? 'THẤP (LOW)' : submission.similarity <= 30 ? 'TRUNG BÌNH (MODERATE)' : submission.similarity <= 50 ? 'CAO (HIGH)' : 'NGHIÊM TRỌNG (SEVERE)'}</div>
            </div>
            <div class="score-card" style="background-color: #0ea5e9;">
              <div class="score-title">Nội dung tạo bởi AI</div>
              <div class="score-value">${submission.aiPercent}%</div>
              <div class="score-status">${submission.aiPercent > 20 ? 'CẢNH BÁO AI' : 'MỨC CHẤP NHẬN'}</div>
            </div>
          </div>

          ${heatmapHtml}

          <div class="section-title">Danh sách nguồn trùng khớp chính</div>
          <table class="source-table">
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">STT</th>
                <th style="text-align: center; width: 80px;">Tỷ lệ</th>
                <th>Thông tin nguồn đối chiếu</th>
              </tr>
            </thead>
            <tbody>
              ${sourcesHtml}
            </tbody>
          </table>

          <div class="section-title" style="page-break-before: always;">Chi tiết các phân đoạn trùng khớp phát hiện</div>
          <div>
            ${matchesHtml}
          </div>

          <div class="footer-sig-container">
            <div>
              <div class="sig-title">Giảng viên hướng dẫn phản hồi</div>
              <div class="sig-name" style="margin-top: 50px;">TS. Nguyễn Minh Trí</div>
            </div>
            <div>
              <div class="sig-title">Trưởng Bộ môn / Hội đồng phê duyệt</div>
              <div class="sig-name" style="margin-top: 50px;">(Ký và ghi rõ họ tên)</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const matches = React.useMemo(() => {
    if (submission.matches && submission.matches.length > 0) {
      return submission.matches;
    }
    const reportMatches = submission.report?.matches;
    if (reportMatches && reportMatches.length > 0) {
      return reportMatches.map((m, idx) => ({
        label: m.label || `Nguồn #${idx + 1}`,
        excerpt: m.studentExcerpt || m.text || '',
        sourceTitle: m.sourceName || m.sourceTitle || 'Web source',
        sourceMeta: m.detectedBy ? m.detectedBy.join(', ') : 'Nguồn Internet',
        url: m.sourceUrl || m.url || '#',
        percent: m.similarity || 0,
      }));
    }
    return submission.match ? [submission.match] : [];
  }, [submission]);

  const [activeMatchIdx, setActiveMatchIdx] = React.useState(0);

  React.useEffect(() => {
    setActiveMatchIdx(0);
  }, [submission.id]);

  const activeMatch = matches[activeMatchIdx] || submission.match || {
    label: 'Nguồn tham chiếu',
    excerpt: '',
    sourceTitle: 'Không có dữ liệu',
    sourceMeta: '',
    url: '#',
    percent: 0
  };

  // State for request to admin
  const [submittedRequests, setSubmittedRequests] = React.useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
      const mapping = {};
      list.forEach(r => {
        mapping[r.submissionId] = r;
      });
      return mapping;
    } catch {
      return {};
    }
  });

  const loadRequests = () => {
    try {
      const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
      const mapping = {};
      list.forEach(r => {
        mapping[r.submissionId] = r;
      });
      setSubmittedRequests(mapping);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    window.addEventListener('admin-content-updated', loadRequests);
    window.addEventListener('storage', loadRequests);
    return () => {
      window.removeEventListener('admin-content-updated', loadRequests);
      window.removeEventListener('storage', loadRequests);
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState('ignore');
  const [customNote, setCustomNote] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [toast, setToast] = useState(null);

  const handleOpenModal = () => {
    setSelectedCase('ignore');
    setCustomNote('');
    setIsUrgent(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "TS. Nguyễn Minh Trí"}');
    const newRequest = {
      id: `req-${Date.now()}`,
      submissionId: submission.id,
      title: submission.title,
      student: submission.student,
      lecturer: user.fullName || 'TS. Nguyễn Minh Trí',
      caseType: selectedCase,
      customNote: customNote,
      isUrgent,
      timestamp: new Date().toLocaleString('vi-VN'),
      isRead: false,
      similarity: submission.similarity,
      aiPercent: submission.aiPercent,
      words: submission.words,
      sourceCount: submission.sourceCount,
      topSource: submission.match ? submission.match.sourceTitle : 'Không rõ nguồn',
      topSourcePercent: submission.match ? submission.match.percent : 0,
      matchExcerpt: submission.match ? submission.match.excerpt : ''
    };

    const currentRequests = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
    currentRequests.push(newRequest);
    localStorage.setItem('lecturer_plagiarism_requests', JSON.stringify(currentRequests));

    setSubmittedRequests(prev => ({
      ...prev,
      [submission.id]: newRequest
    }));
    setIsModalOpen(false);

    // Dispatch event to sync state immediately
    window.dispatchEvent(new Event('admin-content-updated'));

    setToast({
      message: 'Đã gửi yêu cầu đối chiếu & xử lý đạo văn tới Admin!',
      type: 'success'
    });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 [&>*]:min-w-0 animate-in fade-in duration-500">
      {/* Summary — col-span-full = 100% width; xl:col-span-8 = 2/3 row */}
      <section className="col-span-full xl:col-span-8 w-full min-w-0 bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6 lg:gap-8 w-full">
          <SimilarityRing percent={submission.similarity} />
          <div className="flex-1 w-full min-w-0 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="w-full min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-snug break-words">
                  {submission.title}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 break-words">
                  Bản nộp #{submission.submissionNum} · {submission.checkedAgo} · {submission.student}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {(() => {
                  const req = submittedRequests[submission.id];
                  if (req && req.isProcessed && req.decision === 'Approved') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap bg-emerald-600 text-white shadow-sm border border-emerald-500">
                        <span className="material-symbols-outlined" style={{ fontSize: '12.5px' }}>verified</span>
                        <span>ĐÃ ĐẶC CÁCH PHÊ DUYỆT (PUBLISHED)</span>
                      </span>
                    );
                  }
                  if (req && req.isProcessed && req.decision === 'Revision') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap bg-orange-500 text-white shadow-sm border border-orange-400">
                        <span className="material-symbols-outlined" style={{ fontSize: '12.5px' }}>edit_note</span>
                        <span>ADMIN YÊU CẦU SỬA ĐỔI</span>
                      </span>
                    );
                  }
                  if (req && req.isProcessed && req.decision === 'Rejected') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap bg-rose-600 text-white shadow-sm border border-rose-500">
                        <span className="material-symbols-outlined" style={{ fontSize: '12.5px' }}>cancel</span>
                        <span>ADMIN TỪ CHỐI / HỦY BỎ</span>
                      </span>
                    );
                  }
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${statusBadgeClass(submission.status)}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified</span>
                      <span>{statusCfg.label}</span>
                    </span>
                  );
                })()}

                {/* Send Request to Admin / Processed Status Badge */}
                {(() => {
                  const req = submittedRequests[submission.id];
                  if (req) {
                    if (!req.isProcessed) {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500 shadow-sm">
                          <span className="material-symbols-outlined text-[12px] text-slate-400 animate-pulse">hourglass_empty</span>
                          Đang chờ Admin duyệt
                        </span>
                      );
                    } else {
                      if (req.decision === 'Approved') {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
                            <span className="material-symbols-outlined text-[12px] text-emerald-500">check_circle</span>
                            Yêu cầu đã được Admin phê duyệt (Đặc cách xuất bản)
                          </span>
                        );
                      } else if (req.decision === 'Revision') {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-orange-50 border border-orange-100 text-orange-700 shadow-sm animate-pulse">
                            <span className="material-symbols-outlined text-[12px] text-orange-500">warning</span>
                            Yêu cầu sửa đổi đề tài từ Admin
                          </span>
                        );
                      } else {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-700 shadow-sm">
                            <span className="material-symbols-outlined text-[12px] text-rose-500">cancel</span>
                            Đã bị từ chối / Không được xuất bản
                          </span>
                        );
                      }
                    }
                  }

                  if (submission.status === 'review' || submission.status === 'flagged') {
                    return (
                      <button
                        type="button"
                        onClick={handleOpenModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                        Gửi yêu cầu Admin
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-3 border-t border-slate-100 w-full">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Số từ đã quét
                </span>
                <span className="text-base sm:text-xl font-semibold text-slate-900">
                  {submission.words.toLocaleString()}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Văn bản do AI tạo
                </span>
                <span className="text-base sm:text-xl font-semibold text-sky-600">{submission.aiPercent}%</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Ngưỡng admin: {thresholds.aiReview}% / {thresholds.aiFlag}%
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Nguồn trùng khớp
                </span>
                <span className="text-base sm:text-xl font-semibold text-slate-900">
                  {submission.sourceCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HeatmapGrid cells={cells} sections={submission.sections} />

      {/* Comparison */}
      <section className="col-span-full xl:col-span-8 w-full min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden w-full">
          <div className="flex flex-wrap border-b border-slate-200 p-3 sm:p-4 justify-between items-center gap-2 bg-slate-50/80">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 bg-teal-800/10 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-teal-800 text-sm font-bold">
                  {LECTURER_ICONS.analysis}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-wide uppercase truncate">
                Chi tiết Phân tích Đạo văn
              </span>
            </div>
            <div className="flex gap-1 bg-white/80 p-1 rounded-full border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={onZoomOut}
                className="material-symbols-outlined text-slate-500 hover:text-teal-800 p-1 text-xl"
              >
                zoom_out
              </button>
              <span className="text-[10px] font-bold text-slate-400 self-center px-1 min-w-[2.5rem] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={onZoomIn}
                className="material-symbols-outlined text-slate-500 hover:text-teal-800 p-1 text-xl"
              >
                zoom_in
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[240px] sm:min-h-[320px] lg:min-h-[420px] max-h-[50vh] sm:max-h-[55vh] lg:max-h-[520px]">
            <div
              className="p-4 sm:p-6 overflow-y-auto text-sm leading-relaxed text-slate-800 min-h-[200px] md:min-h-0"
              style={{ fontSize: `${zoom}%` }}
            >
              {highlightStudentText(submission.studentText, activeMatch.excerpt)}
            </div>
            <div
              className="p-4 sm:p-6 overflow-y-auto text-sm leading-relaxed bg-slate-50/50 min-h-[200px] md:min-h-0 flex flex-col"
              style={{ fontSize: `${zoom}%` }}
            >
              {/* Nguồn Selector Tabs */}
              {matches.length > 1 && (
                <div className="flex gap-1.5 flex-wrap mb-4 pb-3 border-b border-slate-200">
                  {matches.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveMatchIdx(i)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeMatchIdx === i
                          ? 'bg-teal-800 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50'
                      }`}
                    >
                      Nguồn {i + 1} · {m.percent}%
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-3 sm:mb-4 p-2 bg-teal-50 rounded border-l-4 border-teal-800">
                <span className="text-xs text-teal-900 font-bold break-words">
                  PHÁT HIỆN TRÙNG KHỚP: {activeMatch.label} ({activeMatch.percent}%)
                </span>
              </div>
              <p className="italic text-slate-600 mb-4 sm:mb-6 leading-relaxed break-words">
                {activeMatch.excerpt}
              </p>
              <div className="p-3 sm:p-4 border border-slate-200 rounded-lg bg-white mt-auto">
                <h4 className="text-xs font-bold text-slate-800 mb-2">So sánh nguồn trùng lặp</h4>
                <p className="text-xs text-slate-700 break-words">{activeMatch.sourceTitle}</p>
                <p className="text-xs text-slate-500 mt-1 break-words">{activeMatch.sourceMeta}</p>
                {activeMatch.url && (
                  <a
                    href={activeMatch.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 text-xs flex items-center gap-1 mt-3 hover:underline font-medium"
                  >
                    Xem tài liệu gốc
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sources + AI */}
      <section className="col-span-full xl:col-span-4 w-full min-w-0 space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/60 w-full space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            Danh sách nguồn trùng khớp chính
          </h3>
          <div className="space-y-3">
            {(submission.sources || [])
              .filter(src => {
                const isLocal = src.url && (src.url.startsWith('local-') || src.url.startsWith('/theses/') || src.url.startsWith('/uploads/'));
                return !isLocal;
              })
              .map((src, i) => {
              const linkUrl = src.url;
              const linkLabel = src.url;
              const cleanUrl = (u) => u ? u.replace(/\/$/, '').toLowerCase() : '';
              const sourceMatches = matches.filter(m => {
                const mUrl = m.url || m.sourceUrl || '';
                return cleanUrl(mUrl) === cleanUrl(linkUrl);
              });
              const sourceName = src.name || src.title || (sourceMatches.length > 0 ? sourceMatches[0].sourceTitle : '') || 'Nguồn Web';

              return (
                <div
                  key={src.id || i}
                  className="flex flex-col gap-2.5 p-4 rounded-xl border border-teal-100/80 bg-[#f0fdfa] shadow-sm transition-all hover:shadow-md min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#004d40] text-white shrink-0 font-extrabold text-xs shadow-inner">
                      <span>{src.percent}%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {sourceName && (
                        <h4 className="text-xs font-black text-slate-800 mb-0.5 line-clamp-1" title={sourceName}>
                          {sourceName}
                        </h4>
                      )}
                      {src.url && src.url !== '#' && src.url !== '—' ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#0284c7] hover:text-[#0369a1] hover:underline flex items-center gap-1 break-all"
                          title={linkLabel}
                        >
                          <span className="break-all">{linkLabel}</span>
                          <span className="material-symbols-outlined text-xs shrink-0 text-[#0284c7]">open_in_new</span>
                        </a>
                      ) : (
                        <p className="text-[11px] font-bold text-slate-800 break-all" title={src.url || '—'}>{src.url || '—'}</p>
                      )}
                    </div>
                  </div>

                  {/* Matched Excerpts Box */}
                  {sourceMatches.length > 0 && (
                    <div className="mt-1 bg-white/75 border border-teal-50 rounded-lg p-2.5 space-y-3">
                      {sourceMatches.map((m, mIdx) => (
                        <div key={mIdx} className="text-[11px] text-slate-600 leading-relaxed">
                          <div className="font-bold text-teal-800 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            Văn bản trùng khớp trong bài nộp:
                          </div>
                          <p className="italic bg-amber-50/70 border-l-2 border-amber-400 pl-2.5 py-1 rounded-r font-medium text-slate-700">
                            "{m.excerpt}"
                          </p>
                          {m.sourceExcerpt && m.sourceExcerpt !== m.excerpt && (
                            <div className="mt-2">
                              <div className="font-bold text-slate-500 mb-0.5">Trích dẫn từ nguồn:</div>
                              <p className="italic bg-slate-50 border-l-2 border-slate-400 pl-2.5 py-1 rounded-r text-slate-500">
                                "{m.sourceExcerpt}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full mt-4 py-3 bg-white hover:bg-sky-50 border-2 border-[#0284c7] text-[#0284c7] text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg text-[#0284c7]">arrow_circle_down</span>
            Tải báo cáo chi tiết (PDF)
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/80 w-full">
          <h3 className="text-xs font-bold text-sky-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <span className="material-symbols-outlined text-sm">{LECTURER_ICONS.suggestion}</span>
            Gợi ý từ AI
          </h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {submission.similarity > 25
              ? 'Nhiều đoạn trùng khớp với nguồn đã xuất bản. Yêu cầu sinh viên trích dẫn hoặc diễn đạt lại trước khi chốt điểm.'
              : 'Hai đoạn có cấu trúc tương tự tài liệu tham khảo. Cân nhắc thêm trích dẫn trực tiếp để tránh bị gắn cờ.'}
          </p>
          <button
            type="button"
            className="bg-sky-600 text-white px-4 py-2.5 text-xs rounded-full w-full font-bold hover:shadow-md transition-shadow"
          >
            Công cụ tự động Trích dẫn
          </button>
        </div>
      </section>

      {/* ── Admin Request Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-700/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-300 text-xl">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-teal-300">Yêu cầu Admin xét duyệt</h3>
                  <p className="text-[10px] text-white/50 uppercase mt-0.5 tracking-wider">Đối chiếu chéo &amp; Phê duyệt đặc cách</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseModal} 
                className="material-symbols-outlined text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tên Đồ án / Khóa luận</label>
                <p className="text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                  {submission.title}
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chọn tình huống cần hỗ trợ</label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'ignore',
                      label: 'Bỏ qua & Phê duyệt đặc cách',
                      desc: 'Hệ thống nhận diện trùng lặp sai nguồn, hoặc tài liệu nghiên cứu đặc thù được UEF cấp phép đặc cách.',
                      icon: 'check_circle',
                      colorCls: 'text-emerald-600',
                      bgCls: 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50',
                      activeCls: 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50'
                    },
                    {
                      value: 'deep',
                      label: 'Yêu cầu đối chiếu sâu (Deep scan)',
                      desc: 'Cần đối chiếu nâng cao với các dữ liệu offline, bài nộp cũ hoặc lưu trữ nội bộ chưa được số hóa trực tuyến.',
                      icon: 'database',
                      colorCls: 'text-blue-600',
                      bgCls: 'bg-blue-50/50 border-blue-100 hover:bg-blue-50',
                      activeCls: 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50'
                    },
                    {
                      value: 'discipline',
                      label: 'Báo cáo vi phạm / Hội đồng kỷ luật',
                      desc: 'Đạo văn nghiêm trọng vượt mức giới hạn cho phép sửa chữa, chuyển hội đồng khoa học xử lý đình chỉ đề tài.',
                      icon: 'gavel',
                      colorCls: 'text-rose-600',
                      bgCls: 'bg-rose-50/50 border-rose-100 hover:bg-rose-50',
                      activeCls: 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50'
                    }
                  ].map((item) => {
                    const isSelected = selectedCase === item.value;
                    return (
                      <div
                        key={item.value}
                        onClick={() => setSelectedCase(item.value)}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected ? item.activeCls : item.bgCls
                        }`}
                      >
                        <span className={`material-symbols-outlined mt-0.5 ${item.colorCls}`}>
                          {item.icon}
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-black text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{item.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-teal-800 bg-teal-800' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Lý do / Ghi chú lý giải</label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 focus:bg-white transition-all resize-none"
                  placeholder="Nhập lý giải chi tiết cho Admin..."
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider leading-none">Độ ưu tiên xử lý</span>
                  <span className="text-[9px] text-slate-400 mt-1">Chọn nếu cần Admin xử lý gấp trong 24h</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
                >
                  Xác nhận gửi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ─────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 right-4 md:right-8 z-[1000] flex items-center gap-3 px-5 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-none">{toast.message}</span>
            <span className="text-[9px] text-white/50 uppercase tracking-widest mt-1">Hệ thống đã ghi nhận thành công</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlagiarismAnalysisBento;
