import React, { useEffect, useState } from 'react';

interface MaagScreenProps {
  onClose: () => void;
}

type StageId = 'normal' | 'erosion' | 'maag';

interface StageDetail {
  id: StageId;
  indexLabel: string;
  title: string;
  caption: string;
  mucusState: string;
  wallCondition: string;
  acidImpact: string;
}

const STAGES: StageDetail[] = [
  {
    id: 'normal',
    indexLabel: '01',
    title: 'Dinding Lambung & Lapisan Mukus Normal',
    caption:
      'Sel mukosa lambung dilapisi lendir mukus bikarbonat tebal yang menjadi perisai pelindung agar asam lambung (HCl) tidak melukai dinding lambung.',
    mucusState: 'Tebal, Utuh & Terlindung',
    wallCondition: 'Mukosa sehat berwarna merah muda halus',
    acidImpact: 'Hanya mencerna makanan (tidak melukai sel)',
  },
  {
    id: 'erosion',
    indexLabel: '02',
    title: 'Pengikisan Mukus & Infeksi H. pylori',
    caption:
      'Telat makan, stres berat, konsumsi obat antinyeri (OAINS) berlebihan, atau infeksi bakteri H. pylori membuat lapisan mukus menipis sehingga asam HCl mulai mengikis mukosa.',
    mucusState: 'Menipis & Berlubang',
    wallCondition: 'Mulai memerah, bengkak & teriritasi',
    acidImpact: 'Asam HCl menembus ke jaringan epitel',
  },
  {
    id: 'maag',
    indexLabel: '03',
    title: 'Terjadinya Penyakit Maag / Mag (Gastritis & Tukak)',
    caption:
      'Dinding lambung meradang hebat hingga terbentuk luka tukak lambung (ulkus). Penderita mengalami nyeri perih melilit di ulu hati, mual, cepat kenyang, dan perut kembung.',
    mucusState: 'Rusak / Terbuka di Area Tukak',
    wallCondition: 'Radang merah & luka tukak terbuka',
    acidImpact: 'Mengiritasi ujung saraf — nyeri perih hebat',
  },
];

