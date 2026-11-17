import {
  FoodId,
  FoodSpec,
  HazardEntity,
  PickupEntity,
  StimulusNode,
  ZoneId,
  ZoneSpec,
} from './types';

export const TRACK_START_Z = 0;
export const TRACK_END_Z = -254; // Player travels along track U from Mouth (0) through spiral throat slide & giant Stomach into Large Intestine (-254)

export const FOODS: Record<FoodId, FoodSpec> = {
  burger: {
    id: 'burger',
    name: 'Burger Keju',
    subtitle: 'Karbohidrat & Lemak',
    nutrientType: 'Energi Kompleks',
    speed: 10.5,
    maxHp: 110,
    acidResist: 0.25,
    fiberPower: 2,
    dashCooldown: 1.15,
    stimulusSensitivity: 1.0,
    primaryColor: '#e59b3c',
    accentColor: '#facc15',
    bioNote:
      'Memerlukan Amilase di mulut, Pepsin di lambung, dan Empedu/Lipase di usus halus untuk dicerna optimal.',
  },
  apple: {
    id: 'apple',
    name: 'Apel Segar',
    subtitle: 'Tinggi Serat & Vitamin',
    nutrientType: 'Serat Pektin',
    speed: 11.8,
    maxHp: 100,
    acidResist: 0.35,
    fiberPower: 5,
    dashCooldown: 0.95,
    stimulusSensitivity: 1.15,
    primaryColor: '#e11d48',
    accentColor: '#4ade80',
    bioNote:
      'Serat alaminya mempercepat respon peristaltik usus dan melunakkan sumbatan sembelit di usus besar.',
  },
  chicken: {
    id: 'chicken',
    name: 'Ayam Panggang',
    subtitle: 'Protein Padat',
    nutrientType: 'Asam Amino',
    speed: 9.6,
    maxHp: 130,
    acidResist: 0.5,
    fiberPower: 1,
    dashCooldown: 1.25,
    stimulusSensitivity: 0.95,
    primaryColor: '#c26b2d',
    accentColor: '#fef3c7',
    bioNote:
      'Sangat tangguh menahan asam lambung HCl, namun perlu ekstra hidrasi agar lancar di usus besar.',
  },
  chili: {
    id: 'chili',
    name: 'Cabai Pedas',
    subtitle: 'Pemicu Stimulus Kuat',
    nutrientType: 'Kapsaisin Aktif',
    speed: 13.0,
    maxHp: 90,
    acidResist: 0.1,
    fiberPower: 3,
    dashCooldown: 0.78,
    stimulusSensitivity: 1.35,
    primaryColor: '#dc2626',
    accentColor: '#fb923c',
    bioNote:
      'Gerak super lincah & menguatkan respon saraf, tetapi rentan terhadap iritasi asam lambung (Maag/GERD).',
  },
};

export const FOOD_LIST: FoodSpec[] = [
  FOODS.burger,
  FOODS.apple,
  FOODS.chicken,
  FOODS.chili,
];

