import { useState, useEffect, useMemo } from 'react';

export const GAME_OVERLAY_CLASS =
  'fixed inset-0 z-[200] sm:z-[300] flex items-stretch sm:items-center justify-center p-0 sm:p-3 md:p-4 overscroll-contain';

export const GAME_PANEL_CLASS =
  'flex flex-col w-full h-[100dvh] sm:h-auto sm:max-h-[96dvh] max-w-full sm:max-w-[min(100%,520px)] shadow-2xl overflow-hidden relative sm:rounded-[20px]';

export function useGameResponsive() {
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { w: vw, h: vh } = viewport;

  return useMemo(() => {
    const isMobile = vw < 640;
    const isSmall = vw < 400;
    let tetrisCellSize = 24;
    if (isMobile) {
      // Header ~48px + nút điều khiển ~50px + padding — bàn cờ co vừa màn hình
      const reserved = isSmall ? 108 : 118;
      const fromH = Math.floor((vh - reserved - 19) / 20);
      const fromW = Math.floor((vw - 16) / 10);
      tetrisCellSize = Math.max(11, Math.min(fromH, fromW, isSmall ? 15 : 17));
    }
    const solitaireScale = isSmall ? 0.72 : isMobile ? 0.86 : 1;
    const cardW = Math.round(52 * solitaireScale);
    const cardH = Math.round(74 * solitaireScale);
    const cardStackOffset = Math.round((solitaireScale < 1 ? 14 : 19) * (isSmall ? 0.85 : 1));
    return {
      vw,
      vh,
      isMobile,
      isSmall,
      tetrisCellSize,
      solitaireScale,
      cardW,
      cardH,
      cardStackOffset,
    };
  }, [vw, vh]);
}
