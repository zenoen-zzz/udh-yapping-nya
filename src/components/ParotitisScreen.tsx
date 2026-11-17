import React, { useEffect, useState } from 'react';

interface ParotitisScreenProps {
  onClose: () => void;
}

type StageId = 'normal' | 'infection' | 'parotitis';

interface StageDetail {
  id: StageId;
  indexLabel: string;
  title: string;
  caption: string;
  glandSize: string;
  throatState: string;
  virusActivity: string;
}

const STAGES: StageDetail[] = [
  {
    id: 'normal',
    indexLabel: '01',
    title: 'Kondisi Kelenjar Parotis Normal',
    caption:
      'Kelenjar parotis di depan dan bawah telinga berukuran normal serta aktif menyalurkan air liur ke rongga mulut sehingga tenggorokan nyaman saat menelan.',
    glandSize: 'Normal (Tidak Bengkak)',
    throatState: 'Lapang & bebas nyeri telan',
    virusActivity: 'Tidak ada infeksi aktif',
  },
  {
    id: 'infection',
    indexLabel: '02',
    title: 'Masuknya Virus Paramyxovirus',
    caption:
      'Virus penyebab gondongan (Mumps / Paramyxovirus) masuk lewat percikan ludah di tenggorokan lalu menyerang jaringan kelenjar parotis hingga mulai meradang.',
    glandSize: 'Mulai Memerah & Membesar',
    throatState: 'Tenggorokan terasa gatal & hangat',
    virusActivity: 'Berkembang biak di saluran parotis',
  },
  {
    id: 'parotitis',
    indexLabel: '03',
    title: 'Terjadinya Gondongan (Parotitis Akut)',
    caption:
      'Kelenjar parotis membengkak besar menekan area rahang dan pangkal tenggorokan, memicu nyeri hebat saat mengunyah maupun menelan makanan.',
    glandSize: 'Membengkak Besar & Berdenyut',
    throatState: 'Menyempit & nyeri hebat saat menelan',
    virusActivity: 'Peradangan tinggi — mudah menular',
  },
];

