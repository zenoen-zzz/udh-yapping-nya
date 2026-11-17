import React, { useEffect, useState } from 'react';

interface WasirScreenProps {
  onClose: () => void;
}

type StageId = 'normal' | 'strain' | 'wasir';

interface StageDetail {
  id: StageId;
  indexLabel: string;
  title: string;
  caption: string;
  veinState: string;
  lumenCondition: string;
  symptomRisk: string;
}

const STAGES: StageDetail[] = [
  {
    id: 'normal',
    indexLabel: '01',
    title: 'Pembuluh Vena Rektum & Anus Normal',
    caption:
      'Bantalan pembuluh darah vena di rektum bawah dan saluran anus berada dalam ukuran normal dengan aliran darah lancar, sehingga feses keluar mulus tanpa hambatan maupun nyeri.',
    veinState: 'Kempis, Elastis & Aliran Lancar',
    lumenCondition: 'Saluran anus terbuka leluasa',
    symptomRisk: 'Tidak ada benjolan atau perdarahan',
  },
  {
    id: 'strain',
    indexLabel: '02',
    title: 'Tekanan Mengejan Kuat & Sembelit',
    caption:
      'Feses keras akibat kurang serat/air membuat penderita mengejan keras atau duduk terlalu lama di toilet. Tekanan perut tinggi menghambat aliran balik darah sehingga pleksus vena mulai terbendung.',
    veinState: 'Terbendung & Mulai Melebar',
    lumenCondition: 'Feses keras menekan dinding rektum',
    symptomRisk: 'Rasa penuh & tegang di sekitar anus',
  },
  {
    id: 'wasir',
    indexLabel: '03',
    title: 'Terjadinya Penyakit Wasir / Ambeien (Hemoroid)',
    caption:
      'Pembuluh vena hemoroidalis membengkak hebat dan meradang membentuk tonjolan wasir internal maupun eksternal yang menyumbat saluran anus serta mudah berdarah saat bergesekan dengan feses.',
    veinState: 'Bengkak, Melebar & Meradang',
    lumenCondition: 'Tersumbat tonjolan benjolan wasir',
    symptomRisk: 'Nyeri perih, benjolan & BAB berdarah merah segar',
  },
];

