import React from 'react';
import { Link } from 'react-router-dom';
import WordPlayground from '../components/practice/WordPlayground';

const ThesisPracticePage = () => {
  return (
    <div className="flex flex-col min-h-0 animate-fade-in">
      <div className="mb-4 px-1">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
          Luyện tập đồ án
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-on-surface">Microsoft Word Playground</h1>
        <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
          Soạn thử chương mở đầu, tổng quan lý thuyết hoặc kết luận — giao diện giống Word, tự lưu nháp trên
          trình duyệt. Dùng để luyện format trước khi nộp bản chính thức.
        </p>
        <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-bold uppercase tracking-wider">
          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary">Times New Roman</span>
          <span className="px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant">
            Khổ A4
          </span>
          <span className="px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant">
            Mẫu chương có sẵn
          </span>
          <Link
            to="/guidelines"
            className="px-2 py-1 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary"
          >
            Xem hướng dẫn tra cứu →
          </Link>
        </div>
      </div>

      <WordPlayground />
    </div>
  );
};

export default ThesisPracticePage;
