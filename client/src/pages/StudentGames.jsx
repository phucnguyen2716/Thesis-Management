import React from 'react';
import { Link } from 'react-router-dom';
import StudentProfileGames from '../components/student/StudentProfileGames';

const StudentGames = () => (
  <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
    <div>
      <h1 className="text-3xl font-black text-on-surface tracking-tight">Mini-game Arena</h1>
      <p className="text-on-surface-variant text-sm mt-2">
        <Link to="/profile" className="text-primary font-bold hover:underline">
          ← Quay lại hồ sơ
        </Link>
      </p>
    </div>
    <StudentProfileGames />
  </div>
);

export default StudentGames;