export const WasirScreen: React.FC<WasirScreenProps> = ({ onClose }) => {
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

  // Auto-advance across the 3 biological stages every 4.5s unless paused/manual
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

  // Dynamic physiological states for the rectal/anal venous cushions
  const cushionScale = activeIdx === 0 ? 1.0 : activeIdx === 1 ? 1.48 : 2.15;
  const stoolY = activeIdx === 0 ? 95 + flowPhase * 210 : activeIdx === 1 ? 148 + Math.sin(phaseTick * 5) * 4 : 138 + Math.sin(phaseTick * 4.5) * 3;
  const veinStrokeColor = activeIdx === 2 ? '#fda4af' : activeIdx === 1 ? '#fb7185' : '#60a5fa';
  const veinFillColor = activeIdx === 2 ? '#e11d48' : activeIdx === 1 ? '#be123c' : '#2563eb';

  return (
    <div
      data-testid="wasir-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Animasi dan Penjelasan Penyakit Wasir atau Ambeien"
      className="fixed inset-0 z-40 overflow-y-auto bg-[#12070c] text-[#fff5f2] flex flex-col justify-between"
    >
      {/* Top Editorial Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#fda4af]/15">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[#fb7185]">
            Edukasi Gangguan Sistem Pencernaan · Rektum &amp; Saluran Anus
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fde68a]">
            Penyakit Wasir / Ambeien (Hemoroid)
          </h1>
        </div>

        <button
          type="button"
          data-testid="wasir-close-btn"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer transition-colors"
        >
          Kembali ke Rektum &amp; Anus [Space / Esc]
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
                  data-testid={`wasir-stage-${st.id}`}
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
                    ? 'Vena Normal'
                    : st.id === 'strain'
                      ? 'Tekanan Mengejan'
                      : 'Wasir / Ambeien'}
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

          {/* High-Contrast Biological Animation Canvas: Cross-Section of Rectum & Anal Canal */}
          <div
            data-testid="wasir-animation-canvas"
            className="rounded-2xl border border-[#fda4af]/25 bg-[#1b0a12] p-4 shadow-2xl"
          >
            <svg
              viewBox="0 0 720 410"
              className="w-full h-auto rounded-xl overflow-hidden"
              aria-label={`Animasi tahap ${stage.title}`}
            >
              <rect x="0" y="0" width="720" height="410" fill="#160910" />

              {/* Top Direction Header Label (Clean negative space above canal) */}
              <text x="360" y="34" fill="#fde68a" fontSize="13" fontWeight="800" textAnchor="middle">
                Penampang Rektum Bawah &amp; Saluran Anus
              </text>

              {/* Left & Right Muscular Rectal + Anal Canal Walls */}
              <path
                d="M 215 62 C 218 145, 232 195, 245 255 L 252 332 L 195 332 L 188 62 Z"
                fill="#9f1239"
                stroke="#fda4af"
                strokeWidth="2"
              />
              <path
                d="M 505 62 C 502 145, 488 195, 475 255 L 468 332 L 525 332 L 532 62 Z"
                fill="#9f1239"
                stroke="#fda4af"
                strokeWidth="2"
              />

              {/* Central Rectal Canal Lumen Background */}
              <path
                d="M 215 62 C 218 145, 232 195, 245 255 L 252 332 L 468 332 L 475 255 C 488 195, 502 145, 505 62 Z"
                fill="#290f1a"
              />

              {/* External Anal Sphincter Muscles (Right & Left near bottom verge) */}
              <ellipse cx="235" cy="306" rx="18" ry="12" fill="#be123c" stroke="#fda4af" strokeWidth="1.5" />
              <ellipse cx="485" cy="306" rx="18" ry="12" fill="#be123c" stroke="#fda4af" strokeWidth="1.5" />

              {/* Downward Abdominal Straining Pressure Arrows (Visible in Stage 2 & 3) */}
              {activeIdx >= 1 && (
                <g opacity={0.78 + pulse * 0.2}>
                  {[295, 425].map((ax, idx) => (
                    <g key={`strain_arrow_${idx}`} transform={`translate(${ax}, ${78 + Math.abs(pulse) * 8})`}>
                      <line x1="0" y1="0" x2="0" y2="28" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                      <polygon points="-6,24 6,24 0,34" fill="#fbbf24" />
                    </g>
                  ))}
                  <text x="360" y="72" fill="#fbbf24" fontSize="11.5" fontWeight="800" textAnchor="middle">
                    Tekanan Mengejan Tinggi
                  </text>
                </g>
              )}

              {/* Moving Stool Bolus inside Canal (Smooth in Stage 1, Hard/Blocked in Stage 2-3) */}
              <g transform={`translate(360, ${stoolY})`}>
                <ellipse
                  cx="0"
                  cy="0"
                  rx={activeIdx === 0 ? 34 : 46}
                  ry={activeIdx === 0 ? 22 : 26}
                  fill={activeIdx === 0 ? '#92400e' : '#78350f'}
                  stroke={activeIdx === 0 ? '#d97706' : '#fbbf24'}
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="4"
                  fill="#fef3c7"
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                >
                  {activeIdx === 0 ? 'Feses Lunak' : 'Feses Keras'}
                </text>
              </g>

              {/* Internal Hemorrhoidal Venous Cushions (Upper Anal Canal, Left & Right) */}
              <g>
                <ellipse
                  cx={246 + (cushionScale - 1) * 26}
                  cy="218"
                  rx={16 * cushionScale + (activeIdx === 2 ? pulse * 3 : 0)}
                  ry={22 * (0.85 + cushionScale * 0.22) + (activeIdx === 2 ? pulse * 2.5 : 0)}
                  fill={veinFillColor}
                  stroke={veinStrokeColor}
                  strokeWidth="2.2"
                  opacity="0.94"
                />
                <ellipse
                  cx={474 - (cushionScale - 1) * 26}
                  cy="218"
                  rx={16 * cushionScale + (activeIdx === 2 ? pulse * 3 : 0)}
                  ry={22 * (0.85 + cushionScale * 0.22) + (activeIdx === 2 ? pulse * 2.5 : 0)}
                  fill={veinFillColor}
                  stroke={veinStrokeColor}
                  strokeWidth="2.2"
                  opacity="0.94"
                />
              </g>

              {/* External Hemorrhoidal Cushion Swelling at Anal Verge in Stage 3 */}
              {activeIdx === 2 && (
                <g>
                  <ellipse
                    cx="266"
                    cy="318"
                    rx={23 + pulse * 2.5}
                    ry={14 + pulse * 1.8}
                    fill="#dc2626"
                    stroke="#fecaca"
                    strokeWidth="2"
                  />
                  {/* Bleeding / Inflammation Warning Droplets */}
                  {[0, 1].map((di) => {
                    const dy = 244 + ((flowPhase + di * 0.5) % 1) * 78;
                    return (
                      <circle
                        key={`blood_${di}`}
                        cx={di === 0 ? 302 : 418}
                        cy={dy}
                        r="4.5"
                        fill="#ef4444"
                        stroke="#fecaca"
                        strokeWidth="1"
                      />
                    );
                  })}
                </g>
              )}

              {/* Pulsing Blood Flow Dots Inside Left & Right Veins */}
              {[0, 1, 2].map((vi) => {
                const vt = Math.max(0, (((flowPhase + vi * 0.33) % 1) + 1) % 1);
                const vy = activeIdx === 0 ? 295 - vt * 195 : 238 - Math.sin(vt * Math.PI) * 28;
                return (
                  <g key={`vein_flow_${vi}`}>
                    <circle cx="242" cy={vy} r={activeIdx === 2 ? 4.5 : 3.5} fill="#fca5a5" opacity="0.9" />
                    <circle cx="478" cy={vy} r={activeIdx === 2 ? 4.5 : 3.5} fill="#fca5a5" opacity="0.9" />
                  </g>
                );
              })}

              {/* Clean Outside Left & Right Callout Labels (Zero Overlap With Canal or Veins) */}
              <g>
                <line x1="232" y1="215" x2="152" y2="178" stroke={veinStrokeColor} strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="95" y="156" fill="#7dd3fc" fontSize="12.5" fontWeight="800" textAnchor="middle">
                  Pleksus Vena
                </text>
                <text x="95" y="172" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                  {activeIdx === 0 ? '(Normal & Lancar)' : activeIdx === 1 ? '(Terbendung)' : '(Wasir Internal)'}
                </text>
              </g>

              {activeIdx === 2 ? (
                <g>
                  <line x1="252" y1="318" x2="152" y2="300" stroke="#fda4af" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="95" y="288" fill="#fda4af" fontSize="12.5" fontWeight="800" textAnchor="middle">
                    Wasir Eksternal
                  </text>
                  <text x="95" y="304" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                    (Benjolan di Anus)
                  </text>
                </g>
              ) : (
                <g>
                  <line x1="232" y1="306" x2="152" y2="296" stroke="#fda4af" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="95" y="286" fill="#fda4af" fontSize="12.5" fontWeight="800" textAnchor="middle">
                    Otot Sfingter
                  </text>
                  <text x="95" y="302" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                    (Pintu Anus)
                  </text>
                </g>
              )}

              <g>
                <line x1="490" y1="218" x2="568" y2="180" stroke={veinStrokeColor} strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="625" y="158" fill="#fde68a" fontSize="12.5" fontWeight="800" textAnchor="middle">
                  {activeIdx === 2 ? 'Pembengkakan' : 'Dinding Mukosa'}
                </text>
                <text x="625" y="174" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle">
                  {activeIdx === 0 ? '(Aliran Darah Baik)' : activeIdx === 1 ? '(Tekanan Vena Naik)' : '(Meradang & Berdarah)'}
                </text>
              </g>

              {/* Bottom Status Summary Bar */}
              <text x="360" y="388" fill="#fecdd3" fontSize="13" fontWeight="700" textAnchor="middle">
                {activeIdx === 0
                  ? 'Pembuluh Vena Rektum Normal Menjaga Saluran Anus Lancar Tanpa Nyeri'
                  : activeIdx === 1
                    ? 'Sembelit & Mengejan Berlebih Membendung Aliran Darah Vena di Rektum'
                    : 'Vena Membengkak Membentuk Benjolan Wasir / Ambeien yang Mudah Berdarah'}
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
                  <div className="text-[#94a3b8] font-medium">Kondisi Pembuluh Vena</div>
                  <div className="font-bold text-[#fda4af] mt-0.5">{stage.veinState}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Saluran Rektum &amp; Anus</div>
                  <div className="font-bold text-white mt-0.5">{stage.lumenCondition}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Gejala &amp; Risiko</div>
                  <div className="font-bold text-[#fbbf24] mt-0.5">{stage.symptomRisk}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Structured Medical Explanation of Wasir / Ambeien (5 columns) */}
        <aside
          data-testid="wasir-explanation"
          className="lg:col-span-5 flex flex-col gap-5 text-sm leading-relaxed"
        >
          <div>
            <h2 className="text-lg font-black text-[#fde68a] mb-1.5">
              Apa itu Penyakit Wasir / Ambeien?
            </h2>
            <p className="text-[#ffe4e6]">
              <strong>Wasir atau Ambeien (Hemoroid)</strong> adalah kondisi{' '}
              <strong className="text-[#fb7185]">
                pembengkakan dan peradangan pembuluh darah vena
              </strong>{' '}
              di sekitar rektum bagian bawah dan lubang anus akibat peningkatan tekanan di rongga
              panggul atau rektum.
            </p>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#fda4af] mb-2">
              Penyebab Utama Terjadinya Wasir
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                <strong>Sembelit kronis &amp; feses keras</strong> akibat kurang mengonsumsi serat
                dan air putih sehingga memaksa otot mengejan kuat.
              </li>
              <li>
                <strong>Kebiasaan duduk terlalu lama</strong>, terutama berlama-lama di toilet, yang
                membendung aliran darah balik di pembuluh vena anus.
              </li>
              <li>
                <strong>Tekanan perut meningkat</strong> seperti sering mengangkat beban berat,
                obesitas, atau kehamilan.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#fb7185] mb-2">
              Gejala &amp; Jenis (Internal vs Eksternal)
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                <strong>Wasir Internal</strong> di dalam rektum: umumnya tidak nyeri pada awalnya,
                tetapi menimbulkan <strong>darah merah segar menetes saat BAB</strong> dan dapat
                menonjol keluar jika membesar.
              </li>
              <li>
                <strong>Wasir Eksternal</strong> di bawah kulit sekitar anus: memicu benjolan yang
                terasa <strong>nyeri, gatal, bengkak, dan perih saat duduk</strong>.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#7dd3fc] mb-1.5">
              Pencegahan &amp; Penanganan
            </h3>
            <p className="text-[#ffe4e6]">
              Perbanyak makanan tinggi <strong>serat</strong> (sayur, buah, biji-bijian), minum air
              putih minimal 8 gelas per hari, jangan menahan buang air besar atau mengejan terlalu
              lama, serta lakukan aktivitas fisik ringan secara rutin.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
