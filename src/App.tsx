// =============================================================================
// App.tsx — Client entry point
// =============================================================================
import { useState, useRef, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
// @ts-ignore — MCTSBot is exported at runtime but types are incomplete in v0.50
import { MCTSBot } from 'boardgame.io';
import { AcademiaArena } from './game/game';
import { Arena } from './components/Arena';
import { useTranslation } from 'react-i18next';
import type { BoardProps } from 'boardgame.io/react';
import type { G } from './game/types';

const GameClient = Client<G>({
  game: AcademiaArena,
  board: Arena as React.ComponentType<BoardProps<G>>,
  numPlayers: 2,
  multiplayer: Local({
    bots: { '1': MCTSBot },
  }),
});

export default function App() {
  const { t, i18n } = useTranslation();
  const [started, setStarted] = useState(false);
  const [lang, setLang] = useState('en');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/academia-arena-theme.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setMusicPlaying(!musicPlaying);
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(next);
    setLang(next);
  };

  if (!started) {
    return (
      <div className="min-h-screen surface flex flex-col items-center justify-center">
        <div className="absolute top-6 right-6 flex items-center gap-4">
          <button
            onClick={toggleMusic}
            className="label text-xs uppercase tracking-wider text-on-surface/40 hover:text-on-surface transition-colors"
          >
            {musicPlaying ? '♫ ON' : '♫ OFF'}
          </button>
          <button
            onClick={toggleLang}
            className="label text-xs uppercase tracking-wider text-on-surface/40 hover:text-on-surface transition-colors"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        <div className="text-center">
          <h1 className="font-display text-7xl md:text-9xl font-black uppercase tracking-tighter text-on-surface leading-none">
            {t('app.title')}
          </h1>
          <p className="label text-sm text-on-surface/40 uppercase tracking-[0.3em] mt-2">
            {t('app.subtitle')}
          </p>
        </div>

        <div className="w-32 h-1 bg-primary my-10" />

        <button
          onClick={() => setStarted(true)}
          className="bg-primary text-on-primary label text-sm uppercase tracking-[0.2em] px-12 py-4 font-bold hover:bg-primary-container transition-colors"
        >
          {t('app.startGame')}
        </button>

        <div className="absolute bottom-6 label text-[10px] text-on-surface/20 uppercase tracking-widest">
          v1.0 — boardgame.io + React
        </div>
      </div>
    );
  }

  return <GameClient playerID="0" />;
}