export const ZONES: ZoneSpec[] = [
  {
    id: 'mouth',
    name: 'Rongga Mulut',
    organLabel: 'Zona 1 · Mulut',
    locationDesc:
      'Pencernaan mekanik oleh gigi & kimiawi oleh enzim amilase pada air liur.',
    zStart: 6,
    zEnd: -14,
    halfWidth: 8.6,
    wallColor: 0xc85d70,
    fogColor: 0x3b131e,
    keyStimulus: 'Stimulus Rasa & Tekanan Lidah',
    keyResponse: 'Refleks Mengunyah & Sekresi Ludah (Amilase)',
    disorderName: 'Sariawan & Mulut Kering',
    disorderDesc:
      'Luka mukosa perih dan kurangnya saliva memperlambat pelumasan bolus makanan.',
  },
  {
    id: 'esophagus',
    name: 'Kerongkongan',
    organLabel: 'Zona 2 · Esofagus',
    locationDesc:
      'Saluran perosotan berotot memutar yang mendorong makanan menuju lambung.',
    zStart: -14,
    zEnd: -94,
    halfWidth: 4.5,
    wallColor: 0xb85265,
    fogColor: 0x33111c,
    keyStimulus: 'Stimulus Regangan Dinding Otot',
    keyResponse: 'Gelombang Peristaltik Terkoordinasi',
    disorderName: 'GERD (Refluks Asam)',
    disorderDesc:
      'Katup sfingter melemah sehingga asam lambung menyembur naik mengiritasi kerongkongan.',
  },
  {
    id: 'stomach',
    name: 'Lambung',
    organLabel: 'Zona 3 · Gaster',
    locationDesc:
      'Kantung lambung raksasa berisi asam HCl, enzim pepsin & bongkahan makanan yang dicerna.',
    zStart: -94,
    zEnd: -164,
    halfWidth: 16.5,
    wallColor: 0xa64956,
    fogColor: 0x2e1714,
    keyStimulus: 'Stimulus Hormon Gastrin & Saraf Vagus',
    keyResponse: 'Sekresi Enzim Pepsin & Lapisan Mukus Bikarbonat',
    disorderName: 'Maag (Gastritis) & Infeksi H. pylori',
    disorderDesc:
      'Hipersekresi asam HCl dan bakteri spiral mengikis pelindung dinding lambung.',
  },
  {
    id: 'small_intestine',
    name: 'Usus Halus',
    organLabel: 'Zona 4 · Intestinum Tenue',
    locationDesc:
      'Penyerapan nutrisi oleh vili usus dengan bantuan empedu & enzim pencernaan.',
    zStart: -164,
    zEnd: -212,
    halfWidth: 4.6,
    wallColor: 0xc9745d,
    fogColor: 0x361e16,
    keyStimulus: 'Stimulus Lemak & Asam (Hormon CCK)',
    keyResponse: 'Aktivasi Empedu & Penyerapan Vili Usus',
    disorderName: 'Diare (Infeksi E. coli)',
    disorderDesc:
      'Toksin bakteri memicu hiper-peristaltik deras dan menguras cairan tubuh.',
  },
  {
    id: 'large_intestine',
    name: 'Usus Besar',
    organLabel: 'Zona 5 · Kolon',
    locationDesc:
      'Penyerapan kembali air & elektrolit serta pembentukan sisa pencernaan.',
    zStart: -212,
    zEnd: -258,
    halfWidth: 5.0,
    wallColor: 0x994a59,
    fogColor: 0x28121b,
    keyStimulus: 'Stimulus Penyerapan Air & Flora Normal',
    keyResponse: 'Pelumasan Mukus & Refleks Pengosongan Sehat',
    disorderName: 'Sembelit (Konstipasi)',
    disorderDesc:
      'Kurang serat dan air membuat sisa makanan mengeras dan menyumbat jalur kolon.',
  },
];

export function getZoneForZ(z: number): ZoneSpec {
  for (const zone of ZONES) {
    if (z <= zone.zStart && z > zone.zEnd) {
      return zone;
    }
  }
  return z > ZONES[0].zStart ? ZONES[0] : ZONES[ZONES.length - 1];
}

export function getTrackCenterX(z: number): number {
  // Mouth and Esophagus centerline offset in track-space is 0 (3D spiral curve handled by trackToWorld)
  if (z > -94) {
    return 0;
  }
  if (z > -164) {
    // Huge Stomach J-pouch curve sweeping wide to the right (+X) and returning smoothly to pylorus (-164)
    const t = (-94 - z) / 70;
    return Math.sin(t * Math.PI) * 5.2;
  }
  if (z > -212) {
    // Small intestine winding curves
    return Math.sin((z + 164) * 0.14) * 2.4;
  }
  // Large intestine curve
  return Math.sin((z + 212) * 0.09) * 1.8;
}

