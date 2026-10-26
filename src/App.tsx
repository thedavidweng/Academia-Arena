// =============================================================================
// App.tsx — Client entry point
// =============================================================================
import { useState, useRef, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { RandomBot } from 'boardgame.io/ai';
import { AcademiaArena } from './game/game';
import { Arena, type ArenaProps } from './components/Arena';
import { useTranslation } from 'react-i18next';
import type { G } from './game/types';

const GameClient = Client<G, ArenaProps>({
  game: AcademiaArena,
  board: Arena,
  debug: false,
  numPlayers: 2,
  multiplayer: Local({
    bots: { '1': RandomBot },
  }),
});

const HotseatClient = Client<G, ArenaProps>({
  game: AcademiaArena, board: Arena, debug: false, numPlayers: 2, multiplayer: Local(),
});

export default function App() {
  const { t, i18n } = useTranslation();
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState('ai');
  const [activePlayer, setActivePlayer] = useState('0');
  const [lang, setLang] = useState('en');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}academia-arena-theme.mp3`);
    audio.loop = true;
    audio.volume = 0.3;
    audio.onplay = () => setMusicPlaying(true);
    audio.onpause = () => setMusicPlaying(false);
    audioRef.current = audio;
    return () => {
      audio.onplay = null;
      audio.onpause = null;
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setMusicPlaying(false));
    else audio.pause();
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
            aria-pressed={musicPlaying}
            aria-label={t('app.music')}
            className="label text-xs uppercase tracking-wider text-on-surface/40 hover:text-on-surface transition-colors"
          >
            {musicPlaying ? t('app.musicOn') : t('app.musicOff')}
          </button>
          <button
            onClick={toggleLang}
            aria-label={t('app.language')}
            className="label text-xs uppercase tracking-wider text-on-surface/40 hover:text-on-surface transition-colors"
          >
            {t('app.languageName')}
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

        <label className="label mt-6 mb-4 flex gap-3" htmlFor="mode">
          {t('app.mode')}
          <select id="mode" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="ai">{t('app.ai')}</option>
            <option value="hotseat">{t('app.hotseat')}</option>
          </select>
        </label>
        <button
          onClick={() => setStarted(true)}
          className="bg-primary text-on-primary label text-sm uppercase tracking-[0.2em] px-12 py-4 font-bold hover:bg-primary-container transition-colors"
        >
          {t('app.startGame')}
        </button>

        <div className="absolute bottom-6 label text-[10px] text-on-surface/20 uppercase tracking-widest">
          {t('app.version')}
        </div>
      </div>
    );
  }

  return mode === 'ai'
    ? <GameClient playerID="0" matchID="ai" />
    : <HotseatClient playerID={activePlayer} matchID="hotseat" hotseat onPlayerChange={setActivePlayer} />;
}