export const ParotitisScreen: React.FC<ParotitisScreenProps> = ({ onClose }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [phaseTick, setPhaseTick] = useState(0);

  // Smooth continuous SVG animation clock
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      setPhaseTick((prev) => prev + dt);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Auto-advance through the 3 biological stages every 4.5s unless paused/manual
  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % STAGES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [autoPlay]);

  const stage = STAGES[activeIdx];
  const pulse = Math.sin(phaseTick * 3.8);
  const flowPhase = phaseTick % 1;

  // Dynamic anatomical visual parameters per stage
  const swellScale =
    activeIdx === 0
      ? 1 + pulse * 0.025
      : activeIdx === 1
        ? 1.38 + pulse * 0.05
        : 1.88 + pulse * 0.08;
  const parotidFill = activeIdx === 0 ? '#38bdf8' : activeIdx === 1 ? '#fb923c' : '#ef4444';
  const throatFill = activeIdx === 0 ? '#5c182c' : activeIdx === 1 ? '#6e1b2d' : '#7f1d1d';
  const salivaAlpha = activeIdx === 0 ? 0.95 : activeIdx === 1 ? 0.42 : 0.12;
  const virusCount = activeIdx === 0 ? 0 : activeIdx === 1 ? 3 : 6;
  const cheekBulge = activeIdx === 0 ? 0 : activeIdx === 1 ? 16 : 36;

  return (
    <div
      data-testid="parotitis-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Animasi dan Penjelasan Penyakit Gondongan (Parotitis)"
      className="fixed inset-0 z-40 overflow-y-auto bg-[#12070c] text-[#fff5f2] flex flex-col justify-between"
    >
      {/* Top Editorial Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#fda4af]/15">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[#7dd3fc]">
            Edukasi Gangguan Sistem Pencernaan · Terowongan Tenggorokan (Kerongkongan)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fde68a]">
            Penyakit Gondongan (Parotitis)
          </h1>
        </div>

        <button
          type="button"
          data-testid="parotitis-close-btn"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer transition-colors"
        >
          Kembali ke Kerongkongan [Space / Esc]
        </button>
      </header>

      {/* Main Split Viewport Content: Left Live Animation Stage + Right Medical Explanation */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start flex-1">
        {/* Left: Live 3-Stage Animated Biological Cross-Section (7 columns) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Interactive Stage Switcher Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#1e0b13] border border-[#fda4af]/20">
              {STAGES.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  data-testid={`paro-stage-${st.id}`}
                  onClick={() => {
                    setAutoPlay(false);
                    setActiveIdx(idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeIdx === idx
                      ? 'bg-[#fde68a] text-[#240a12]'
                      : 'text-[#fecdd3] hover:bg-[#311220]'
                  }`}
                >
                  {st.indexLabel}.{' '}
                  {st.id === 'normal'
                    ? 'Parotis Normal'
                    : st.id === 'infection'
                      ? 'Infeksi Virus'
                      : 'Gondongan (Parotitis)'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAutoPlay((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-[#fda4af]/25 bg-[#1e0b13] hover:bg-[#2c101c] text-xs font-semibold text-[#bae6fd] cursor-pointer"
            >
              {autoPlay ? 'Animasi Otomatis: Aktif' : 'Putar Otomatis'}
            </button>
          </div>

          {/* High-Contrast Biological Animation Canvas */}
          <div
            data-testid="parotitis-animation-canvas"
            className="rounded-2xl border border-[#fda4af]/25 bg-[#1b0a12] p-4 shadow-2xl"
          >
            <svg
              viewBox="0 0 720 410"
              className="w-full h-auto rounded-xl overflow-hidden"
              aria-label={`Animasi tahap ${stage.title}`}
            >
              <rect x="0" y="0" width="720" height="410" fill="#160910" />

              {/* Head, Cheek-Jaw Contour (Expands with Parotitis Swelling) & Neck / Throat Silhouette */}
              <path
                d={`M 185 78
                    C 265 44, 410 52, 470 112
                    C 495 140, 505 162, 530 176
                    L 504 196
                    L 508 214
                    C 502 238, 492 256, 466 268
                    L 432 268
                    C ${415 + cheekBulge * 0.65} ${296 + cheekBulge * 0.42}, ${332 + cheekBulge * 0.8} ${318 + cheekBulge * 0.45}, 295 316
                    L 295 362
                    L 172 362
                    C 162 290, 150 220, 148 158
                    C 148 112, 165 88, 185 78 Z`}
                fill="#34121f"
                stroke="#f472b6"
                strokeWidth="2.8"
              />

              {/* Outer Ear Silhouette */}
              <ellipse
                cx="222"
                cy="185"
                rx="16"
                ry="26"
                fill="#4c1829"
                stroke="#fda4af"
                strokeWidth="2"
              />

              {/* Pharynx & Esophagus Throat Tunnel Passage */}
              <path
                d={`M 454 198
                    C 392 198, 336 205, 314 235
                    C 296 260, 294 312, 294 360
                    L ${246 + (activeIdx === 2 ? 14 : activeIdx === 1 ? 6 : 0)} 360
                    C ${246 + (activeIdx === 2 ? 14 : activeIdx === 1 ? 6 : 0)} 300, 250 245, 278 212
                    C 308 176, 378 168, 456 172 Z`}
                fill={throatFill}
                stroke="#fb7185"
                strokeWidth="2.2"
              />

              {/* Animated Food Bolus / Saliva Flow moving into Esophagus */}
              {[0, 1, 2].map((i) => {
                const t = Math.max(0, (((flowPhase + i * 0.33) % 1) + 1) % 1);
                const fx = 428 - t * 155;
                const fy = 186 + Math.pow(t, 1.7) * 162;
                const r = activeIdx === 0 ? 7.5 : activeIdx === 1 ? 4.5 : 2.5;
                return (
                  <g key={`flow_${i}`} opacity={salivaAlpha}>
                    <circle cx={fx} cy={fy} r={r} fill="#38bdf8" />
                    <circle cx={fx - 1.5} cy={fy - 1.5} r={r * 0.35} fill="#e0f2fe" />
                  </g>
                );
              })}

              {/* Parotid Salivary Gland (Front-below ear, swells dramatically in Stage 2-3) */}
              <g transform={`translate(286, 224) scale(${swellScale})`}>
                {/* Inflammatory glow halo in Infection / Parotitis */}
                {activeIdx > 0 && (
                  <circle
                    cx="0"
                    cy="0"
                    r={38 + pulse * 4}
                    fill={parotidFill}
                    opacity={activeIdx === 2 ? 0.32 : 0.18}
                  />
                )}
                <circle cx="-8" cy="-6" r="17" fill={parotidFill} opacity="0.92" />
                <circle cx="12" cy="-2" r="16" fill={parotidFill} opacity="0.9" />
                <circle cx="2" cy="12" r="18" fill={parotidFill} opacity="0.94" />
                <circle cx="-2" cy="2" r="9" fill="#ffe4e6" opacity={activeIdx === 2 ? 0.45 : 0.2} />
              </g>

              {/* Stensen Duct connecting Parotid Gland toward Upper Cheek / Mouth */}
              <path
                d="M 304 214 Q 368 202 426 196"
                fill="none"
                stroke={parotidFill}
                strokeWidth={activeIdx === 0 ? 5.5 : activeIdx === 1 ? 3.5 : 2.2}
                strokeLinecap="round"
                opacity={activeIdx === 2 ? 0.55 : 0.9}
              />

              {/* Pain / Heat Radiating Waves in Throat & Jaw during Parotitis */}
              {activeIdx >= 1 && (
                <g
                  opacity={(activeIdx === 2 ? 0.85 : 0.45) + pulse * 0.15}
                  stroke="#f87171"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                >
                  <path d={`M ${342 + pulse * 4} 230 Q ${356 + pulse * 6} 245 ${340 + pulse * 4} 262`} />
                  <path d={`M ${360 + pulse * 6} 224 Q ${378 + pulse * 8} 246 ${358 + pulse * 6} 268`} />
                </g>
              )}

              {/* Animated Paramyxovirus / Mumps Particles invading Parotid & Throat */}
              {Array.from({ length: virusCount }).map((_, vi) => {
                const vx =
                  262 +
                  (vi % 3) * 32 +
                  Math.sin(phaseTick * 3.1 + vi * 1.4) * 10;
                const vy =
                  198 +
                  Math.floor(vi / 3) * 38 +
                  Math.cos(phaseTick * 2.7 + vi) * 7;
                const vSc = 0.88 + Math.sin(phaseTick * 4.5 + vi) * 0.1;
                return (
                  <g key={`virus_${vi}`} transform={`translate(${vx}, ${vy}) scale(${vSc})`}>
                    <circle cx="0" cy="0" r="10.5" fill="#22d3ee" stroke="#ecfeff" strokeWidth="1.4" />
                    <circle cx="-3.5" cy="-2" r="2.2" fill="#082f49" />
                    <circle cx="3.5" cy="-2" r="2.2" fill="#082f49" />
                    <path d="M -3.5 3.5 Q 0 6 3.5 3.5" stroke="#082f49" strokeWidth="1.5" fill="none" />
                  </g>
                );
              })}

              {/* Clean Outside Pointer Callouts (Zero overlap with organs/walls) */}
              <g>
                <line x1="274" y1="210" x2="88" y2="128" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="78" y="108" fill="#7dd3fc" fontSize="13" fontWeight="800" textAnchor="middle">
                  Kelenjar Parotis
                </text>
                <text x="78" y="124" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                  {activeIdx === 2 ? '(Bengkak Parah)' : activeIdx === 1 ? '(Meradang)' : '(Normal)'}
                </text>
              </g>

              <g>
                <line x1="468" y1="184" x2="575" y2="145" stroke="#fde68a" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="582" y="138" fill="#fde68a" fontSize="13" fontWeight="800" textAnchor="start">
                  Rongga Mulut
                </text>
                <text x="582" y="154" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="start">
                  &amp; Saluran Ludah
                </text>
              </g>

              <g>
                <line x1="278" y1="305" x2="550" y2="288" stroke="#fda4af" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="556" y="284" fill="#fda4af" fontSize="13" fontWeight="800" textAnchor="start">
                  Terowongan
                </text>
                <text x="556" y="300" fill="#fda4af" fontSize="13" fontWeight="800" textAnchor="start">
                  Tenggorokan
                </text>
              </g>

              <text x="360" y="390" fill="#fecdd3" fontSize="13" fontWeight="700" textAnchor="middle">
                {activeIdx === 0
                  ? 'Aliran Ludah Lancar — Pipi & Tenggorokan Nyaman Saat Menelan'
                  : activeIdx === 1
                    ? 'Virus Paramyxovirus Menginfeksi Kelenjar Parotis Lewat Tenggorokan'
                    : 'Kelenjar Parotis Membengkak Besar & Menekan Jalur Menelan (Parotitis)'}
              </text>
            </svg>

            {/* Stage Narrative Caption + Physiological Readouts */}
            <div className="mt-4 pt-4 border-t border-[#fda4af]/15">
              <h2 className="text-lg font-extrabold text-[#fde68a] mb-1">
                {stage.indexLabel}. {stage.title}
              </h2>
              <p className="text-sm text-[#ffe4e6] leading-relaxed mb-3">
                {stage.caption}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-[#fda4af]/10">
                <div>
                  <div className="text-[#94a3b8] font-medium">Ukuran Kelenjar Parotis</div>
                  <div className="font-bold text-[#7dd3fc] mt-0.5">{stage.glandSize}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Kondisi Tenggorokan</div>
                  <div className="font-bold text-white mt-0.5">{stage.throatState}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Aktivitas Virus</div>
                  <div className="font-bold text-[#bef264] mt-0.5">{stage.virusActivity}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Structured Medical Explanation of Gondongan / Parotitis (5 columns) */}
        <aside
          data-testid="parotitis-explanation"
          className="lg:col-span-5 flex flex-col gap-5 text-sm leading-relaxed"
        >
          <div>
            <h2 className="text-lg font-black text-[#fde68a] mb-1.5">
              Apa itu Penyakit Gondongan (Parotitis)?
            </h2>
            <p className="text-[#ffe4e6]">
              <strong>Gondongan (Parotitis)</strong> adalah peradangan dan pembengkakan akut pada{' '}
              <strong className="text-[#7dd3fc]">kelenjar ludah parotis</strong> (terletak di sisi
              pipi tepat di depan/bawah telinga dekat pangkal tenggorokan) akibat infeksi virus{' '}
              <em>Paramyxovirus (Mumps)</em>.
            </p>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#fda4af] mb-2">
              Penyebab &amp; Cara Penularan
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                <strong>Infeksi virus Mumps</strong> yang menyebar lewat percikan air liur
                (<em>droplet</em>) saat penderita batuk, bersin, atau berbicara.
              </li>
              <li>
                <strong>Kontak alat makan/minum bersama</strong> yang terkontaminasi saliva di
                mulut dan tenggorokan.
              </li>
              <li>
                <strong>Belum menerima imunisasi MMR</strong> (Measles, Mumps, Rubella) atau daya
                tahan tubuh sedang menurun.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#bef264] mb-2">
              Gejala &amp; Dampak di Pencernaan Awal
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                Pipi dan rahang bawah membengkak disertai{' '}
                <strong className="text-[#bef264]">nyeri hebat saat mengunyah &amp; menelan</strong>{' '}
                di terowongan tenggorokan.
              </li>
              <li>
                Saluran Stensen tertekan sehingga aliran air liur (amilase) berkurang, mulut terasa
                kering, demam, dan pegal otot.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#7dd3fc] mb-1.5">
              Pencegahan &amp; Penanganan
            </h3>
            <p className="text-[#ffe4e6]">
              Cegah dengan <strong>vaksinasi MMR</strong>, biasakan mencuci tangan, dan hindari
              berbagi alat makan. Jika terkena gondongan, istirahat cukup, perbanyak minum air,
              kompres area pipi yang bengkak, serta pilih makanan lunak yang mudah melewati
              kerongkongan.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