export function getTrackHalfWidth(z: number): number {
  const zone = getZoneForZ(z);
  if (zone.id === 'mouth') {
    // Spacious wide horseshoe cheek chamber (up to 9.0 halfWidth = 18 units wide) narrowing smoothly into throat (-14)
    const t = Math.min(1, Math.max(0, (6 - z) / 20));
    return 4.5 + Math.sin(t * Math.PI) * 4.5;
  }
  if (zone.id === 'stomach') {
    // Monumental cavernous gastric pouch: blooms from 4.5 at sphincter up to 18.5 halfWidth (37 units wide!)
    const t = Math.min(1, Math.max(0, (-94 - z) / 70));
    return 4.5 + Math.pow(Math.sin(t * Math.PI), 0.72) * 14.0;
  }
  return zone.halfWidth;
}

export function getTrackFloorY(z: number): number {
  // Level floor across mouth, then long smooth 80-unit helical slide dropping -26 directly into huge stomach basin
  if (z > -14) return 0;
  if (z > -94) {
    const t = (-14 - z) / 80;
    const smooth = t * t * (3 - 2 * t);
    return -26.0 * smooth;
  }
  if (z > -164) {
    const t = (-94 - z) / 70;
    return -26.0 - Math.sin(t * Math.PI) * 1.15 + Math.sin((z + 94) * 0.08) * 0.2;
  }
  return -26.0 + Math.sin((z + 164) * 0.05) * 0.25;
}

// Precomputed constant-arc-speed 360° helical spiral table for the Esophagus (-14 .. -94)
const ESOPHAGUS_START = -14;
const ESOPHAGUS_END = -94;
const ESOPHAGUS_LEN = ESOPHAGUS_START - ESOPHAGUS_END; // 80 units
const SPIRAL_SAMPLES = 160;
const spiralWx: number[] = new Array(SPIRAL_SAMPLES + 1).fill(0);
const spiralWz: number[] = new Array(SPIRAL_SAMPLES + 1).fill(ESOPHAGUS_START);

(() => {
  let wx = 0;
  let wz = ESOPHAGUS_START;
  const ds = ESOPHAGUS_LEN / SPIRAL_SAMPLES;
  for (let i = 0; i < SPIRAL_SAMPLES; i++) {
    spiralWx[i] = wx;
    spiralWz[i] = wz;
    const tMid = (i + 0.5) / SPIRAL_SAMPLES;
    const smoothMid = tMid * tMid * (3 - 2 * tMid);
    const heading = Math.PI * 2 * smoothMid;
    wx += Math.sin(heading) * ds;
    wz += -Math.cos(heading) * ds;
  }
  spiralWx[SPIRAL_SAMPLES] = wx;
  spiralWz[SPIRAL_SAMPLES] = wz;
  // Eliminate tiny numerical drift so spiral closes back cleanly at X = 0
  const driftX = spiralWx[SPIRAL_SAMPLES];
  for (let i = 0; i <= SPIRAL_SAMPLES; i++) {
    spiralWx[i] -= driftX * (i / SPIRAL_SAMPLES);
  }
})();

export const ESOPHAGUS_EXIT_WORLD_Z = spiralWz[SPIRAL_SAMPLES];

export interface WorldTrackPoint {
  x: number;
  y: number;
  z: number;
  cx: number;
  fy: number;
  cz: number;
  tx: number;
  tz: number;
  rx: number;
  rz: number;
}

