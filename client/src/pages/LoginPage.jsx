import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, ChevronUp } from 'lucide-react';
import { ensureAdminSeed, findUserByEmail, logLoginAttempt } from '../utils/adminStore';
import { authService } from '../services/api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('EN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = username.includes('@') ? username.trim() : `${username.trim()}@ethesis.edu.vn`;

    try {
      const res = await authService.login({ email, password });
      const data = res.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.userId,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          studentId: data.role === 'Student' ? 'SV' + String(data.userId).padStart(3, '0') : null,
          faculty: 'Computer Science',
        })
      );

      if (data.role === 'Admin') navigate('/admin');
      else if (data.role === 'Advisor') navigate('/lecturer');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.googleLogin('mock-google-token');
      const data = res.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role
        })
      );

      if (data.role === 'Admin') navigate('/admin');
      else if (data.role === 'Advisor') navigate('/lecturer');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập bằng Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'VN', label: 'Tiếng Việt' }
  ];

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative font-sans selection:bg-blue-100 overflow-y-auto py-6"
      style={{
        backgroundImage: 'url("/uploads/login-background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Login Card — compact */}
      <div className="bg-white rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] w-full max-w-[380px] p-6 relative z-10 mx-4">
        <div className="flex flex-col items-center mb-5">
          <div className="w-full max-w-[96px] mb-3">
            <img 
              src="/uploads/logo-uef-without-box@4x.png" 
              alt="UEF Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
          <h2 className="text-gray-800 text-base font-semibold tracking-tight">
            {lang === 'EN' ? 'Portal Login' : 'Đăng nhập Portal'}
          </h2>
          <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mt-0.5">
            Thesis Management System
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center justify-center gap-3 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{lang === 'EN' ? 'Sign in with Google' : 'Đăng nhập bằng Google'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{lang === 'EN' ? 'Or' : 'Hoặc'}</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#003399] transition-colors">
                <User size={15} />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/30 border border-gray-200 rounded-lg focus:bg-white focus:border-[#003399] outline-none transition-all text-[13px] placeholder:text-gray-400"
                placeholder={lang === 'EN' ? 'Username' : 'Tên đăng nhập'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#003399] transition-colors">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50/30 border border-gray-200 rounded-lg focus:bg-white focus:border-[#003399] outline-none transition-all text-[13px] placeholder:text-gray-400"
                placeholder={lang === 'EN' ? 'Password' : 'Mật khẩu'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#003399] hover:bg-[#002b80] text-white font-semibold rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : (lang === 'EN' ? 'Sign In' : 'Đăng nhập')}
            </button>

            {/* Demo accounts — compact */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
              <p className="font-bold text-slate-600 mb-1">Tài khoản demo (nhập email):</p>
              <div className="grid grid-cols-1 gap-0.5">
                <span><span className="font-medium text-slate-700">admin</span>@ethesis.edu.vn → Admin</span>
                <span><span className="font-medium text-slate-700">advisor</span>@ethesis.edu.vn → Giảng viên</span>
                <span><span className="font-medium text-slate-700">student</span>@ethesis.edu.vn → Sinh viên</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 z-10">
        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2 text-white text-[10px] font-bold transition-all border border-white/10">
          <span className="material-symbols-outlined text-[16px]">cookie</span>
          {lang === 'EN' ? 'Cookies' : 'Cookie'}
        </button>
        
        <div className="relative" ref={langMenuRef}>
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2 text-white text-[10px] font-bold transition-all border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">language</span>
            {lang}
            <ChevronUp size={14} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
          </button>

          {showLangMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-36 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-[12px] font-semibold text-left flex items-center justify-between hover:bg-gray-50 ${lang === l.code ? 'text-[#003399] bg-blue-50/30' : 'text-gray-600'}`}
                >
                  {l.label}
                  {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-[#003399]"></div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;





