import React, { useEffect, useState } from 'react';

interface GerdScreenProps {
  onClose: () => void;
}

type StageId = 'normal' | 'weak' | 'gerd';

interface StageDetail {
  id: StageId;
  indexLabel: string;
  title: string;
  caption: string;
  valveState: string;
  acidBehavior: string;
  esophagusState: string;
}

const STAGES: StageDetail[] = [
  {
    id: 'normal',
    indexLabel: '01',
    title: 'Katup Sfingter Esofagus Normal',
    caption:
      'Otot cincin katup sfingter esofagus bawah (LES) menutup rapat setelah makanan masuk, menahan cairan asam HCl dan enzim pepsin tetap di dalam lambung.',
    valveState: 'Tertutup Rapat & Kuat',
    acidBehavior: 'Tetap di kantong lambung mencerna makanan',
    esophagusState: 'Mukosa sehat & bebas iritasi',
  },
  {
    id: 'weak',
    indexLabel: '02',
    title: 'Pelemahan Katup Sfingter & Tekanan Tinggi',
    caption:
      'Makan terlalu kenyang, makanan tinggi lemak/kafein, atau langsung berbaring meningkatkan tekanan lambung sehingga otot katup sfingter mulai mengendur dan bocor.',
    valveState: 'Mengendur / Celah Terbuka',
    acidBehavior: 'Uap & percikan HCl mulai mendesak ke atas',
    esophagusState: 'Mulai terasa panas & mengganjal di dada',
  },
  {
    id: 'gerd',
    indexLabel: '03',
    title: 'Terjadinya GERD (Refluks Asam Lambung)',
    caption:
      'Katup sfingter terbuka sehingga cairan asam lambung menyembur naik mengiritasi dinding kerongkongan, memicu sensasi terbakar (heartburn) dan rasa asam di tenggorokan.',
    valveState: 'Terbuka Lebar — Gagal Menahan Refluks',
    acidBehavior: 'Menyembur naik deras ke kerongkongan',
    esophagusState: 'Meradang merah & perih (heartburn)',
  },
];

