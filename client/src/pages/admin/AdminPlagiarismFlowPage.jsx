import React, { useEffect, useState } from 'react';
import { getPlagiarismFlow, savePlagiarismFlow, ensureContentSeed } from '../../utils/adminContentStore';

const AdminPlagiarismFlowPage = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    ensureContentSeed();
    setConfig(getPlagiarismFlow());
  }, []);

  const update = (path, value) => {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      savePlagiarismFlow(next);
      return next;
    });
  };

  const toggleStep = id => {
    setConfig(prev => {
      const next = {
        ...prev,
        steps: prev.steps.map(s => (s.id === id ? { ...s, active: !s.active } : s)),
      };
      savePlagiarismFlow(next);
      return next;
    });
  };

  if (!config) return null;

  const activeSteps = [...config.steps].sort((a, b) => a.order - b.order).filter(s => s.active);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Flow kiểm tra đạo văn</h1>
        <p className="text-slate-400 text-sm mt-1">
          Cấu hình quy trình GV dùng tại Controller — ngưỡng %, engine BM25/ES, bước pipeline.
        </p>
      </div>

      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={e => update('enabled', e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm font-bold text-white">Bật kiểm tra đạo văn toàn hệ thống</span>
      </label>

      {/* Visual flow */}
      <section className="p-5 rounded-xl border border-slate-800 bg-slate-900">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Sơ đồ pipeline</h2>
        <div className="flex flex-wrap items-center gap-2">
          {activeSteps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center min-w-[88px] p-3 rounded-lg bg-slate-800 border border-slate-700">
                <span className="material-symbols-outlined text-amber-400 text-xl mb-1">{step.icon}</span>
                <span className="text-[10px] font-bold text-white text-center">{step.label}</span>
                <span className="text-[9px] text-slate-500 text-center mt-0.5 line-clamp-2">{step.desc}</span>
              </div>
              {i < activeSteps.length - 1 && (
                <span className="material-symbols-outlined text-slate-600">arrow_forward</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">{config.policyText}</p>
      </section>

      {/* Steps toggle */}
      <section className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
        <h2 className="text-sm font-bold text-white">Các bước trong flow</h2>
        {config.steps
          .sort((a, b) => a.order - b.order)
          .map(step => (
            <label
              key={step.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer"
            >
              <input type="checkbox" checked={step.active} onChange={() => toggleStep(step.id)} />
              <span className="material-symbols-outlined text-slate-400">{step.icon}</span>
              <div className="flex-1">
                <span className="text-sm font-bold text-white">{step.label}</span>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
              <span className="text-[10px] text-slate-600">#{step.order}</span>
            </label>
          ))}
      </section>

      {/* Thresholds */}
      <section className="p-5 rounded-xl border border-slate-800 bg-slate-900">
        <h2 className="text-sm font-bold text-white mb-4">Ngưỡng cảnh báo (%)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['similarityReview', 'Độ trùng — cần xem xét', config.thresholds.similarityReview],
            ['similarityFlag', 'Độ trùng — flagged', config.thresholds.similarityFlag],
            ['aiReview', 'AI — cần xem xét', config.thresholds.aiReview],
            ['aiFlag', 'AI — flagged', config.thresholds.aiFlag],
          ].map(([key, label, val]) => (
            <label key={key} className="block text-xs text-slate-400">
              {label}
              <input
                type="number"
                min={0}
                max={100}
                value={val}
                onChange={e => update(`thresholds.${key}`, Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Engines */}
      <section className="p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
        <h2 className="text-sm font-bold text-white">Engine & tính năng</h2>
        {[
          ['bm25', 'BM25 (tìm kiếm văn bản)'],
          ['elasticsearch', 'Elasticsearch (kho đồ án)'],
          ['heatmap', 'Heatmap trùng lặp'],
          ['sideBySide', 'So khớp song song'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={config.engines[key]}
              onChange={e => update(`engines.${key}`, e.target.checked)}
            />
            {label}
          </label>
        ))}
        <label className="block text-xs text-slate-400">
          Tự quét lại sau (giờ)
          <input
            type="number"
            min={1}
            value={config.engines.autoRecheckHours}
            onChange={e => update('engines.autoRecheckHours', Number(e.target.value))}
            className="mt-1 w-32 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
          />
        </label>
      </section>

      {/* Policy */}
      <section className="p-5 rounded-xl border border-slate-800 bg-slate-900">
        <h2 className="text-sm font-bold text-white mb-2">Mô tả chính sách</h2>
        <textarea
          value={config.policyText}
          onChange={e => update('policyText', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
        />
      </section>

      {/* Status rules read-only preview */}
      <section className="p-5 rounded-xl border border-slate-800 bg-slate-900">
        <h2 className="text-sm font-bold text-white mb-3">Quy tắc trạng thái (tự áp dụng theo ngưỡng)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 uppercase">
              <tr>
                <th className="py-2">Status</th>
                <th className="py-2">Nhãn</th>
                <th className="py-2">Max similarity</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {config.statusRules.map(r => (
                <tr key={r.status} className="border-t border-slate-800">
                  <td className="py-2 font-mono text-amber-400">{r.status}</td>
                  <td className="py-2">{r.label}</td>
                  <td className="py-2">{r.maxSimilarity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPlagiarismFlowPage;
