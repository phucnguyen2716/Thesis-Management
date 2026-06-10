import { useEffect } from 'react';
import { startGameMusic, stopGameMusic } from '../utils/gameMusic';
import { primeAudio } from '../utils/sounds';

/** Start looping BGM while the game modal is open. */
export function useGameMusic(trackId) {
  useEffect(() => {
    if (!trackId) return undefined;
    let active = true;
    (async () => {
      await primeAudio();
      if (active) startGameMusic(trackId);
    })();
    return () => {
      active = false;
      stopGameMusic();
    };
  }, [trackId]);
}
