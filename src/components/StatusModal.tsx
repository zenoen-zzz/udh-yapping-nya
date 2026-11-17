import React from 'react';
import { FOOD_LIST, FOODS } from '../game/data';
import { FoodId, HudSnapshot } from '../game/types';

interface StatusModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onSelectFood: (id: FoodId) => void;
  onOpenGuide: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  hud,
  onResume,
  onRestart,
  onReturnTitle,
  onSelectFood,
  onOpenGuide,
}) => {
  const isPause = hud.phase === 'paused';
  const isVictory = hud.phase === 'gameover' && hud.outcome === 'victory';

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 4, 9, 0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-label={isPause ? 'Permainan Dijeda' : isVictory ? 'Penyerapan Berhasil' : 'Makanan Terurai'}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#fda4af]/35 p-6 shadow-2xl text-[#fff5f2]"
        style={{ backgroundColor: 'rgba(30, 10, 18, 0.96)' }}
      >
        <div className="text-[11px] uppercase tracking-widest font-bold text-[#fda4af] mb-1">
          {isPause
            ? 'Ekspedisi Dijeda'
            : isVictory
              ? 'Ekspedisi Pencernaan Selesai!'
              : 'Makanan Mengalami Gangguan'}
        </div>
        <h2 className="text-2xl font-black text-[#fde68a] mb-3">
          {isPause
            ? 'Menu Jeda & Ganti Makanan'
            : isVictory
              ? 'Nutrisi Terserap Sempurna!'
              : 'Integritas Makanan Habis'}
        </h2>

        {/* Stat Tiles */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="rounded-xl bg-[#200811] border border-[#fda4af]/20 p-2.5 text-center">
            <div className="text-[10px] uppercase text-[#fda4af]">Skor Gizi</div>
            <div className="text-lg font-black text-[#fde68a] tabular-nums">
              {hud.score}
            </div>
          </div>
          <div className="rounded-xl bg-[#200811] border border-[#fda4af]/20 p-2.5 text-center">
            <div className="text-[10px] uppercase text-[#fda4af]">Jalur</div>
            <div className="text-lg font-black text-white tabular-nums">
              {hud.progressPct}%
            </div>
          </div>
          <div className="rounded-xl bg-[#200811] border border-[#fda4af]/20 p-2.5 text-center">
            <div className="text-[10px] uppercase text-[#fda4af]">Stimulus</div>
            <div className="text-lg font-black text-[#67e8f9] tabular-nums">
              {hud.stimuliTriggered}/{hud.totalStimuli}
            </div>
          </div>
        </div>

        {/* Educational Summary */}
        <div className="rounded-xl bg-[#200811] border border-[#fda4af]/20 p-3 mb-4 text-xs">
          <div className="font-bold text-[#fde68a] mb-1">
            {hud.isStool
              ? `Bentuk Akhir: Feses (Ukuran ${Math.round(hud.stoolScale * 100)}%) · Organ: ${hud.zoneName}`
              : `Makanan Aktif: ${FOODS[hud.foodId].name} · Organ: ${hud.zoneName}`}
          </div>
          <div className="text-[#fecdd3]">
            {hud.disordersOvercome.length > 0
              ? `Gangguan Teratasi: ${hud.disordersOvercome.join(', ')}`
              : 'Tips: Tekan [E] untuk Mukus saat asam muncul dan [F] di reseptor saraf cyan!'}
          </div>
        </div>

        {/* Allow changing food directly from Pause/End Menu too */}
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-[#fda4af] mb-1.5">
            Ganti Karakter Makanan
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FOOD_LIST.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFood(f.id)}
                className={`px-2.5 py-2 rounded-lg border text-xs font-bold text-left cursor-pointer ${
                  f.id === hud.foodId
                    ? 'border-[#fbbf24] bg-[#4c1526] text-[#fde68a]'
                    : 'border-[#fda4af]/20 bg-[#230913] text-[#fecdd3] hover:border-[#fda4af]/45'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isPause ? (
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer"
            >
              Lanjutkan Penelusuran
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="w-full py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer"
            >
              Main Lagi dari Mulut
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="py-2 rounded-xl border border-[#fda4af]/30 bg-[#36101e] hover:bg-[#4b172a] text-xs font-bold text-white cursor-pointer"
            >
              Ulangi dari Mulut
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="py-2 rounded-xl border border-[#fda4af]/30 bg-[#230913] hover:bg-[#38101f] text-xs font-bold text-[#fecdd3] cursor-pointer"
            >
              Menu Utama
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="w-full py-2 rounded-xl border border-[#38bdf8]/35 bg-[#0c2736] hover:bg-[#133b50] text-xs font-bold text-[#bae6fd] cursor-pointer"
          >
            Lihat Ringkasan Respon Stimulus &amp; Gangguan
          </button>
        </div>
      </div>
    </div>
  );
};
