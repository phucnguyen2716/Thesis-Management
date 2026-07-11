import React from 'react';
import { Link } from 'react-router-dom';
import WordPlayground from '../components/practice/WordPlayground';

const ThesisPracticePage = () => {
  return (
    <div className="flex flex-col min-h-0 animate-fade-in">
      <div className="mb-1.5 px-1 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
          <h1 className="text-sm font-black text-on-surface">Microsoft Word Playground</h1>
          <span className="text-[10px] text-on-surface-variant opacity-60">| Times New Roman, Khổ A4</span>
        </div>
        <Link
          to="/guidelines"
          className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-outline-variant text-on-surface-variant hover:text-primary transition-all"
        >
          Hướng dẫn tra cứu →
        </Link>
      </div>

      <WordPlayground />
    </div>
  );
};

export default ThesisPracticePage;