export function trackToWorld(trackX: number, trackZ: number): WorldTrackPoint {
  const fy = getTrackFloorY(trackZ);
  if (trackZ >= ESOPHAGUS_START) {
    return {
      x: trackX,
      y: fy,
      z: trackZ,
      cx: 0,
      fy,
      cz: trackZ,
      tx: 0,
      tz: -1,
      rx: 1,
      rz: 0,
    };
  }
  if (trackZ > ESOPHAGUS_END) {
    const t = (ESOPHAGUS_START - trackZ) / ESOPHAGUS_LEN;
    const f = t * SPIRAL_SAMPLES;
    const i0 = Math.min(SPIRAL_SAMPLES - 1, Math.max(0, Math.floor(f)));
    const alpha = f - i0;
    const cx = spiralWx[i0] + (spiralWx[i0 + 1] - spiralWx[i0]) * alpha;
    const cz = spiralWz[i0] + (spiralWz[i0 + 1] - spiralWz[i0]) * alpha;
    const smooth = t * t * (3 - 2 * t);
    const heading = Math.PI * 2 * smooth;
    const tx = Math.sin(heading);
    const tz = -Math.cos(heading);
    const rx = -tz;
    const rz = tx;
    return {
      x: cx + trackX * rx,
      y: fy,
      z: cz + trackX * rz,
      cx,
      fy,
      cz,
      tx,
      tz,
      rx,
      rz,
    };
  }
  const cx = getTrackCenterX(trackZ);
  const cz = ESOPHAGUS_EXIT_WORLD_Z + (trackZ - ESOPHAGUS_END);
  return {
    x: trackX,
    y: fy,
    z: cz,
    cx,
    fy,
    cz,
    tx: 0,
    tz: -1,
    rx: 1,
    rz: 0,
  };
}

export function createInitialStimuli(): StimulusNode[] {
  return [
    {
      id: 'stim_mouth_saliva',
      zone: 'mouth',
      x: getTrackCenterX(-6.5) - 2.4,
      y: getTrackFloorY(-6.5) + 0.9,
      z: -6.5,
      radius: 2.0,
      triggered: false,
      stimulusName: 'Stimulus Reseptor Lidah',
      responseName: 'Sekresi Kelenjar Ludah (Amilase)',
      effectDesc: 'Air liur melumasi makanan & memulihkan +20 Hidrasi!',
      pulse: 0,
    },
    {
      id: 'stim_esophagus_peristalsis',
      zone: 'esophagus',
      x: getTrackCenterX(-52) + 1.4,
      y: getTrackFloorY(-52) + 0.9,
      z: -52,
      radius: 2.0,
      triggered: false,
      stimulusName: 'Stimulus Saraf Regangan Esofagus',
      responseName: 'Gelombang Peristaltik Teratur',
      effectDesc: 'Otot mendorong bolus melesat maju melewati refluks!',
      pulse: 0,
    },
    {
      id: 'stim_stomach_bicarbonate',
      zone: 'stomach',
      x: getTrackCenterX(-126) - 4.2,
      y: getTrackFloorY(-126) + 0.9,
      z: -126,
      radius: 2.3,
      triggered: false,
      stimulusName: 'Stimulus pH Asam Lambung Ekstrem',
      responseName: 'Sekresi Mukus Bikarbonat Pelindung',
      effectDesc: 'Menetralkan HCl & memberi +2 muatan Lapisan Mukus!',
      pulse: 0,
    },
    {
      id: 'stim_small_cck',
      zone: 'small_intestine',
      x: getTrackCenterX(-186) + 1.6,
      y: getTrackFloorY(-186) + 0.9,
      z: -186,
      radius: 2.1,
      triggered: false,
      stimulusName: 'Stimulus Hormon CCK & Vili Usus',
      responseName: 'Aliran Empedu & Penyerapan Sari Makanan',
      effectDesc: 'Meningkatkan skor gizi +150 & meredam toksin Diare!',
      pulse: 0,
    },
    {
      id: 'stim_large_hydration',
      zone: 'large_intestine',
      x: getTrackCenterX(-228) - 1.5,
      y: getTrackFloorY(-228) + 0.9,
      z: -228,
      radius: 2.1,
      triggered: false,
      stimulusName: 'Stimulus Reseptor Dinding Kolon',
      responseName: 'Keseimbangan Air & Flora Normal',
      effectDesc: 'Melunakkan batu Sembelit & memulihkan +25 HP!',
      pulse: 0,
    },
  ];
}

