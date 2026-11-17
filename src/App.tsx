import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { GameHUD } from './components/GameHUD';
import { GerdScreen } from './components/GerdScreen';
import { MaagScreen } from './components/MaagScreen';
import { ParotitisScreen } from './components/ParotitisScreen';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import { WasirScreen } from './components/WasirScreen';
import { XerostomiaScreen } from './components/XerostomiaScreen';
import { GameController, ThreeGameCanvas } from './game/ThreeGameCanvas';
import { soundEngine } from './game/audio';
import { createSimulation, buildHudSnapshot } from './game/simulation';
import { FoodId, HudSnapshot } from './game/types';

export default function App() {
  const autostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [selectedFood, setSelectedFood] = useState<FoodId>('burger');
  const [muted, setMuted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [shiftLock, setShiftLock] = useState(false);

  const [hud, setHud] = useState<HudSnapshot>(() =>
    buildHudSnapshot(
      createSimulation('burger', autostart ? 'playing' : 'title', 0),
    ),
  );

  const controllerRef = useRef<GameController | null>(null);

  const handleControllerReady = useCallback((ctrl: GameController) => {
    controllerRef.current = ctrl;
  }, []);

  const handleSelectFood = useCallback((foodId: FoodId) => {
    setSelectedFood(foodId);
    controllerRef.current?.selectFood(foodId);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.repeat && e.code === 'KeyM') {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleToggleMute]);

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#180b10]">
      <ThreeGameCanvas
        initialFood={selectedFood}
        autostart={autostart}
        onHudUpdate={setHud}
        onControllerReady={handleControllerReady}
        onShiftLockChange={setShiftLock}
      />

      {hud.phase === 'title' && (
        <TitleOverlay
          selectedFood={selectedFood}
          onSelectFood={handleSelectFood}
          onStart={() => controllerRef.current?.startGame()}
          onOpenGuide={() => setGuideOpen(true)}
        />
      )}

      {hud.phase === 'intro' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-7 z-20 flex justify-center px-4">
          <button
            type="button"
            onClick={() => controllerRef.current?.skipIntro()}
            className="pointer-events-auto rounded-2xl border border-amber-300/35 bg-[#1c0c13]/90 px-6 py-3 text-center shadow-2xl transition hover:bg-[#2a121d]"
          >
            <p className="text-base font-bold tracking-wide text-amber-300">
              Menuju Rongga Mulut...
            </p>
            <p className="mt-0.5 text-xs font-medium text-rose-100/80">
              Fase Ingesti · Klik atau tekan Space untuk lewati
            </p>
          </button>
        </div>
      )}

      {hud.phase === 'xerostomia' && (
        <XerostomiaScreen
          onClose={() => controllerRef.current?.closeXerostomia()}
        />
      )}

      {hud.phase === 'parotitis' && (
        <ParotitisScreen
          onClose={() => controllerRef.current?.closeParotitis()}
        />
      )}

      {hud.phase === 'gerd' && (
        <GerdScreen
          onClose={() => controllerRef.current?.closeGerd()}
        />
      )}

      {hud.phase === 'maag' && (
        <MaagScreen
          onClose={() => controllerRef.current?.closeMaag()}
        />
      )}

      {hud.phase === 'wasir' && (
        <WasirScreen
          onClose={() => controllerRef.current?.closeWasir()}
        />
      )}

      {hud.phase === 'outro' && (
        <div
          data-testid="outro-banner"
          className="pointer-events-none fixed inset-x-0 bottom-7 z-20 flex justify-center px-4"
        >
          <button
            type="button"
            onClick={() => controllerRef.current?.skipOutro()}
            className="pointer-events-auto rounded-2xl border border-sky-300/45 bg-[#0c2736]/90 px-6 py-3 text-center shadow-2xl transition hover:bg-[#133b50] cursor-pointer"
          >
            <p className="text-base font-bold tracking-wide text-amber-300">
              Ekskresi: Feses Masuk ke Lubang Toilet!
            </p>
            <p className="mt-0.5 text-xs font-medium text-sky-100/85">
              Ukuran Feses {Math.round(hud.stoolScale * 100)}% · Klik atau tekan Space untuk lewati
            </p>
          </button>
        </div>
      )}

      {hud.phase === 'playing' && (
        <GameHUD
          hud={hud}
          muted={muted}
          shiftLock={shiftLock}
          onToggleMute={handleToggleMute}
          onPause={() => controllerRef.current?.pauseGame()}
          onTriggerDash={() => controllerRef.current?.triggerDash()}
          onTriggerMucus={() => controllerRef.current?.triggerMucus()}
          onTriggerStimulus={() => controllerRef.current?.triggerStimulus()}
          onCameraHold={(dir) => controllerRef.current?.setCameraOrbitHold(dir)}
          onCameraNudge={(delta) => controllerRef.current?.nudgeCameraYaw(delta)}
          onResetCamera={() => controllerRef.current?.resetCamera()}
          onToggleShiftLock={() => controllerRef.current?.toggleShiftLock()}
        />
      )}

      {(hud.phase === 'paused' || hud.phase === 'gameover') && (
        <StatusModal
          hud={hud}
          onResume={() => controllerRef.current?.resumeGame()}
          onRestart={() => controllerRef.current?.restartGame()}
          onReturnTitle={() => controllerRef.current?.returnToTitle()}
          onSelectFood={handleSelectFood}
          onOpenGuide={() => setGuideOpen(true)}
        />
      )}

      {guideOpen && <EncyclopediaModal onClose={() => setGuideOpen(false)} />}
    </main>
  );
}