export const MaagScreen: React.FC<MaagScreenProps> = ({ onClose }) => {
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
  const flowPhase = Math.max(0, ((phaseTick % 1) + 1) % 1);

  // Dynamic visual state of the gastric wall cross-section
  const mucusThickness = activeIdx === 0 ? 22 : activeIdx === 1 ? 10 : 4;
  const mucusOpacity = activeIdx === 0 ? 0.88 : activeIdx === 1 ? 0.52 : 0.25;
  const ulcerDepth = activeIdx === 0 ? 0 : activeIdx === 1 ? 16 : 38;
  const pyloriCount = activeIdx === 0 ? 0 : activeIdx === 1 ? 2 : 5;

  return (
    <div
      data-testid="maag-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Animasi dan Penjelasan Penyakit Maag (Gastritis)"
      className="fixed inset-0 z-40 overflow-y-auto bg-[#12070c] text-[#fff5f2] flex flex-col justify-between"
    >
      {/* Top Editorial Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#fda4af]/15">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[#c084fc]">
            Edukasi Gangguan Sistem Pencernaan · Dinding Mukosa Lambung
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fde68a]">
            Penyakit Maag / Mag (Gastritis &amp; Tukak Lambung)
          </h1>
        </div>

        <button
          type="button"
          data-testid="maag-close-btn"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer transition-colors"
        >
          Kembali ke Usus Besar [Space / Esc]
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
                  data-testid={`maag-stage-${st.id}`}
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
                    ? 'Lambung Normal'
                    : st.id === 'erosion'
                      ? 'Pengikisan Mukus'
                      : 'Maag (Gastritis)'}
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

          {/* High-Contrast Biological Animation Canvas: Cross-Section of Gastric Wall */}
          <div
            data-testid="maag-animation-canvas"
            className="rounded-2xl border border-[#fda4af]/25 bg-[#1b0a12] p-4 shadow-2xl"
          >
            <svg
              viewBox="0 0 720 410"
              className="w-full h-auto rounded-xl overflow-hidden"
              aria-label={`Animasi tahap ${stage.title}`}
            >
              <rect x="0" y="0" width="720" height="410" fill="#160910" />

              {/* Gastric Lumen (Liquid Acid Pool Filling Middle Cavity, leaving clean header room for callouts) */}
              <path
                d={`M 95 126 L 625 126 L 625 225
                    Q 515 ${215 + pulse * 4}, 360 225
                    Q 210 ${235 - pulse * 4}, 95 225 Z`}
                fill="#78350f"
                opacity="0.45"
              />

              {/* Swirling HCl Acid Particles attacking Gastric Wall */}
              {[0, 1, 2, 3, 4, 5].map((ai) => {
                const t = Math.max(0, (((flowPhase + ai * 0.16) % 1) + 1) % 1);
                const ax = 155 + ai * 82 + Math.sin(phaseTick * 2.5 + ai) * 14;
                const ay =
                  activeIdx === 0
                    ? 168 + Math.sin(t * Math.PI * 2 + ai) * 22
                    : 148 + t * (72 + ulcerDepth * 0.55);
                return (
                  <g key={`hcl_${ai}`} opacity={0.85}>
                    <circle cx={ax} cy={ay} r={activeIdx === 2 ? 7.5 : 5.5} fill="#fbbf24" />
                    <text
                      x={ax}
                      y={ay + 2.5}
                      fill="#451a03"
                      fontSize="6.5"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      H+
                    </text>
                  </g>
                );
              })}

              {/* Animated Protective Blue Mucus Bicarbonate Layer (Thins & Cracks in Erosion / Maag) */}
              {activeIdx === 0 ? (
                <path
                  d={`M 95 210 Q 225 202, 360 210 Q 495 218, 625 210 L 625 ${210 + mucusThickness} L 95 ${210 + mucusThickness} Z`}
                  fill="#38bdf8"
                  opacity={mucusOpacity}
                />
              ) : (
                <>
                  <path
                    d={`M 95 212 Q 190 208, 295 216 L 295 ${216 + mucusThickness} L 95 ${216 + mucusThickness} Z`}
                    fill="#38bdf8"
                    opacity={mucusOpacity}
                  />
                  <path
                    d={`M 425 216 Q 525 208, 625 212 L 625 ${212 + mucusThickness} L 425 ${212 + mucusThickness} Z`}
                    fill="#38bdf8"
                    opacity={mucusOpacity}
                  />
                </>
              )}

              {/* Underlying Muscular Gastric Wall & Mucosa (Crater Ulcer Eaten Away in Stage 2-3) */}
              <path
                d={`M 95 228
                    L 292 228
                    C 315 228, 326 ${228 + ulcerDepth}, 360 ${228 + ulcerDepth}
                    C 394 ${228 + ulcerDepth}, 405 228, 428 228
                    L 625 228
                    L 625 342
                    L 95 342 Z`}
                fill={activeIdx === 2 ? '#991b1b' : activeIdx === 1 ? '#be123c' : '#e11d48'}
                stroke="#fda4af"
                strokeWidth="2.5"
              />

              {/* Red Inflammatory Wound Rim & Pain Radiating Arcs inside Ulcer Crater */}
              {activeIdx >= 1 && (
                <g>
                  <ellipse
                    cx="360"
                    cy={236 + ulcerDepth * 0.45}
                    rx={activeIdx === 2 ? 56 + pulse * 5 : 34 + pulse * 3}
                    ry={activeIdx === 2 ? 24 + pulse * 3 : 12 + pulse * 2}
                    fill="#ef4444"
                    opacity={activeIdx === 2 ? 0.55 : 0.3}
                  />
                  <path
                    d={`M 328 ${248 + ulcerDepth * 0.6} Q 360 ${266 + ulcerDepth * 0.6} 392 ${248 + ulcerDepth * 0.6}`}
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="2.4"
                    strokeDasharray="4 4"
                    opacity={0.7 + pulse * 0.25}
                  />
                </g>
              )}

              {/* Animated Helicobacter pylori Violet Bacteria Invading Ulcer Site */}
              {Array.from({ length: pyloriCount }).map((_, bi) => {
                const bx = 312 + bi * 24 + Math.sin(phaseTick * 3.0 + bi) * 8;
                const by = 196 + ulcerDepth * 0.55 + Math.cos(phaseTick * 3.4 + bi) * 7;
                return (
                  <g key={`pylori_${bi}`} transform={`translate(${bx}, ${by})`}>
                    <ellipse cx="0" cy="0" rx="11" ry="8" fill="#a855f7" stroke="#f3e8ff" strokeWidth="1.4" />
                    <circle cx="-3.5" cy="-1.5" r="2" fill="#ffffff" />
                    <circle cx="3.5" cy="-1.5" r="2" fill="#ffffff" />
                    <circle cx="-3.5" cy="-1.5" r="1" fill="#2e1065" />
                    <circle cx="3.5" cy="-1.5" r="1" fill="#2e1065" />
                  </g>
                );
              })}

              {/* Clean Outside Pointer Callouts (Zero overlap with acid pool or ions) */}
              <g>
                <line x1="210" y1="214" x2="168" y2="104" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="168" y="76" fill="#7dd3fc" fontSize="13" fontWeight="800" textAnchor="middle">
                  Lapisan Mukus Pelindung
                </text>
                <text x="168" y="92" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                  {activeIdx === 0 ? '(Tebal & Kuat)' : activeIdx === 1 ? '(Menipis)' : '(Terkikis)'}
                </text>
              </g>

              <g>
                <line x1="510" y1="158" x2="545" y2="104" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="548" y="76" fill="#fde68a" fontSize="13" fontWeight="800" textAnchor="middle">
                  Asam Lambung (HCl)
                </text>
                <text x="548" y="92" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                  &amp; Enzim Pepsin
                </text>
              </g>

              <text x="360" y="302" fill="#fff1f2" fontSize="13" fontWeight="800" textAnchor="middle">
                {activeIdx === 2
                  ? 'Luka Tukak Lambung & Peradangan Mukosa (Maag Akut)'
                  : 'Jaringan Dinding Mukosa & Otot Lambung'}
              </text>

              <text x="360" y="390" fill="#fecdd3" fontSize="13" fontWeight="700" textAnchor="middle">
                {activeIdx === 0
                  ? 'Perisai Mukus Bikarbonat Melindungi Dinding Lambung dari Asam HCl'
                  : activeIdx === 1
                    ? 'Mukus Menipis — Asam Lambung & H. pylori Mulai Mengikis Dinding'
                    : 'Dinding Lambung Terluka & Meradang Memicu Nyeri Perih Maag (Gastritis)'}
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
                  <div className="text-[#94a3b8] font-medium">Lapisan Mukus</div>
                  <div className="font-bold text-[#7dd3fc] mt-0.5">{stage.mucusState}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Kondisi Dinding</div>
                  <div className="font-bold text-white mt-0.5">{stage.wallCondition}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Dampak Asam HCl</div>
                  <div className="font-bold text-[#c084fc] mt-0.5">{stage.acidImpact}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Structured Medical Explanation of Maag / Mag (Gastritis) (5 columns) */}
        <aside
          data-testid="maag-explanation"
          className="lg:col-span-5 flex flex-col gap-5 text-sm leading-relaxed"
        >
          <div>
            <h2 className="text-lg font-black text-[#fde68a] mb-1.5">
              Apa itu Penyakit Maag / Mag (Gastritis)?
            </h2>
            <p className="text-[#ffe4e6]">
              <strong>Maag (Gastritis / Mag)</strong> adalah kondisi peradangan atau pengikisan
              pada <strong className="text-[#c084fc]">lapisan dinding mukosa lambung</strong>{' '}
              akibat melemahnya pelindung mukus sehingga asam lambung (HCl) dan pepsin melukai
              jaringan lambung hingga memicu tukak lambung.
            </p>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#fda4af] mb-2">
              Penyebab Utama Pengikisan Mukosa
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                <strong>Pola makan tidak teratur</strong> atau sering menunda makan sehingga asam
                lambung (HCl) yang kosong mengiritasi mukosa.
              </li>
              <li>
                <strong>Infeksi bakteri <em>Helicobacter pylori</em></strong> yang merusak lapisan
                lendir pelindung dinding lambung.
              </li>
              <li>
                <strong>Konsumsi pemicu iritasi &amp; stres</strong> seperti makanan sangat pedas/asam,
                kafein berlebih, serta penggunaan obat pereda nyeri (OAINS) jangka panjang.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#c084fc] mb-2">
              Gejala &amp; Dampak pada Pencernaan
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                Nyeri perih atau panas melilit di <strong>ulu hati / perut bagian atas</strong>,
                mual, muntah, dan perut mudah kembung.
              </li>
              <li>
                Cepat merasa kenyang saat makan sehingga proses pencernaan protein oleh pepsin
                terganggu dan berisiko menjadi tukak lambung kronis.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#7dd3fc] mb-1.5">
              Pencegahan &amp; Penanganan
            </h3>
            <p className="text-[#ffe4e6]">
              Biasakan <strong>makan teratur tepat waktu</strong> dalam porsi seimbang, kelola stres
              dengan baik, batasi makanan terlalu pedas, asam, atau berkafein tinggi, serta hindari
              minum obat antinyeri saat perut kosong.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