export function createInitialHazards(): HazardEntity[] {
  const hazards: HazardEntity[] = [];
  const add = (
    id: string,
    kind: HazardEntity['kind'],
    zone: ZoneId,
    z: number,
    offsetX: number,
    radius: number,
    hp: number,
    cycleOffset: number,
    label: string,
    disorderTag: string,
  ) => {
    const cx = getTrackCenterX(z) + offsetX;
    const cy = getTrackFloorY(z);
    hazards.push({
      id,
      kind,
      zone,
      x: cx,
      y: cy,
      z,
      baseX: cx,
      baseZ: z,
      radius,
      hp,
      maxHp: hp,
      state: 'idle',
      timer: cycleOffset,
      cycleOffset,
      hitFlash: 0,
      alive: true,
      label,
      disorderTag,
    });
  };

  // Zona 1: Rongga Mulut (wide natural oral cavity)
  add('tooth_1', 'tooth_crusher', 'mouth', -5.8, 3.6, 1.35, 999, 0.4, 'Gigi Geraham Kanan', 'Kunyah Mekanik');
  add('sore_1', 'canker_sore', 'mouth', -9.6, -3.2, 1.2, 999, 0.0, 'Sariawan (Stomatitis)', 'Sariawan');

  // Zona 2: Kerongkongan (Long 360° Spiraling Throat Slide + GERD hazards)
  add('gerd_1', 'acid_geyser', 'esophagus', -28, -1.3, 1.6, 999, 0.2, 'Refluks Asam GERD', 'GERD / Refluks');
  add('gerd_2', 'acid_geyser', 'esophagus', -46, 1.5, 1.65, 999, 1.4, 'Semburan Sfingter', 'GERD / Refluks');
  add('gerd_3', 'acid_geyser', 'esophagus', -64, -1.2, 1.6, 999, 0.8, 'Uap Asam Spiral', 'GERD / Refluks');
  add('gerd_4', 'acid_geyser', 'esophagus', -81, 1.1, 1.55, 999, 0.4, 'Katup Kardiak GERD', 'GERD / Refluks');

  // Zona 3: Lambung (Cavernous Gastric Pouch: Maag Geysers + H. pylori Chasers)
  add('maag_1', 'acid_geyser', 'stomach', -108, 4.2, 2.0, 999, 0.5, 'Tukak Lambung (Maag)', 'Maag / Gastritis');
  add('hp_1', 'h_pylori', 'stomach', -118, -2.5, 1.05, 30, 0.0, 'Bakteri H. pylori', 'Infeksi H. pylori');
  add('maag_2', 'acid_geyser', 'stomach', -131, -6.0, 2.1, 999, 1.7, 'Geiser HCl Pepsin', 'Maag / Gastritis');
  add('hp_2', 'h_pylori', 'stomach', -140, 5.2, 1.05, 30, 0.8, 'Bakteri H. pylori', 'Infeksi H. pylori');
  add('maag_3', 'acid_geyser', 'stomach', -150, 2.4, 2.0, 999, 1.1, 'Asam Lambung Pepsin', 'Maag / Gastritis');
  add('hp_3', 'h_pylori', 'stomach', -155, -3.6, 1.05, 30, 0.4, 'Bakteri H. pylori', 'Infeksi H. pylori');

  // Zona 4: Usus Halus (E. coli Ranged Toxin + Chasers triggering Diarrhea)
  add('ecoli_1', 'e_coli', 'small_intestine', -176, -1.5, 1.05, 30, 0.3, 'Patogen E. coli', 'Diare Infeksi');
  add('hp_4', 'h_pylori', 'small_intestine', -190, 1.5, 1.05, 30, 0.5, 'Patogen Usus', 'Diare Infeksi');
  add('ecoli_2', 'e_coli', 'small_intestine', -201, 1.2, 1.05, 30, 1.2, 'Patogen E. coli', 'Diare Infeksi');

  // Zona 5: Usus Besar (Constipation Rock Barriers + E. coli)
  add('constip_1', 'constipation_rock', 'large_intestine', -220, -1.2, 1.65, 25, 0, 'Sumbatan Konstipasi', 'Sembelit (Konstipasi)');
  add('constip_2', 'constipation_rock', 'large_intestine', -234, 1.6, 1.75, 25, 0, 'Massa Feses Kering', 'Sembelit (Konstipasi)');
  add('ecoli_3', 'e_coli', 'large_intestine', -241, -1.4, 1.05, 30, 0.6, 'Bakteri Toksin', 'Radang Kolon');
  add('constip_3', 'constipation_rock', 'large_intestine', -248, 0.0, 1.85, 30, 0, 'Sumbatan Akhir Kolon', 'Sembelit (Konstipasi)');

  return hazards;
}