export const GerdScreen: React.FC<GerdScreenProps> = ({ onClose }) => {
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
  const pulse = Math.sin(phaseTick * 4.0);
  const flowPhase = Math.max(0, ((phaseTick % 1) + 1) % 1);

  // Dynamic anatomical animation parameters
  const valveGap = activeIdx === 0 ? 0 : activeIdx === 1 ? 11 + pulse * 2.5 : 25 + pulse * 3;
  const acidWaveY = activeIdx === 0 ? 255 : activeIdx === 1 ? 236 : 216;
  const esophWallStroke = activeIdx === 0 ? '#f472b6' : activeIdx === 1 ? '#fb923c' : '#ef4444';
  const refluxCount = activeIdx === 0 ? 0 : activeIdx === 1 ? 3 : 7;

  return (
    <div
      data-testid="gerd-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Animasi dan Penjelasan Penyakit GERD"
      className="fixed inset-0 z-40 overflow-y-auto bg-[#12070c] text-[#fff5f2] flex flex-col justify-between"
    >
      {/* Top Editorial Header */}
      <header className="w-full max-w-[1200px] mx-auto px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-[#fda4af]/15">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[#fb923c]">
            Edukasi Gangguan Sistem Pencernaan · Lambung &amp; Sfingter Esofagus
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fde68a]">
            Penyakit GERD (Gastroesophageal Reflux Disease)
          </h1>
        </div>

        <button
          type="button"
          data-testid="gerd-close-btn"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-[#240a12] font-extrabold text-sm cursor-pointer transition-colors"
        >
          Kembali ke Lambung [Space / Esc]
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
                  data-testid={`gerd-stage-${st.id}`}
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
                    ? 'Sfingter Normal'
                    : st.id === 'weak'
                      ? 'Katup Melemah'
                      : 'GERD (Refluks)'}
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
            data-testid="gerd-animation-canvas"
            className="rounded-2xl border border-[#fda4af]/25 bg-[#1b0a12] p-4 shadow-2xl"
          >
            <svg
              viewBox="0 0 720 410"
              className="w-full h-auto rounded-xl overflow-hidden"
              aria-label={`Animasi tahap ${stage.title}`}
            >
              <rect x="0" y="0" width="720" height="410" fill="#160910" />

              {/* Esophagus Tube + Giant J-Shaped Stomach Pouch Silhouette */}
              <path
                d="M 326 42
                   L 326 178
                   C 295 196, 260 226, 264 272
                   C 268 326, 332 356, 408 352
                   C 482 348, 535 305, 534 252
                   C 533 206, 488 182, 434 196
                   C 410 202, 390 192, 384 176
                   L 384 42 Z"
                fill="#3d1220"
                stroke={esophWallStroke}
                strokeWidth="3"
              />

              {/* Glowing Esophageal Irritation / Heartburn Lining in Stage 2-3 */}
              {activeIdx >= 1 && (
                <path
                  d="M 332 58 L 332 178 M 378 58 L 378 178"
                  stroke="#ef4444"
                  strokeWidth={activeIdx === 2 ? 7 : 3.5}
                  strokeLinecap="round"
                  opacity={(activeIdx === 2 ? 0.85 : 0.4) + pulse * 0.14}
                />
              )}

              {/* Acid Gastric Pool inside Stomach Chamber */}
              <path
                d={`M 268 ${acidWaveY + 18}
                    Q 335 ${acidWaveY - 6 + pulse * 5}, 400 ${acidWaveY + 6 - pulse * 4}
                    Q 472 ${acidWaveY + 18 + pulse * 5}, 529 ${acidWaveY + 12}
                    C 525 304, 476 344, 408 348
                    C 334 352, 273 324, 268 ${acidWaveY + 18} Z`}
                fill="#f59e0b"
                opacity="0.72"
              />

              {/* Swirling Acid Pool Surface Highlight */}
              <path
                d={`M 278 ${acidWaveY + 14} Q 345 ${acidWaveY - 4 + pulse * 5}, 402 ${acidWaveY + 6 - pulse * 4} Q 465 ${acidWaveY + 15 + pulse * 5}, 520 ${acidWaveY + 10}`}
                fill="none"
                stroke="#fef08a"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Churning Digested Food Chunks inside Stomach */}
              {[
                { bx: 340, by: 298, rx: 14, color: '#d97706' },
                { bx: 410, by: 312, rx: 16, color: '#b45309' },
                { bx: 465, by: 288, rx: 13, color: '#fbbf24' },
              ].map((ch, idx) => (
                <circle
                  key={`chunk_${idx}`}
                  cx={ch.bx + Math.sin(phaseTick * 2.2 + idx * 1.7) * 9}
                  cy={ch.by + Math.cos(phaseTick * 2.6 + idx * 1.2) * 5}
                  r={ch.rx}
                  fill={ch.color}
                  stroke="#fde68a"
                  strokeWidth="1.5"
                />
              ))}

              {/* Lower Esophageal Sphincter (LES) Muscular Valve Flaps */}
              <rect
                x={324}
                y={170}
                width={Math.max(4, 29 - valveGap)}
                height={15}
                rx={6}
                fill={activeIdx === 0 ? '#4ade80' : activeIdx === 1 ? '#fbbf24' : '#ef4444'}
                stroke="#fffbeb"
                strokeWidth="1.2"
              />
              <rect
                x={386 - Math.max(4, 29 - valveGap)}
                y={170}
                width={Math.max(4, 29 - valveGap)}
                height={15}
                rx={6}
                fill={activeIdx === 0 ? '#4ade80' : activeIdx === 1 ? '#fbbf24' : '#ef4444'}
                stroke="#fffbeb"
                strokeWidth="1.2"
              />

              {/* Upward Acid Reflux Jets & Droplets shooting through Sphincter in Weak / GERD */}
              {Array.from({ length: refluxCount }).map((_, ri) => {
                const t = Math.max(0, (((flowPhase + ri * 0.14) % 1) + 1) % 1);
                const rx = 355 + Math.sin(t * 7 + ri * 2.1) * (activeIdx === 2 ? 13 : 6);
                const ry = 225 - t * (activeIdx === 2 ? 172 : 95);
                const rr = activeIdx === 2 ? 6.5 : 4.2;
                return (
                  <g key={`reflux_${ri}`} opacity={1 - t * 0.35}>
                    <circle cx={rx} cy={ry} r={rr} fill="#fb923c" />
                    <circle cx={rx - 1.5} cy={ry - 1.5} r={rr * 0.38} fill="#fef08a" />
                  </g>
                );
              })}

              {/* Heartburn / Burning Ripples beside Upper Esophagus in Stage 3 */}
              {activeIdx === 2 && (
                <g
                  opacity={0.75 + pulse * 0.2}
                  stroke="#fb7185"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                >
                  <path d={`M ${306 - pulse * 3} 102 Q ${294 - pulse * 4} 122 ${306 - pulse * 3} 142`} />
                  <path d={`M ${404 + pulse * 3} 102 Q ${416 + pulse * 4} 122 ${404 + pulse * 3} 142`} />
                </g>
              )}

              {/* Clean Outside Pointer Callouts (Zero overlap with walls/organs) */}
              <g>
                <line x1="322" y1="92" x2="215" y2="82" stroke="#fda4af" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="206" y="78" fill="#fda4af" fontSize="13" fontWeight="800" textAnchor="end">
                  Kerongkongan
                </text>
                <text x="206" y="94" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="end">
                  {activeIdx === 2 ? '(Teriritasi Asam)' : '(Esofagus)'}
                </text>
              </g>

              <g>
                <line x1="320" y1="178" x2="215" y2="178" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="206" y="174" fill="#bef264" fontSize="13" fontWeight="800" textAnchor="end">
                  Katup Sfingter (LES)
                </text>
                <text x="206" y="190" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="end">
                  {activeIdx === 0 ? '(Menutup Rapat)' : activeIdx === 1 ? '(Mengendur)' : '(Bocor / Terbuka)'}
                </text>
              </g>

              <g>
                <line x1="518" y1="274" x2="578" y2="255" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="584" y="250" fill="#fde68a" fontSize="13" fontWeight="800" textAnchor="start">
                  Asam Lambung
                </text>
                <text x="584" y="266" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="start">
                  (HCl &amp; Pepsin)
                </text>
              </g>

              <text x="360" y="390" fill="#fecdd3" fontSize="13" fontWeight="700" textAnchor="middle">
                {activeIdx === 0
                  ? 'Katup Sfingter Tertutup Rapat — Asam HCl Aman di Dalam Lambung'
                  : activeIdx === 1
                    ? 'Katup Sfingter Melemah Akibat Tekanan Lambung Tinggi'
                    : 'Asam Lambung Menyembur Naik ke Kerongkongan Memicu GERD'}
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
                  <div className="text-[#94a3b8] font-medium">Kondisi Katup (LES)</div>
                  <div className="font-bold text-[#fbbf24] mt-0.5">{stage.valveState}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Pergerakan Asam HCl</div>
                  <div className="font-bold text-white mt-0.5">{stage.acidBehavior}</div>
                </div>
                <div>
                  <div className="text-[#94a3b8] font-medium">Dinding Kerongkongan</div>
                  <div className="font-bold text-[#fb923c] mt-0.5">{stage.esophagusState}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Structured Medical Explanation of GERD (5 columns) */}
        <aside
          data-testid="gerd-explanation"
          className="lg:col-span-5 flex flex-col gap-5 text-sm leading-relaxed"
        >
          <div>
            <h2 className="text-lg font-black text-[#fde68a] mb-1.5">
              Apa itu Penyakit GERD?
            </h2>
            <p className="text-[#ffe4e6]">
              <strong>GERD (Gastroesophageal Reflux Disease)</strong> adalah gangguan kronis ketika{' '}
              <strong className="text-[#fb923c]">asam lambung (HCl)</strong> berulang kali mengalir
              naik ke kerongkongan karena melemahnya katup otot{' '}
              <strong>sfingter esofagus bawah (LES)</strong>.
            </p>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#fda4af] mb-2">
              Penyebab &amp; Faktor Pemicu
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                <strong>Melemahnya otot sfingter (LES)</strong> sehingga pintu satu arah antara
                kerongkongan dan lambung gagal menutup rapat.
              </li>
              <li>
                <strong>Kebiasaan langsung berbaring setelah makan</strong> atau makan dalam porsi
                terlalu besar secara mendadak.
              </li>
              <li>
                <strong>Konsumsi pemicu asam</strong> seperti makanan berlemak/pedas berlebihan,
                kafein, cokelat, dan minuman bersoda.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#fbbf24] mb-2">
              Gejala &amp; Dampak pada Pencernaan
            </h3>
            <ul className="space-y-2 text-[#ffe4e6] list-disc pl-5">
              <li>
                Sensasi panas terbakar di dada (<strong className="text-[#fb923c]">heartburn</strong>)
                atau nyeri di ulu hati yang menjalar ke tenggorokan.
              </li>
              <li>
                Mulut terasa asam/pahit, mudah mual, sendawa berulang, hingga luka iritasi pada
                lapisan esofagus (esofagitis) bila dibiarkan kronis.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#fda4af]/15 pt-4">
            <h3 className="text-base font-extrabold text-[#7dd3fc] mb-1.5">
              Pencegahan &amp; Penanganan
            </h3>
            <p className="text-[#ffe4e6]">
              Makan dalam porsi kecil namun teratur, beri jeda minimal <strong>2–3 jam</strong>{' '}
              sebelum berbaring setelah makan, kurangi makanan berlemak/asam/kafein berlebih, serta
              tinggikan posisi bantal saat tidur bila gejala kambuh.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
