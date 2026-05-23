import React, { useState, useEffect } from 'react';
import { isMuted, toggleMute, subscribeMute } from '../utils/sounds';

/**
 * Global mini-game sound mute toggle (synced via sounds.js + localStorage).
 */
const SoundMuteToggle = ({ className = '', iconClass = '', size = 'md', showLabel = false }) => {
  const [muted, setMuted] = useState(isMuted);

  useEffect(() => subscribeMute(setMuted), []);

  const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'text-sm' : 'text-base';
  const shape = showLabel
    ? 'px-2.5 py-1.5 rounded-xl flex-row'
    : `${dim} rounded-full`;

  return (
    <button
      type="button"
      onClick={() => toggleMute()}
      title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      aria-pressed={muted}
      className={`${shape} flex items-center justify-center gap-1.5 hover:bg-black/5 transition-all shrink-0 ${className}`}
    >
      <span className={`material-symbols-outlined ${iconSize} ${iconClass}`}>
        {muted ? 'volume_off' : 'volume_up'}
      </span>
      {showLabel && (
        <span className={`text-[9px] font-bold uppercase tracking-wide ${iconClass}`}>
          {muted ? 'Tắt tiếng' : 'Có tiếng'}
        </span>
      )}
    </button>
  );
};

export default SoundMuteToggle;