export function createInitialPickups(): PickupEntity[] {
  const pickups: PickupEntity[] = [];
  const add = (
    id: string,
    kind: PickupEntity['kind'],
    zone: ZoneId,
    z: number,
    offsetX: number,
    label: string,
    points: number,
  ) => {
    pickups.push({
      id,
      kind,
      zone,
      x: getTrackCenterX(z) + offsetX,
      y: getTrackFloorY(z) + 0.75,
      z,
      radius: 0.95,
      collected: false,
      label,
      points,
    });
  };

  // Mouth (wide ordinary cavity)
  add('p_amy_1', 'amylase', 'mouth', -3.5, 0.0, 'Enzim Amilase', 50);
  add('p_muc_1', 'mucus', 'mouth', -7.8, 1.6, 'Sel Mukus', 40);
  add('p_amy_2', 'amylase', 'mouth', -10.8, 0.4, 'Enzim Amilase', 50);
  add('p_wat_1', 'water', 'mouth', -12.8, -0.7, 'Saliva / Air', 40);

  // Esophagus Spiral Slide
  add('p_muc_2', 'mucus', 'esophagus', -22, 1.4, 'Lapisan Mukus', 45);
  add('p_wat_2', 'water', 'esophagus', -36, -1.5, 'Cairan Pelumas', 45);
  add('p_muc_3', 'mucus', 'esophagus', -54, -1.0, 'Bikarbonat', 50);
  add('p_wat_2b', 'water', 'esophagus', -70, 1.3, 'Pelumas Peristaltik', 50);
  add('p_muc_3b', 'mucus', 'esophagus', -85, -0.8, 'Mukus Sfingter', 55);

  // Huge Stomach Cavern
  add('p_pep_1', 'pepsin', 'stomach', -102, -3.0, 'Enzim Pepsin', 70);
  add('p_muc_4', 'mucus', 'stomach', -114, 5.5, 'Mukus Lambung', 55);
  add('p_pep_2', 'pepsin', 'stomach', -129, 0.8, 'Enzim Pepsin', 70);
  add('p_wat_3', 'water', 'stomach', -142, -6.5, 'Air Netral', 50);
  add('p_pep_3', 'pepsin', 'stomach', -151, 5.8, 'Enzim Pepsin', 75);
  add('p_muc_5', 'mucus', 'stomach', -158, -1.5, 'Bikarbonat Lambung', 60);

  // Small intestine
  add('p_bile_1', 'bile', 'small_intestine', -170, 0.8, 'Empedu & Lipase', 80);
  add('p_wat_4', 'water', 'small_intestine', -180, 1.8, 'Oralit / Elektrolit', 60);
  add('p_bile_2', 'bile', 'small_intestine', -194, -1.5, 'Tripsin & Vili', 85);
  add('p_pro_1', 'probiotic', 'small_intestine', -206, 0.2, 'Imun Mukosa', 75);

  // Large intestine
  add('p_wat_5', 'water', 'large_intestine', -216, 1.6, 'Hidrasi Kolon', 70);
  add('p_pro_2', 'probiotic', 'large_intestine', -225, 1.4, 'Bakteri Baik (Lactobacillus)', 90);
  add('p_wat_6', 'water', 'large_intestine', -238, -0.4, 'Serat & Air', 75);
  add('p_pro_3', 'probiotic', 'large_intestine', -245, 1.7, 'Vitamin K', 100);

  return pickups;
}
