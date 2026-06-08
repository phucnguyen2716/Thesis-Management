import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage language state across all components.
 * Listens to the 'language-changed' event dispatched by Layout.jsx
 * so every page re-renders when the user toggles VI/EN.
 */
const useLanguage = () => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi');

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'vi');
    };
    window.addEventListener('language-changed', handleLangChange);
    return () => window.removeEventListener('language-changed', handleLangChange);
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new Event('language-changed'));
  }, [lang]);

  return { lang, toggleLanguage };
};

export default useLanguage;
