import React from 'react';
import { FOOD_LIST, FOODS } from '../game/data';
import { FoodId } from '../game/types';

interface TitleOverlayProps {
  selectedFood: FoodId;
  onSelectFood: (id: FoodId) => void;
  onStart: () => void;
  onOpenGuide: () => void;
}

function FoodGlyph({ id }: { id: FoodId }) {
  if (id === 'burger') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0" aria-hidden="true">
        <path d="M4 12 C4 6, 24 6, 24 12 Z" fill="#f59e0b" stroke="#2a0d16" strokeWidth="1.5" />
        <rect x="3" y="13" width="22" height="3" rx="1.5" fill="#4ade80" stroke="#2a0d16" strokeWidth="1.2" />
        <rect x="4" y="16" width="20" height="4" rx="1.5" fill="#78350f" stroke="#2a0d16" strokeWidth="1.2" />
        <path d="M5 20 H23 C23 23, 5 23, 5 20 Z" fill="#d97706" stroke="#2a0d16" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === 'apple') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0" aria-hidden="true">
        <path d="M14 7 C14 4, 16 3, 18 3" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M15 6 C18 4, 21 5, 20 8 C18 9, 15 8, 15 6 Z" fill="#4ade80" stroke="#14532d" strokeWidth="1" />
        <path d="M14 8 C8 7, 5 12, 6 18 C7 23, 11 25, 14 23 C17 25, 21 23, 22 18 C23 12, 20 7, 14 8 Z" fill="#ef4444" stroke="#450a0a" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === 'chicken') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0" aria-hidden="true">
        <path d="M18 19 L23 24" stroke="#fef3c7" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="24" cy="23" r="2" fill="#fef3c7" />
        <circle cx="22" cy="25" r="2" fill="#fef3c7" />
        <path d="M6 12 C4 7, 10 4, 15 7 C19 10, 21 15, 18 19 C15 22, 8 18, 6 12 Z" fill="#d97706" stroke="#451a03" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0" aria-hidden="true">
      <path d="M16 6 C17 4, 20 3, 21 5" stroke="#15803d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M15 7 C19 7, 21 11, 18 16 C15 21, 9 24, 5 23 C9 20, 11 16, 11 11 C11 8, 13 7, 15 7 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
    </svg>
  );
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  selectedFood,
  onSelectFood,
  onStart,
  onOpenGuide,
}) => {
  const activeSpec = FOODS[selectedFood];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-5 sm:p-8">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6 my-auto max-w-6xl w-full">
        {/* Left Title Lockup + Food Selector Panel (Calm Negative Space Framing) */}
        <div
          className="pointer-events-auto w-full max-w-[440px] rounded-2xl border border-[#fda4af]/25 p-5 sm:p-6 shadow-2xl"
          style={{ backgroundColor: 'rgba(28, 9, 16, 0.88)' }}
        >
          {/* Bespoke Inline SVG Emblem + Presentation Main Menu Title */}
          <div className="mb-4 flex items-start gap-3">
            <svg
              viewBox="0 0 56 56"
              className="w-12 h-12 shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <defs>
                <filter id="titleShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#14040a" floodOpacity="0.85" />
                </filter>
              </defs>
              <circle cx="28" cy="28" r="25" fill="#4c1526" stroke="#fda4af" strokeOpacity="0.45" strokeWidth="2" />
              <path
                d="M16 28 C16 17, 26 12, 36 16 C42 19, 43 26, 39 34 C35 42, 16 42, 16 28 Z"
                fill="#fb7185"
                stroke="#fff1f2"
                strokeWidth="2"
                filter="url(#titleShadow)"
              />
              <path
                d="M23 24 Q29 18 33 27"
                fill="none"
                stroke="#fef3c7"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <h1 className="text-lg sm:text-[21px] font-black text-[#fff5f2] leading-snug tracking-tight hud-text-stroke">
                Respons Stimulus dan Gangguan pada Sistem Pencernaan
              </h1>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#fda4af] mt-1">
                Media Pembelajaran Interaktif 3D
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#fecdd3] leading-relaxed mb-4">
            Pilih karakter makananmu lalu mulai petualangan langsung dari{' '}
            <strong className="text-[#fde68a]">Rongga Mulut</strong> menelusuri
            kerongkongan, lambung, hingga usus besar!
          </p>

          {/* Selectable Food Grid */}
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#fda4af] mb-2">
              Ganti Makanan di Menu
            </div>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pilih Makanan">
              {FOOD_LIST.map((food) => {
                const active = food.id === selectedFood;
                return (
                  <button
                    key={food.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSelectFood(food.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-transform duration-150 cursor-pointer ${
                      active
                        ? 'border-[#fbbf24] bg-[#4c1526] text-[#fffbeb] scale-[1.01] shadow-md'
                        : 'border-[#fda4af]/20 bg-[#2a0c17] text-[#fecdd3] hover:border-[#fda4af]/50'
                    }`}
                  >
                    <FoodGlyph id={food.id} />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold truncate">
                        {food.name}
                      </div>
                      <div className="text-[10px] text-[#fda4af] truncate">
                        {food.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Food Biological Stats */}
          <div
            className="rounded-xl border border-[#fda4af]/20 p-3 mb-4 text-xs"
            style={{ backgroundColor: 'rgba(20, 6, 12, 0.72)' }}
          >
            <div className="flex items-center justify-between text-[#fde68a] font-semibold mb-1.5">
              <span>{activeSpec.name} · {activeSpec.nutrientType}</span>
              <span className="tabular-nums">HP {activeSpec.maxHp}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-[#fecdd3] mb-2 tabular-nums">
              <div>Kecepatan: <strong className="text-white">{activeSpec.speed.toFixed(0)}</strong></div>
              <div>Tahan Asam: <strong className="text-white">{Math.round(activeSpec.acidResist * 100)}%</strong></div>
              <div>Serat: <strong className="text-white">{activeSpec.fiberPower}/5</strong></div>
            </div>
            <p className="text-[11px] text-[#fda4af]/95 leading-snug">
              {activeSpec.bioNote}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="flex-1 px-5 py-3 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm sm:text-base tracking-wide shadow-lg cursor-pointer transition-colors"
            >
              Mulai dari Mulut
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="px-4 py-3 rounded-xl border border-[#fda4af]/35 bg-[#36101e] hover:bg-[#4b172a] text-[#ffe4e6] font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Materi Organ
            </button>
          </div>
        </div>
      </div>

      {/* Single Flat Control Hint Line */}
      <div className="w-full text-center text-xs sm:text-sm text-[#ffe4e6]/90 font-medium tracking-wide hud-text-stroke">
        WASD / Panah Gerak · Space Dash · E Lapisan Mukus · F Respon Saraf · Esc Jeda
      </div>
    </div>
  );
};
