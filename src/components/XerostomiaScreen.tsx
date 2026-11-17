import React, { useEffect, useState } from 'react';

interface XerostomiaScreenProps {
  onClose: () => void;
}

type StageId = 'normal' | 'decline' | 'xerostomia';

interface StageDetail {
  id: StageId;
  indexLabel: string;
  title: string;
  caption: string;
  salivaLevel: string;
  mucosaState: string;
  germActivity: string;
}

const STAGES: StageDetail[] = [
  {
    id: 'normal',
    indexLabel: '01',
    title: 'Kondisi Rongga Mulut Normal',
    caption:
      'Kelenjar ludah (parotis, submandibula, sublingual) aktif memproduksi saliva kaya air dan enzim amilase untuk melumasi makanan serta membilas kuman.',
    salivaLevel: 'Optimal (1–1,5 L / hari)',
    mucosaState: 'Lembap & terlindungi lapisan mukus',
    germActivity: 'Terkendali oleh antibodi & lisozim',
  },
  {
    id: 'decline',
    indexLabel: '02',
    title: 'Penurunan Sekresi Kelenjar Ludah',
    caption:
      'Dehidrasi, gangguan saraf otonom, bernapas lewat mulut, atau efek samping obat menghambat sinyal rangsangan sehingga saluran ludah menyempit.',
    salivaLevel: 'Menurun Drastis',
    mucosaState: 'Mulai mengering & lengket',
    germActivity: 'Kuman mulai menempel di celah gigi',
  },
  {
    id: 'xerostomia',
    indexLabel: '03',
    title: 'Terjadinya Penyakit Serostomia (Mulut Kering)',
    caption:
      'Tanpa bilasan air liur, permukaan lidah tampak pecah-pecah kering, makanan sulit ditelan (disfagia), kerja enzim amilase terhambat, dan koloni kuman berkembang pesat.',
    salivaLevel: 'Sangat Rendah / Kering',
    mucosaState: 'Lidah retak, perih & rentan sariawan',
    germActivity: 'Berkembang cepat (bau mulut & karies)',
  },
];

