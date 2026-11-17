import React from 'react';
import { ZONES } from '../game/data';

interface EncyclopediaModalProps {
  onClose: () => void;
}

export const EncyclopediaModal: React.FC<EncyclopediaModalProps> = ({
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 3, 7, 0.8)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Respon Stimulus dan Gangguan Pencernaan"
    >
      <div
        className="w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-2xl border border-[#fda4af]/35 p-6 shadow-2xl text-[#fff5f2]"
        style={{ backgroundColor: 'rgba(30, 10, 18, 0.98)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-[#67e8f9]">
              Ensiklopedia Biologi Pencernaan
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#fde68a]">
              Respon Stimulus &amp; Gangguan Pencernaan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#4c1526] hover:bg-[#671d34] text-xs font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>

        <div className="space-y-3">
          {ZONES.map((z) => (
            <div
              key={z.id}
              className="rounded-xl border border-[#fda4af]/20 p-3.5"
              style={{ backgroundColor: 'rgba(20, 6, 12, 0.78)' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-extrabold text-[#fde68a]">
                  {z.organLabel} — {z.name}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg bg-[#0d2836] border border-[#22d3ee]/30 p-2.5">
                  <div className="text-[10px] uppercase font-bold text-[#67e8f9] mb-0.5">
                    Respon Stimulus
                  </div>
                  <div className="font-semibold text-white">{z.keyStimulus}</div>
                  <div className="text-[#bae6fd] mt-0.5">→ {z.keyResponse}</div>
                </div>
                <div className="rounded-lg bg-[#350d17] border border-[#f87171]/30 p-2.5">
                  <div className="text-[10px] uppercase font-bold text-[#fda4af] mb-0.5">
                    Gangguan Pencernaan
                  </div>
                  <div className="font-semibold text-white">{z.disorderName}</div>
                  <div className="text-[#fecdd3] mt-0.5">{z.disorderDesc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
