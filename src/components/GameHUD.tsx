import React from 'react';
import { FOODS, ZONES } from '../game/data';
import { HudSnapshot } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  shiftLock: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerDash: () => void;
  onTriggerMucus: () => void;
  onTriggerStimulus: () => void;
  onCameraHold: (dir: -1 | 0 | 1) => void;
  onCameraNudge: (deltaRad: number) => void;
  onResetCamera: () => void;
  onToggleShiftLock: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  muted,
  shiftLock,
  onToggleMute,
  onPause,
  onTriggerDash,
  onTriggerMucus,
  onTriggerStimulus,
  onCameraHold,
  onCameraNudge,
  onResetCamera,
  onToggleShiftLock,
}) => {
  const food = FOODS[hud.foodId];
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const zoneIndex = Math.max(
    0,
    ZONES.findIndex((z) => z.id === hud.zoneId),
  );
  const zone = ZONES[zoneIndex] || ZONES[0];
  const zoneIdx = zoneIndex + 1;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
      {shiftLock && (
        <div
          data-testid="shift-lock-crosshair"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 flex items-center justify-center z-0"
        >
          <svg viewBox="0 0 36 36" className="w-7 h-7 drop-shadow">
            <circle
              cx="18"
              cy="18"
              r="11"
              fill="none"
              stroke="rgba(34, 211, 238, 0.88)"
              strokeWidth="1.8"
            />
            <line x1="18" y1="3" x2="18" y2="9" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="18" y1="27" x2="18" y2="33" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="3" y1="18" x2="9" y2="18" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="27" y1="18" x2="33" y2="18" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="18" cy="18" r="2.2" fill="#22d3ee" />
          </svg>
        </div>
      )}
      {/* Top Perimeter Clusters (>= 85% viewport unobstructed) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          {/* Top-Left: Vitality, Mucus Sockets, Active Food & Organ Zone */}
          <div
            className="rounded-xl border border-[#fda4af]/25 px-3.5 py-2.5 min-w-[225px] max-w-[270px] shadow-lg shrink-0"
            style={{ backgroundColor: 'rgba(28, 9, 16, 0.86)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                data-testid="hud-form-badge"
                className={`text-[11px] uppercase tracking-wider font-bold ${
                  hud.isStool ? 'text-[#f59e0b]' : 'text-[#fde68a]'
                }`}
              >
                {hud.isStool
                  ? `Feses (${Math.round(hud.stoolScale * 100)}%)`
                  : food.name}
              </span>
              <span className="text-[11px] font-semibold text-[#fda4af] tabular-nums">
                Organ {zoneIdx}/5 · {hud.progressPct}%
              </span>
            </div>

            <div className="text-sm font-extrabold text-white mb-2 leading-tight">
              {hud.zoneName}
            </div>

            {/* HP / Integritas Bar */}
            <div className="mb-1.5">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#fecdd3] mb-0.5">
                <span>Integritas</span>
                <span className="tabular-nums font-bold text-white">
                  {hud.hp}/{hud.maxHp}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#1a070e] border border-[#fda4af]/20 overflow-hidden">
                <div
                  className="h-full transition-all duration-150"
                  style={{
                    width: `${hpPct}%`,
                    backgroundColor:
                      hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* Mucus Shield Sockets */}
            <div className="flex items-center justify-between text-[10px] text-[#bae6fd] pt-0.5">
              <span className="uppercase tracking-wider font-semibold">
                Mukus [E] {hud.shieldActive ? '· AKTIF' : ''}
              </span>
              <div className="flex items-center gap-1" aria-label={`Muatan Mukus ${hud.mucusCharges}`}>
                {Array.from({ length: hud.maxMucusCharges }).map((_, i) => {
                  const full = i < hud.mucusCharges;
                  return (
                    <svg key={i} viewBox="0 0 18 18" className="w-4 h-4" aria-hidden="true">
                      <path
                        d="M9 2 C12 6, 14 9, 14 11.5 C14 14.2, 11.8 16, 9 16 C6.2 16, 4 14.2, 4 11.5 C4 9, 6 6, 9 2 Z"
                        fill={full ? '#38bdf8' : '#1e1b2e'}
                        stroke={full ? '#e0f2fe' : '#64748b'}
                        strokeWidth="1.5"
                      />
                    </svg>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top-Center: Digestive Organ Location & Function Banner */}
          <div
            data-testid="hud-zone-banner"
            className="hidden md:flex flex-col items-center text-center rounded-xl border border-[#fde68a]/40 px-4 py-2 max-w-md shadow-lg"
            style={{ backgroundColor: 'rgba(24, 9, 16, 0.9)' }}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#fda4af]">
              <span>{zone.organLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Bagian {zoneIdx} dari 5</span>
            </div>
            <div className="text-base font-black text-[#fde68a] leading-snug mt-0.5">
              Kamu Berada di: {zone.name}
            </div>
            <p className="text-[11px] text-[#ffe4e6] leading-snug mt-0.5">
              {zone.locationDesc}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 w-full max-w-[220px]" aria-hidden="true">
              {ZONES.map((z, idx) => (
                <div
                  key={z.id}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      idx < zoneIndex
                        ? '#4ade80'
                        : idx === zoneIndex
                          ? '#fbbf24'
                          : 'rgba(255,255,255,0.18)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Top-Right: Score, Stimulus Counter & Square Utility Buttons */}
          <div className="flex items-start gap-2.5 shrink-0">
            <div
              className="rounded-xl border border-[#fda4af]/25 px-3.5 py-2 text-right shadow-lg"
              style={{ backgroundColor: 'rgba(28, 9, 16, 0.86)' }}
            >
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#fda4af]">
                Skor Gizi {hud.combo > 1 ? `· x${hud.combo}` : ''}
              </div>
              <div
                className="text-2xl font-black text-[#fde68a] tabular-nums leading-none my-0.5 hud-text-stroke"
                data-testid="hud-score"
              >
                {hud.score}
              </div>
              <div className="text-[11px] text-[#bae6fd] tabular-nums font-medium">
                Enzim {hud.enzymesCollected} · Respon {hud.stimuliTriggered}/{hud.totalStimuli}
              </div>
            </div>

            <div className="pointer-events-auto flex flex-col gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Aktifkan Suara (M)' : 'Bisukan Suara (M)'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                className="w-10 h-10 rounded-xl border border-[#fda4af]/30 flex items-center justify-center text-[#ffe4e6] hover:bg-[#4c1526] cursor-pointer"
                style={{ backgroundColor: 'rgba(28, 9, 16, 0.88)' }}
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Jeda Permainan (Esc / P)"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                className="w-10 h-10 rounded-xl border border-[#fda4af]/30 flex items-center justify-center text-[#ffe4e6] hover:bg-[#4c1526] cursor-pointer"
                style={{ backgroundColor: 'rgba(28, 9, 16, 0.88)' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Compact Top Banner on narrow mobile viewports */}
        <div
          className="md:hidden self-center rounded-xl border border-[#fde68a]/35 px-3.5 py-1.5 text-center shadow-lg max-w-sm"
          style={{ backgroundColor: 'rgba(24, 9, 16, 0.9)' }}
        >
          <div className="text-xs font-black text-[#fde68a]">
            Kamu Berada di: {zone.name}
          </div>
          <div className="text-[10px] text-[#ffe4e6] leading-snug">
            {zone.locationDesc}
          </div>
        </div>
      </div>

      {/* Bottom Perimeter: Germ NPC / Stimulus-Response Prompt + Action Slots */}
      <div className="flex flex-col items-center gap-2">
        {hud.nearNpc && (
          <div
            data-testid="npc-interact-prompt"
            className="pointer-events-auto rounded-xl border-2 border-[#a3e635] px-4 py-2 text-center shadow-lg max-w-md"
            style={{ backgroundColor: 'rgba(20, 36, 14, 0.94)' }}
          >
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#bef264]">
              {hud.nearNpc.name}
            </div>
            <div className="text-xs sm:text-sm font-bold text-white mb-1">
              Tanya tentang {hud.nearNpc.topic}
            </div>
            <button
              type="button"
              data-testid="npc-interact-btn"
              onClick={onTriggerMucus}
              className="px-3 py-1 rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-[#1a2e05] font-extrabold text-xs cursor-pointer"
            >
              Bicara / Lihat Animasi [E]
            </button>
          </div>
        )}

        {!hud.nearNpc && hud.nearStimulus && (
          <div
            className="pointer-events-auto rounded-xl border-2 border-[#22d3ee] px-4 py-2 text-center shadow-lg max-w-md"
            style={{ backgroundColor: 'rgba(12, 34, 46, 0.92)' }}
          >
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#67e8f9]">
              Reseptor Saraf Terdeteksi!
            </div>
            <div className="text-xs sm:text-sm font-bold text-white mb-1">
              {hud.nearStimulus.stimulusName} → {hud.nearStimulus.responseName}
            </div>
            <button
              type="button"
              onClick={onTriggerStimulus}
              className="px-3 py-1 rounded-lg bg-[#06b6d4] hover:bg-[#22d3ee] text-[#082f49] font-extrabold text-xs cursor-pointer"
            >
              Picu Respon [F]
            </button>
          </div>
        )}

        {!hud.nearNpc && !hud.nearStimulus && hud.activePrompt && (
          <div
            className={`rounded-xl border px-4 py-2 text-center shadow-lg max-w-lg ${
              hud.activePrompt.kind === 'warning'
                ? 'border-[#f87171]'
                : hud.activePrompt.kind === 'stimulus'
                  ? 'border-[#38bdf8]'
                  : 'border-[#fbbf24]/50'
            }`}
            style={{ backgroundColor: 'rgba(24, 9, 15, 0.88)' }}
          >
            <div className="text-xs font-extrabold text-[#fde68a]">
              {hud.activePrompt.stimulus}
            </div>
            <div className="text-xs text-white font-medium">
              {hud.activePrompt.response}
            </div>
            <div className="text-[10px] text-[#fda4af] mt-0.5">
              {hud.activePrompt.actionHint}
            </div>
          </div>
        )}

        {/* Compact Action Ability & Camera Control Strip */}
        <div
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#fda4af]/25 px-3 py-1.5"
          style={{ backgroundColor: 'rgba(24, 9, 15, 0.85)' }}
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerDash();
            }}
            className="px-2.5 py-1 rounded-lg bg-[#3b1220] hover:bg-[#521a2d] border border-[#fbbf24]/40 text-xs font-bold text-[#fde68a] cursor-pointer tabular-nums"
          >
            Dash [Space] {Math.round(hud.dashReadyRatio * 100)}%
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerMucus();
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer tabular-nums ${
              hud.nearNpc
                ? 'bg-[#365314] hover:bg-[#4d7c0f] border-[#a3e635] text-[#ecfccb]'
                : 'bg-[#0c2d3d] hover:bg-[#13465e] border-[#38bdf8]/40 text-[#bae6fd]'
            }`}
          >
            {hud.nearNpc ? 'Interaksi NPC [E]' : `Mukus [E] (${hud.mucusCharges})`}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerStimulus();
            }}
            className="px-2.5 py-1 rounded-lg bg-[#123328] hover:bg-[#194a3a] border border-[#4ade80]/40 text-xs font-bold text-[#bbf7d0] cursor-pointer"
          >
            Stimulus [F]
          </button>

          <span className="h-4 w-px bg-[#fda4af]/25 mx-0.5 hidden sm:inline-block" aria-hidden="true" />

          <div className="flex items-center gap-1" title="Seret layar atau tahan Q / R untuk putar kamera">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Putar Kamera ke Kiri (Q)"
              data-testid="cam-left-btn"
              onPointerDown={() => onCameraHold(-1)}
              onPointerUp={() => onCameraHold(0)}
              onPointerLeave={() => onCameraHold(0)}
              onClick={(e) => {
                e.currentTarget.blur();
                onCameraNudge(-0.28);
              }}
              className="px-2 py-1 rounded-lg bg-[#2b1422] hover:bg-[#431e34] border border-[#fda4af]/35 text-xs font-bold text-[#ffe4e6] cursor-pointer"
            >
              ↺ Kiri [Q]
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Reset Kamera (C)"
              data-testid="cam-reset-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onResetCamera();
              }}
              className="px-2 py-1 rounded-lg bg-[#23101b] hover:bg-[#3a1a2d] border border-[#fda4af]/25 text-[11px] font-semibold text-[#fecdd3] cursor-pointer"
            >
              Kamera [C]
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Putar Kamera ke Kanan (R)"
              data-testid="cam-right-btn"
              onPointerDown={() => onCameraHold(1)}
              onPointerUp={() => onCameraHold(0)}
              onPointerLeave={() => onCameraHold(0)}
              onClick={(e) => {
                e.currentTarget.blur();
                onCameraNudge(0.28);
              }}
              className="px-2 py-1 rounded-lg bg-[#2b1422] hover:bg-[#431e34] border border-[#fda4af]/35 text-xs font-bold text-[#ffe4e6] cursor-pointer"
            >
              Kanan [R] ↻
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-pressed={shiftLock}
              aria-label={shiftLock ? 'Matikan Shift Lock (Shift)' : 'Aktifkan Shift Lock (Shift)'}
              data-testid="shift-lock-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleShiftLock();
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                shiftLock
                  ? 'bg-[#0e7490] hover:bg-[#0891b2] border-[#22d3ee] text-white'
                  : 'bg-[#1a1326] hover:bg-[#2a1e3d] border-[#fda4af]/30 text-[#e0f2fe]'
              }`}
            >
              {shiftLock ? 'Shift Lock: ON [Shift]' : 'Shift Lock [Shift]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