export const XerostomiaScreen: React.FC<XerostomiaScreenProps> = ({ onClose }) => {
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
  const pulse = Math.sin(phaseTick * 3.4);
  const flowPhase = phaseTick % 1;

  // Dynamic biological visual parameters per stage
  const salivaOpacity = activeIdx === 0 ? 0.95 : activeIdx === 1 ? 0.38 : 0.08;
  const glandFill = activeIdx === 0 ? '#38bdf8' : activeIdx === 1 ? '#fbbf24' : '#f87171';
  const tongueFill = activeIdx === 0 ? '#fb7185' : activeIdx === 1 ? '#f43f5e' : '#be123c';
  const mouthBg = activeIdx === 0 ? '#4c1124' : activeIdx === 1 ? '#45121d' : '#3a0d14';
  const crackOpacity = activeIdx === 0 ? 0 : activeIdx === 1 ? 0.45 : 0.95;
  const germScale = activeIdx === 0 ? 0.52 : activeIdx === 1 ? 0.85 : 1.25;
  const germCount = activeIdx === 0 ? 2 : activeIdx === 1 ? 4 : 6;

  return (
    <div
      data-testid="xerostomia-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Animasi dan Penjelasan Penyakit Serostomia"
      className="fixed inset-0 z-40 overflow-y-auto bg-[#12070c] text-[#fff5f2] flex flex-col justify-between"
    >
      {/* Top Editorial Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#fda4af]/15">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[#7dd3fc]">
            Edukasi Gangguan Sistem Pencernaan · Rongga Mulut
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fde68a]">
            Penyakit Serostomia (Xerostomia / Mulut Kering)
          </h1>
        </div>

        <button
          type="button"
          data-testid="xerostomia-close-btn"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer transition-colors"
        >
          Kembali ke Rongga Mulut [Space / Esc]
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
                  data-testid={`xero-stage-${st.id}`}
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
                  {st.indexLabel}. {st.id === 'normal' ? 'Mulut Normal' : st.id === 'decline' ? 'Penurunan Ludah' : 'Serostomia'}
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
            data-testid="xerostomia-animation-canvas"
            className="rounded-2xl border border-[#fda4af]/25 bg-[#1b0a12] p-4 shadow-2xl"
          >
            <svg
              viewBox="0 0 720 410"
              className="w-full h-auto rounded-xl overflow-hidden"
              aria-label={`Animasi tahap ${stage.title}`}
            >
              {/* Clinical Slate-Crimson Backdrop */}
              <rect x="0" y="0" width="720" height="410" fill="#160910" />

              {/* Oral Cavity Cross-Section Outer Cheek Wall */}
              <path
                d="M 105 95 C 210 55, 450 55, 575 110 C 645 145, 650 270, 565 318 C 445 370, 210 368, 105 322 Z"
                fill={mouthBg}
                stroke="#f472b6"
                strokeWidth="3"
              />

              {/* Upper Palate & Enamel Teeth Row */}
              <path
                d="M 135 120 Q 345 86 545 130 L 545 152 Q 345 115 135 148 Z"
                fill="#e11d48"
                opacity="0.85"
              />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const tx = 165 + i * 52;
                const dryTint = activeIdx === 2 ? '#fef08a' : '#fffbeb';
                return (
                  <rect
                    key={`ut_${i}`}
                    x={tx}
                    y={132 + Math.sin((i / 6) * Math.PI) * -6}
                    width="36"
                    height="28"
                    rx="8"
                    fill={dryTint}
                    stroke="#d6d3d1"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Lower Teeth Row */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const tx = 165 + i * 52;
                const dryTint = activeIdx === 2 ? '#fef08a' : '#fffbeb';
                return (
                  <rect
                    key={`lt_${i}`}
                    x={tx}
                    y={268}
                    width="36"
                    height="26"
                    rx="8"
                    fill={dryTint}
                    stroke="#d6d3d1"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Parotid & Submandibular Salivary Glands (Pulsing) */}
              <g transform={`translate(95, 165) scale(${1 + pulse * (activeIdx === 0 ? 0.06 : 0.02)})`}>
                <circle cx="0" cy="0" r="32" fill={glandFill} opacity="0.28" />
                <circle cx="-8" cy="-8" r="14" fill={glandFill} />
                <circle cx="12" cy="-4" r="13" fill={glandFill} />
                <circle cx="2" cy="12" r="14" fill={glandFill} />
                <text x="-72" y="-44" fill="#e2e8f0" fontSize="12" fontWeight="700">
                  Kelenjar Ludah
                </text>
              </g>

              {/* Salivary Duct Tube into Mouth */}
              <path
                d="M 122 172 Q 175 180 220 195"
                fill="none"
                stroke={glandFill}
                strokeWidth={activeIdx === 0 ? 8 : activeIdx === 1 ? 4.5 : 2.5}
                strokeLinecap="round"
                opacity={activeIdx === 2 ? 0.45 : 0.9}
              />

              {/* Lower Sublingual Gland */}
              <g transform={`translate(225, 318) scale(${1 + pulse * (activeIdx === 0 ? 0.05 : 0.015)})`}>
                <ellipse cx="0" cy="0" rx="34" ry="15" fill={glandFill} opacity="0.85" />
                <path
                  d="M 12 -10 Q 32 -30 58 -48"
                  fill="none"
                  stroke={glandFill}
                  strokeWidth={activeIdx === 0 ? 6 : 2.5}
                  strokeLinecap="round"
                />
              </g>

              {/* Flowing Blue Saliva Droplets & Amylase Particles */}
              {[0, 1, 2, 3, 4].map((d) => {
                const t = (flowPhase + d * 0.2) % 1;
                const sx = 215 + t * 290;
                const sy = 195 + Math.sin(t * Math.PI * 2 + d) * 18;
                const dropR = activeIdx === 0 ? 8.5 : activeIdx === 1 ? 4.5 : 1.5;
                return (
                  <g key={`drop_${d}`} opacity={salivaOpacity}>
                    <circle cx={sx} cy={sy} r={dropR} fill="#38bdf8" />
                    <circle cx={sx - 2} cy={sy - 2} r={dropR * 0.35} fill="#e0f2fe" />
                  </g>
                );
              })}

              {/* Food Bolus inside Oral Cavity (Smoothly coated vs Stuck & Dry) */}
              <g
                transform={`translate(${435 + (activeIdx === 0 ? Math.sin(phaseTick * 2.2) * 18 : Math.sin(phaseTick * 9) * 2)}, ${212 + (activeIdx === 0 ? Math.cos(phaseTick * 2.2) * 5 : 10)})`}
              >
                <circle
                  r="26"
                  fill="#d97706"
                  stroke={activeIdx === 0 ? '#7dd3fc' : '#f87171'}
                  strokeWidth={activeIdx === 0 ? 4 : 2.5}
                />
                <text x="-20" y="4" fill="#fffbeb" fontSize="11" fontWeight="800">
                  Bolus
                </text>
              </g>

              {/* Muscular Tongue Body */}
              <path
                d="M 165 268 Q 345 206 520 264 Q 355 292 165 268 Z"
                fill={tongueFill}
                stroke="#fda4af"
                strokeWidth="2"
              />

              {/* Moisture Sheens in Stage 1 vs Dry Tongue Fissures / Cracks in Stage 2-3 */}
              {activeIdx === 0 && (
                <g opacity={0.65 + pulse * 0.2}>
                  <ellipse cx="305" cy="242" rx="52" ry="7" fill="#bae6fd" />
                  <ellipse cx="425" cy="248" rx="34" ry="5" fill="#bae6fd" />
                </g>
              )}

              <g opacity={crackOpacity} stroke="#450a0a" strokeWidth="2.8" fill="none" strokeLinecap="round">
                <path d="M 245 258 L 265 243 L 282 256 L 302 238" />
                <path d="M 332 235 L 348 253 L 368 237 L 390 255" />
                <path d="M 412 243 L 434 257 L 456 244 L 478 256" />
                <path d="M 295 264 L 325 256 M 385 264 L 420 258" />
              </g>

              {/* Heat / Dryness Ripples in Xerostomia Stage */}
              {activeIdx === 2 && (
                <g opacity={0.65 + pulse * 0.25} stroke="#fb7185" strokeWidth="2" fill="none">
                  <path d={`M 255 ${198 - ((phaseTick * 18) % 18)} Q 265 186 255 174`} />
                  <path d={`M 355 ${194 - ((phaseTick * 18) % 18)} Q 365 182 355 170`} />
                  <path d={`M 485 ${202 - ((phaseTick * 18) % 18)} Q 495 190 485 178`} />
                </g>
              )}

              {/* Animated Oral Germs / Kuman Multiplying When Saliva Drops */}
              {Array.from({ length: germCount }).map((_, gi) => {
                const gx = 195 + gi * 56 + Math.sin(phaseTick * 2.8 + gi) * 8;
                const gy = (gi % 2 === 0 ? 156 : 262) + Math.cos(phaseTick * 3.1 + gi) * 4;
                const gSc = germScale * (0.9 + Math.sin(phaseTick * 4 + gi) * 0.08);
                return (
                  <g key={`germ_${gi}`} transform={`translate(${gx}, ${gy}) scale(${gSc})`}>
                    <circle cx="0" cy="0" r="13" fill="#84cc16" stroke="#ecfccb" strokeWidth="1.5" />
                    <circle cx="-4" cy="-3" r="3" fill="#ffffff" />
                    <circle cx="4" cy="-3" r="3" fill="#ffffff" />
                    <circle cx="-4" cy="-3" r="1.5" fill="#1a2e05" />
                    <circle cx="4" cy="-3" r="1.5" fill="#1a2e05" />
                    <path d="M -5 4 Q 0 8 5 4" stroke="#1a2e05" strokeWidth="1.8" fill="none" />
                  </g>
                );
              })}

              {/* Legend Labels Inside Diagram */}
              <text x="348" y="64" fill="#fde68a" fontSize="13" fontWeight="800" textAnchor="middle">
                Gigi &amp; Langit-Langit Mulut
              </text>
              <text x="360" y="386" fill="#fecdd3" fontSize="13" fontWeight="700" textAnchor="middle">
                {activeIdx === 0
                  ? 'Air Liur + Amilase Membasahi Makanan & Membilas Kuman'
                  : activeIdx === 1
                    ? 'Sekresi Ludah Melemah — Mukosa Kehilangan Pelumas'
                    : 'Lidah Pecah Kering & Kuman Berkembang Akibat Serostomia'}
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
                  <div className="text-[#94a3b8] font-medium">Produksi Saliva</div>
                  <div className="font-bold text-[#7dd3fc] mt-0.5 tabular-nums">
                    {stage.salivaLevel}
                  </div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Kondisi Mukosa</div>
                  <div className="font-bold text-white mt-0.5">{stage.mucosaState}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Aktivitas Kuman</div>
                  <div className="font-bold text-[#bef264] mt-0.5">{stage.germActivity}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Structured Medical & Educational Explanation of Xerostomia (5 columns) */}
        <aside
          data-testid="xerostomia-explanation"
          className="lg:col-span-5 flex flex-col gap-5 pt-1"
        >
          <div>
            <h2 className="text-lg font-extrabold text-[#fde68a] mb-1.5">
              Apa itu Penyakit Serostomia?
            </h2>
            <p className="text-sm text-[#ffe4e6]/90 leading-relaxed">
              <strong className="text-white">Serostomia (Xerostomia)</strong> adalah kondisi medis
              ketika rongga mulut terasa sangat kering akibat kelenjar ludah gagal memproduksi cukup{' '}
              <strong className="text-[#7dd3fc]">air liur (saliva)</strong>.
            </p>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-sm font-extrabold text-[#fda4af] mb-2">
              Penyebab &amp; Gangguan Stimulus
            </h3>
            <ul className="space-y-2 text-sm text-[#ffe4e6]/90 leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-white">Dehidrasi tubuh</strong> sehingga bahan baku cairan ludah berkurang drastis.
              </li>
              <li>
                <strong className="text-white">Gangguan refleks saraf otonom</strong> atau stres yang menekan rangsangan ke kelenjar parotis dan submandibula.
              </li>
              <li>
                <strong className="text-white">Efek samping obat-obatan</strong>, bernapas lewat mulut saat tidur, serta terapi radiasi area leher/kepala.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-sm font-extrabold text-[#bef264] mb-2">
              Dampak bagi Pencernaan &amp; Kuman Mulut
            </h3>
            <ul className="space-y-2 text-sm text-[#ffe4e6]/90 leading-relaxed list-disc pl-5">
              <li>
                Pencernaan karbohidrat oleh <strong className="text-white">enzim Amilase (ptialin)</strong> melambat dan makanan sulit ditelan (<em>disfagia</em>).
              </li>
              <li>
                Tanpa efek pembilas &amp; zat antibakteri alami (<em>lisozim</em>),{' '}
                <strong className="text-[#bef264]">kuman mulut berkembang cepat</strong> memicu bau mulut, sariawan, dan gigi berlubang.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-sm font-extrabold text-[#7dd3fc] mb-1.5">
              Pencegahan &amp; Penanganan
            </h3>
            <p className="text-sm text-[#ffe4e6]/90 leading-relaxed">
              Perbanyak minum air putih secara berkala, kunyah makanan kaya serat atau permen karet bebas gula untuk merangsang stimulus mekanik ludah, serta jaga kebersihan gigi dan lidah.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
