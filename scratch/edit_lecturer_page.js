const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'lecturer', 'LecturerControllerPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetText = `          <section className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-sm w-full">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="material-symbols-outlined text-teal-800">{LECTURER_ICONS.grade}</span>
              Chấm điểm đồ án
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {[
                { key: 'content', label: 'Nội dung' },
                { key: 'method', label: 'Phương pháp' },
                { key: 'originality', label: 'Tính mới' },
                { key: 'presentation', label: 'Trình bày' },
              ].map(r => (
                <div key={r.key} className="min-w-0">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">{r.label}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={grades[r.key] || ''}
                    onChange={e => setGrades(g => ({ ...g, [r.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500 block">Nhận xét</label>
                <button
                  type="button"
                  onClick={generateAiFeedback}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-800 to-cyan-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                  title="Gemini AI tự động soạn thảo tóm tắt và nhận xét"
                >
                  <span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span>
                  Gemini AI gợi ý nhận xét
                </button>
              </div>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="Ghi chú cho sinh viên..."
              />
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
              <div className="w-full sm:w-28">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Điểm tổng</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={finalScore}
                  onChange={e => setFinalScore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                />
              </div>
              <button
                type="button"
                onClick={saveGrade}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-900"
              >
                Lưu điểm
              </button>
            </div>
          </section>`;

const replacementText = `          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm w-full">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-teal-800">{LECTURER_ICONS.grade}</span>
              Chấm điểm & Nhận xét đồ án
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Left Column: Rubric Inputs & Final Score (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Điểm Rubric Tiêu Chuẩn</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'content', label: 'Nội dung' },
                      { key: 'method', label: 'Phương pháp' },
                      { key: 'originality', label: 'Tính mới' },
                      { key: 'presentation', label: 'Trình bày' },
                    ].map(r => (
                      <div key={r.key} className="min-w-0">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">{r.label}</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={grades[r.key] || ''}
                          onChange={e => setGrades(g => ({ ...g, [r.key]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="w-full sm:w-32">
                    <label className="text-[11px] font-bold text-slate-900 block mb-1.5">Điểm tổng cộng</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={finalScore}
                      onChange={e => setFinalScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black text-teal-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mb-2.5">
                    (Để trống sẽ tự động lấy trung bình cộng điểm Rubric)
                  </span>
                </div>
              </div>

              {/* Right Column: AI Feedback & Textarea (6 cols) */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ý kiến phản hồi</label>
                    <button
                      type="button"
                      onClick={generateAiFeedback}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-800 to-cyan-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                      title="Gemini AI tự động soạn thảo tóm tắt và nhận xét"
                    >
                      <span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span>
                      Gemini AI gợi ý nhận xét
                    </button>
                  </div>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all font-medium leading-relaxed"
                    placeholder="Ghi nhận xét chi tiết, nhắc nhở hoặc yêu cầu chỉnh sửa..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={saveGrade}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-900 transition-all shadow-md active:scale-[0.98]"
                  >
                    Lưu điểm & Phản hồi
                  </button>
                </div>
              </div>
            </div>
          </section>`;

// Normalize CRLF to LF to make sure replacement works consistently
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetText.replace(/\r\n/g, '\n');
const normalizedReplacement = replacementText.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    fs.writeFileSync(filePath, updated, 'utf8');
    Console.WriteLine("SUCCESS: LecturerControllerPage.jsx updated successfully!");
} else {
    Console.error("ERROR: Target text was not found in the file.");
    // Print the first line of target to help debug
    Console.log("Target text begins with: " + targetText.slice(0, 100));
}
