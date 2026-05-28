import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import {
  loadTemplates,
  saveTemplates,
  loadPracticeSubmissions,
  gradePracticeSubmission,
  deletePracticeSubmission
} from '../../utils/thesisPracticeTemplates';

const LecturerPracticeManagerPage = () => {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'submissions'
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // States cho Form chỉnh sửa / thêm mẫu mới
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHtml, setFormHtml] = useState('');
  const [formMinWords, setFormMinWords] = useState(150);
  const [formRequiredSections, setFormRequiredSections] = useState('');

  // States cho Form chấm điểm bài làm sinh viên
  const [selectedSub, setSelectedSub] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [teacherGrade, setTeacherGrade] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [teacherRubric, setTeacherRubric] = useState({ content: 8, method: 8, originality: 8, presentation: 8 });

  const loadAllData = () => {
    setTemplates(loadTemplates());
    setSubmissions(loadPracticeSubmissions().sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    loadAllData();
    window.addEventListener('practice-submissions-updated', loadAllData);
    window.addEventListener('practice-templates-updated', loadAllData);
    return () => {
      window.removeEventListener('practice-submissions-updated', loadAllData);
      window.removeEventListener('practice-templates-updated', loadAllData);
    };
  }, []);

  // Mở form thêm mới template
  const handleAddTemplateClick = () => {
    setEditingTemplate(null);
    setFormLabel('Chương 4. ĐÁNH GIÁ HIỆU NĂNG');
    setFormDescription('Khung đánh giá hiệu năng hệ thống, so sánh tham chiếu các phương án.');
    setFormHtml(`<h1 style="text-align:center">CHƯƠNG 4. ĐÁNH GIÁ HIỆU NĂNG</h1>
<p><strong>4.1. Kịch bản kiểm thử hiệu năng</strong></p>
<p>Nội dung mô tả các bước đo lường thời gian phản hồi, dung lượng bộ nhớ...</p>
<p><strong>4.2. Số liệu so sánh chi tiết</strong></p>
<p>Trình bày bảng biểu đối chiếu giữa giải pháp mới và cũ...</p>`);
    setFormMinWords(180);
    setFormRequiredSections('CHƯƠNG 4, 4.1, 4.2');
    setShowTemplateForm(true);
  };

  // Mở form chỉnh sửa template
  const handleEditTemplateClick = (tpl) => {
    setEditingTemplate(tpl);
    setFormLabel(tpl.label);
    setFormDescription(tpl.description || '');
    setFormHtml(tpl.html || '');
    setFormMinWords(tpl.minWords || 150);
    setFormRequiredSections(tpl.requiredSections ? tpl.requiredSections.join(', ') : '');
    setShowTemplateForm(true);
  };

  // Lưu Template (Thêm/Sửa)
  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    const sectionsArray = formRequiredSections
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let updatedTemplates = [...templates];

    if (editingTemplate) {
      // Sửa
      updatedTemplates = updatedTemplates.map(t => 
        t.id === editingTemplate.id 
          ? { 
              ...t, 
              label: formLabel, 
              description: formDescription, 
              html: formHtml, 
              minWords: Number(formMinWords), 
              requiredSections: sectionsArray 
            } 
          : t
      );
    } else {
      // Thêm mới
      const newTpl = {
        id: `tpl-${Date.now()}`,
        label: formLabel,
        description: formDescription,
        html: formHtml,
        minWords: Number(formMinWords),
        requiredSections: sectionsArray
      };
      updatedTemplates.push(newTpl);
    }

    saveTemplates(updatedTemplates);
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  // Xóa template
  const handleDeleteTemplate = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa template này không?')) return;
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);
  };

  // Reset templates mặc định
  const handleResetTemplates = () => {
    if (!window.confirm('Bạn có muốn khôi phục danh sách các template mặc định (gồm Chương 1, 2, 3)? Toàn bộ template tùy chỉnh sẽ bị ghi đè.')) return;
    localStorage.removeItem('thesisPracticeTemplates');
    loadAllData();
  };

  // Mở modal chấm điểm bài nộp
  const handleGradeClick = (sub) => {
    setSelectedSub(sub);
    setTeacherGrade(sub.teacherGrade !== null ? sub.teacherGrade : sub.aiScore);
    setTeacherFeedback(sub.teacherFeedback || '');
    setTeacherRubric(sub.teacherRubric || {
      content: sub.aiRubric?.content || 8,
      method: sub.aiRubric?.method || 8,
      originality: sub.aiRubric?.originality || 8,
      presentation: sub.aiRubric?.presentation || 8
    });
    setShowGradingModal(true);
  };

  // Lưu điểm số giảng viên chấm
  const handleSaveGrade = () => {
    if (!selectedSub) return;
    const grade = Number(teacherGrade);
    if (isNaN(grade) || grade < 0 || grade > 10) {
      alert('Điểm số phải nằm trong khoảng từ 0 đến 10!');
      return;
    }

    gradePracticeSubmission(selectedSub.id, {
      teacherGrade: grade,
      teacherFeedback: teacherFeedback,
      teacherRubric: teacherRubric
    });

    setShowGradingModal(false);
    setSelectedSub(null);
  };

  // Xóa bài nộp sinh viên
  const handleDeleteSub = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài nộp này không?')) return;
    deletePracticeSubmission(id);
  };

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-teal-700 uppercase tracking-[0.2em] mb-1">
            Luyện tập & Soạn thảo
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Quản lý Luyện tập đồ án</h1>
          <p className="text-xs text-slate-500 mt-1 break-words">
            <Link to="/lecturer" className="text-teal-800 hover:underline font-medium">
              Trang chủ GV
            </Link>
            <span className="text-slate-300 mx-1">/</span>
            <span>Quản lý Mẫu chương & Chấm điểm nháp A4</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'templates' && (
            <>
              <button
                type="button"
                onClick={handleResetTemplates}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={handleAddTemplateClick}
                className="px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-teal-900 flex items-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Thêm mẫu mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-teal-800 text-teal-800 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-sm">edit_document</span>
          Quản lý Mẫu đề tài ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'border-teal-800 text-teal-800 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-sm">rate_review</span>
          Bài nộp sinh viên ({submissions.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {activeTab === 'templates' ? (
          /* TAB 1: QUẢN LÝ TEMPLATES */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {templates.map(tpl => (
              <div 
                key={tpl.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full font-bold text-[9px] uppercase tracking-wider border border-teal-100">
                      Mẫu Chương
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Tối thiểu {tpl.minWords} từ
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight">{tpl.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{tpl.description}</p>
                  
                  {/* Barem mục yêu cầu */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] mb-4">
                    <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-teal-800">task_alt</span>
                      Đề mục bắt buộc AI sẽ chấm:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tpl.requiredSections?.map(s => (
                        <code key={s} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-600">{s}</code>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => handleEditTemplateClick(tpl)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                    Sửa mẫu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80">
                <span className="material-symbols-outlined text-4xl text-slate-300">drafts</span>
                <p className="text-slate-500 text-xs mt-2 font-bold">Chưa có template mẫu nào. Hãy thêm mới hoặc khôi phục mặc định.</p>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: BÀI NỘP CỦA SINH VIÊN */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Sinh viên</th>
                    <th className="px-6 py-4">Chương luyện tập</th>
                    <th className="px-6 py-4">Số từ</th>
                    <th className="px-6 py-4 text-center">Điểm AI</th>
                    <th className="px-6 py-4 text-center">Điểm GV</th>
                    <th className="px-6 py-4">Ngày nộp</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{sub.studentName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.studentId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{sub.title}</div>
                        <div className="text-[10px] text-teal-800 font-semibold mt-0.5">{sub.templateLabel}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{sub.words} từ</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 rounded font-bold border border-yellow-200">
                          {sub.aiScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sub.teacherGraded ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                            {sub.teacherGrade}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded font-bold">
                            Chưa chấm
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(sub.updatedAt).toLocaleDateString('vi-VN')} {new Date(sub.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleGradeClick(sub)}
                          className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">rate_review</span>
                          Xem & Chấm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSub(sub.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors inline-flex items-center"
                          title="Xóa bài nộp"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-slate-500 font-bold">
                        <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">inbox</span>
                        Chưa có sinh viên nào nộp bài luyện tập.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: THÊM / SỬA TEMPLATE MẪU ĐỀ TÀI */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in scale-in-95 duration-200">
            <div className="bg-teal-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {editingTemplate ? 'Chỉnh sửa mẫu chương' : 'Thêm mẫu chương mới'}
              </h3>
              <button 
                onClick={() => setShowTemplateForm(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveTemplate} className="p-6 md:p-8 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tên chương / Mẫu đề tài</label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={e => setFormLabel(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/10 focus:border-teal-800"
                  placeholder="Ví dụ: Chương 1. TỔNG QUAN LÝ THUYẾT"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mô tả định hướng viết bài</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-800/10 focus:border-teal-800"
                  placeholder="Tóm tắt yêu cầu chính của chương..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Số từ tối thiểu</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={formMinWords}
                    onChange={e => setFormMinWords(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/10 focus:border-teal-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1" title="Ngăn cách bằng dấu phẩy">
                    Đề mục bắt buộc (AI kiểm tra)
                  </label>
                  <input
                    type="text"
                    value={formRequiredSections}
                    onChange={e => setFormRequiredSections(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/10 focus:border-teal-800"
                    placeholder="Ví dụ: 1.1, 1.2, 1.3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nội dung HTML mẫu cấu trúc sẵn</label>
                <textarea
                  rows={6}
                  value={formHtml}
                  onChange={e => setFormHtml(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-800/10 focus:border-teal-800"
                  placeholder="Nhập mã HTML hoặc văn bản thô mẫu..."
                />
                <span className="text-[10px] text-slate-400 block mt-1">Hỗ trợ các thẻ tiêu chuẩn: &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ol&gt;, &lt;li&gt;.</span>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTemplateForm(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM CHI TIẾT BÀI SOẠN THẢO VÀ CHẤM ĐIỂM */}
      {showGradingModal && selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-hidden animate-fade-in">
          <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col animate-in scale-in-95 duration-200 border border-slate-200">
            {/* Header */}
            <div className="bg-teal-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">rate_review</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Xem bài viết & Chấm điểm luyện tập</h3>
                  <p className="text-[10px] text-teal-200 mt-0.5">Sinh viên: <strong>{selectedSub.studentName}</strong> ({selectedSub.studentId}) · Đề tài: <strong>{selectedSub.title}</strong></p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowGradingModal(false);
                  setSelectedSub(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Main content grid */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
              {/* CỘT TRÁI: KHUNG TRANG IN A4 ĐỒ ÁN SINH VIÊN */}
              <div className="flex-1 bg-[#dcdcdc] overflow-y-auto p-4 md:p-6 flex justify-center border-r border-slate-200">
                <div 
                  className="bg-white shadow-lg px-[2.5cm] py-[2.5cm] text-[13pt] leading-[1.5] text-black w-[21cm] min-h-[29.7cm] h-fit font-serif border border-slate-300"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                  dangerouslySetInnerHTML={{ __html: selectedSub.html }}
                />
              </div>

              {/* CỘT PHẢI: BẢNG CHẤM ĐIỂM VÀ ĐÁNH GIÁ AI */}
              <div className="w-full lg:w-[480px] bg-white overflow-y-auto p-6 md:p-8 space-y-6 shrink-0 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Báo cáo thống kê AI */}
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                    <h4 className="text-xs font-black text-teal-900 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      Kết quả từ AI tự động
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex flex-col items-center justify-center font-bold">
                        <span className="text-[9px] uppercase leading-none opacity-80">Score</span>
                        <span className="text-base font-black mt-0.5">{selectedSub.aiScore}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                        Số từ đếm được: <strong className="text-slate-800">{selectedSub.words} từ</strong>
                        <div className="mt-1 flex gap-2 flex-wrap">
                          <span className="bg-white px-1.5 py-0.5 rounded border border-teal-100 text-[10px]">Cấu trúc: {selectedSub.aiRubric?.method}/10</span>
                          <span className="bg-white px-1.5 py-0.5 rounded border border-teal-100 text-[10px]">Văn phong: {selectedSub.aiRubric?.originality}/10</span>
                          <span className="bg-white px-1.5 py-0.5 rounded border border-teal-100 text-[10px]">Định dạng: {selectedSub.aiRubric?.presentation}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Biểu mẫu chấm điểm của GV */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                      Biểu mẫu đánh giá giảng viên
                    </h4>

                    {/* Điểm 4 tiêu chí cụ thể */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'content', label: 'Nội dung & Độ dài' },
                        { key: 'method', label: 'Cấu trúc đề mục' },
                        { key: 'originality', label: 'Tính hàn lâm' },
                        { key: 'presentation', label: 'Định dạng trình bày' }
                      ].map(r => (
                        <div key={r.key}>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{r.label}</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={teacherRubric[r.key] || 8}
                            onChange={e => setTeacherRubric(prev => ({ ...prev, [r.key]: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-teal-800"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhận xét giảng viên</label>
                      <textarea
                        rows={3}
                        value={teacherFeedback}
                        onChange={e => setTeacherFeedback(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-800/10 focus:border-teal-800"
                        placeholder="Viết lời khuyên, nhận xét sửa đổi về cách trình bày hoặc nội dung của sinh viên..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Điểm số tổng quan (Thang điểm 10)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          required
                          value={teacherGrade}
                          onChange={e => setTeacherGrade(e.target.value)}
                          className="w-24 px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-teal-800/20 text-teal-900 bg-teal-50/50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Tự động tính điểm trung bình cộng các tiêu chí
                            const avg = (teacherRubric.content + teacherRubric.method + teacherRubric.originality + teacherRubric.presentation) / 4;
                            setTeacherGrade(Math.round(avg * 10) / 10);
                          }}
                          className="px-2.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold uppercase text-slate-600"
                        >
                          Tự động tính Avg
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGradingModal(false);
                      setSelectedSub(null);
                    }}
                    className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGrade}
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
                  >
                    Lưu điểm & Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerPracticeManagerPage;
