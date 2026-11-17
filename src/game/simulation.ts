import {
  FOODS,
  TRACK_END_Z,
  TRACK_START_Z,
  createInitialHazards,
  createInitialPickups,
  createInitialStimuli,
  getTrackCenterX,
  getTrackFloorY,
  getTrackHalfWidth,
  getZoneForZ,
} from './data';
import {
  DigestiveNpc,
  FoodId,
  GamePhase,
  HazardEntity,
  HudSnapshot,
  InputState,
  ProjectileEntity,
  SimulationState,
  StimulusNode,
} from './types';

export const PLAYER_RADIUS = 0.72;
export const STIMULUS_PRESS_RANGE = 3.8;
export const STIMULUS_AUTO_RANGE = 1.45;
export const STOOL_TRANSFORM_Z = -230; // Colon section before Anus (-254) where digested residue forms stool

export function getStoolScaleForScore(score: number): number {
  const clamped = Math.max(0, Math.min(1800, score));
  return Number((0.68 + Math.pow(clamped / 1800, 0.72) * 1.17).toFixed(3));
}

export function createInputState(): InputState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    cameraYaw: 0,
    dashJustPressed: false,
    shieldJustPressed: false,
    stimulusJustPressed: false,
    dashBuffer: 0,
    shieldBuffer: 0,
    stimulusBuffer: 0,
  };
}

export function clearInputState(input: InputState): void {
  input.forward = false;
  input.backward = false;
  input.left = false;
  input.right = false;
  input.dashJustPressed = false;
  input.shieldJustPressed = false;
  input.stimulusJustPressed = false;
  input.dashBuffer = 0;
  input.shieldBuffer = 0;
  input.stimulusBuffer = 0;
}

export function createSimulation(
  foodId: FoodId = 'burger',
  phase: GamePhase = 'title',
  bestScore = 0,
): SimulationState {
  const spec = FOODS[foodId];
  const startZ = TRACK_START_Z;
  const startX = getTrackCenterX(startZ);
  const startY = getTrackFloorY(startZ) + 0.65;

  return {
    phase,
    outcome: null,
    foodId,
    zoneId: getZoneForZ(startZ).id,
    player: {
      x: startX,
      y: startY,
      z: startZ,
      vx: 0,
      vy: 0,
      vz: 0,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      hydration: 100,
      maxHydration: 100,
      mucusCharges: 2,
      maxMucusCharges: 4,
      shieldTimer: 0,
      dashTimer: 0,
      dashCooldownTimer: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      rotY: 0,
      distTraveled: 0,
      isStool: false,
      stoolScale: 1,
    },
    hazards: createInitialHazards(),
    pickups: createInitialPickups(),
    stimuli: createInitialStimuli(),
    ...(() => {
      const mouthNpc: DigestiveNpc = {
        id: 'npc_kuman_mulut',
        zone: 'mouth',
        diseaseId: 'xerostomia',
        name: 'NPC Kuman Mulut',
        topic: 'Penyakit Serostomia (Mulut Kering)',
        x: 2.45,
        y: getTrackFloorY(-3.6) + 0.85,
        z: -3.6,
        interactRadius: 3.6,
        interacted: false,
      };
      const throatNpc: DigestiveNpc = {
        id: 'npc_kuman_tenggorokan',
        zone: 'esophagus',
        diseaseId: 'parotitis',
        name: 'NPC Kuman Tenggorokan',
        topic: 'Penyakit Gondongan (Parotitis)',
        x: getTrackCenterX(-21.5) - 1.8,
        y: getTrackFloorY(-21.5) + 0.85,
        z: -21.5,
        interactRadius: 4.2,
        interacted: false,
      };
      const stomachNpc: DigestiveNpc = {
        id: 'npc_kuman_lambung',
        zone: 'stomach',
        diseaseId: 'gerd',
        name: 'NPC Kuman Lambung',
        topic: 'Penyakit GERD (Asam Lambung Naik)',
        x: getTrackCenterX(-99.5) - 0.5,
        y: getTrackFloorY(-99.5) + 0.85,
        z: -99.5,
        interactRadius: 6.2,
        interacted: false,
      };
      const colonNpc: DigestiveNpc = {
        id: 'npc_kuman_usus_besar',
        zone: 'large_intestine',
        diseaseId: 'maag',
        name: 'NPC Kuman Usus Besar',
        topic: 'Penyakit Maag / Mag (Gastritis)',
        x: getTrackCenterX(-215.5) - 0.8,
        y: getTrackFloorY(-215.5) + 0.85,
        z: -215.5,
        interactRadius: 4.5,
        interacted: false,
      };
      const anusNpc: DigestiveNpc = {
        id: 'npc_kuman_anus',
        zone: 'large_intestine',
        diseaseId: 'wasir',
        name: 'NPC Kuman Rektum & Anus',
        topic: 'Penyakit Wasir / Ambeien (Hemoroid)',
        x: getTrackCenterX(-251.5) + 1.6,
        y: getTrackFloorY(-251.5) + 0.85,
        z: -251.5,
        interactRadius: 4.5,
        interacted: false,
      };
      return {
        mouthNpc,
        npcs: [mouthNpc, throatNpc, stomachNpc, colonNpc, anusNpc],
      };
    })(),
    projectiles: [],
    events: [],
    score: 0,
    bestScore,
    enzymesCollected: 0,
    stimuliTriggered: 0,
    disordersOvercome: [],
    elapsedTime: 0,
    hitstopTimer: 0,
    trauma: 0,
    combo: 0,
    comboTimer: 0,
    activePrompt:
      phase === 'playing'
        ? {
            stimulus: 'Rongga Mulut Siap!',
            response: 'Hindari gigi geraham & kumpulkan Enzim Amilase.',
            actionHint: 'WASD Gerak · Space Dash · E Mukus · F Respon Saraf',
            kind: 'info',
            timer: 4.5,
          }
        : null,
    peristalsisBoostTimer: 0,
    diarrheaCurrentTimer: 0,
    dryMouthTimer: 0,
  };
}

export function switchFoodInSimulation(
  sim: SimulationState,
  foodId: FoodId,
): void {
  const spec = FOODS[foodId];
  sim.foodId = foodId;
  sim.player.maxHp = spec.maxHp;
  sim.player.hp = spec.maxHp;
}

function recordDisorder(sim: SimulationState, tag: string): void {
  if (!tag || sim.disordersOvercome.includes(tag)) return;
  sim.disordersOvercome.push(tag);
}

function addScore(sim: SimulationState, basePoints: number): void {
  sim.combo = Math.min(8, sim.combo + 1);
  sim.comboTimer = 4.0;
  const multiplier = 1 + (sim.combo - 1) * 0.1;
  sim.score += Math.round(basePoints * multiplier);
  if (sim.score > sim.bestScore) {
    sim.bestScore = sim.score;
  }
}

function damagePlayer(
  sim: SimulationState,
  rawDamage: number,
  disorderTag: string,
  isAcid: boolean,
  knockX: number,
  knockZ: number,
): void {
  const p = sim.player;
  if (p.invulnTimer > 0 || sim.phase !== 'playing') return;

  if (p.shieldTimer > 0) {
    // Mucus shield neutralizes acid and inflammatory disorders!
    recordDisorder(sim, disorderTag);
    addScore(sim, 35);
    p.invulnTimer = 0.4;
    sim.events.push({
      type: 'shield',
      x: p.x,
      y: p.y,
      z: p.z,
      intensity: 0.7,
      color: 0x38bdf8,
      message: `Mukus menetralkan ${disorderTag}!`,
    });
    sim.activePrompt = {
      stimulus: `Paparan ${disorderTag}`,
      response: 'Lapisan Mukus Pelindung menetralkan kerusakan!',
      actionHint: '+35 Poin Pertahanan Biologis',
      kind: 'stimulus',
      timer: 2.6,
    };
    return;
  }

  const spec = FOODS[sim.foodId];
  const dmg = isAcid
    ? Math.max(4, Math.round(rawDamage * (1 - spec.acidResist)))
    : rawDamage;

  p.hp = Math.max(0, p.hp - dmg);
  p.invulnTimer = 0.75;
  p.hitFlashTimer = 0.18;
  p.scaleX = 1.28;
  p.scaleY = 0.72;
  p.scaleZ = 1.18;
  p.vx += knockX;
  p.vz += knockZ;
  sim.combo = 0;
  sim.comboTimer = 0;
  sim.hitstopTimer = 0.055;
  sim.trauma = Math.min(1, sim.trauma + 0.65);

  sim.events.push({
    type: 'hit',
    x: p.x,
    y: p.y,
    z: p.z,
    intensity: 1.0,
    color: 0xef4444,
    message: `Terkena ${disorderTag} (-${dmg} Integritas)`,
  });

  sim.activePrompt = {
    stimulus: `Gangguan: ${disorderTag}!`,
    response: 'Tekan [E] untuk mengaktifkan Lapisan Mukus Pelindung!',
    actionHint: `-${dmg} Integritas Makanan`,
    kind: 'warning',
    timer: 2.8,
  };

  if (p.hp <= 0) {
    sim.phase = 'gameover';
    sim.outcome = 'defeat';
    sim.events.push({
      type: 'defeat',
      x: p.x,
      y: p.y,
      z: p.z,
      intensity: 1,
      color: 0xef4444,
    });
  }
}

export function triggerStimulusNode(
  sim: SimulationState,
  node: StimulusNode,
): void {
  if (node.triggered) return;
  node.triggered = true;
  sim.stimuliTriggered += 1;

  const spec = FOODS[sim.foodId];
  const p = sim.player;
  const pts = Math.round(120 * spec.stimulusSensitivity);
  addScore(sim, pts);

  if (node.zone === 'mouth') {
    p.hydration = Math.min(p.maxHydration, p.hydration + 25);
    sim.dryMouthTimer = 0;
    recordDisorder(sim, 'Mulut Kering');
  } else if (node.zone === 'esophagus') {
    sim.peristalsisBoostTimer = 3.2;
    recordDisorder(sim, 'Disfagia / Spasme Esofagus');
  } else if (node.zone === 'stomach') {
    p.mucusCharges = Math.min(p.maxMucusCharges, p.mucusCharges + 2);
    p.hp = Math.min(p.maxHp, p.hp + 15);
    recordDisorder(sim, 'Hipersekresi HCl');
  } else if (node.zone === 'small_intestine') {
    p.hydration = Math.min(p.maxHydration, p.hydration + 20);
    sim.diarrheaCurrentTimer = 0;
    addScore(sim, 80);
    recordDisorder(sim, 'Malabsorpsi Usus');
  } else if (node.zone === 'large_intestine') {
    p.hp = Math.min(p.maxHp, p.hp + 25);
    p.hydration = Math.min(p.maxHydration, p.hydration + 30);
    // Soften constipation rocks in large intestine
    for (const h of sim.hazards) {
      if (h.kind === 'constipation_rock' && h.alive) {
        h.hp = Math.min(h.hp, 10);
      }
    }
    recordDisorder(sim, 'Sembelit (Konstipasi)');
  }

  sim.hitstopTimer = 0.035;
  sim.trauma = Math.min(1, sim.trauma + 0.25);
  sim.activePrompt = {
    stimulus: node.stimulusName,
    response: node.responseName,
    actionHint: `${node.effectDesc} (+${pts})`,
    kind: 'stimulus',
    timer: 4.2,
  };
  sim.events.push({
    type: 'stimulus',
    x: node.x,
    y: node.y,
    z: node.z,
    intensity: 1,
    color: 0x22d3ee,
    message: node.responseName,
  });
}

export function findNearestStimulus(
  sim: SimulationState,
  maxDist = STIMULUS_PRESS_RANGE,
): StimulusNode | null {
  let best: StimulusNode | null = null;
  let bestDistSq = maxDist * maxDist;
  for (const node of sim.stimuli) {
    if (node.triggered) continue;
    const dx = node.x - sim.player.x;
    const dz = node.z - sim.player.z;
    const dSq = dx * dx + dz * dz;
    if (dSq <= bestDistSq) {
      bestDistSq = dSq;
      best = node;
    }
  }
  return best;
}

export function findNearestNpc(sim: SimulationState): DigestiveNpc | null {
  let best: DigestiveNpc | null = null;
  let bestDistSq = Infinity;
  for (const npc of sim.npcs) {
    const dx = npc.x - sim.player.x;
    const dz = npc.z - sim.player.z;
    const dSq = dx * dx + dz * dz;
    if (dSq <= npc.interactRadius * npc.interactRadius && dSq < bestDistSq) {
      bestDistSq = dSq;
      best = npc;
    }
  }
  return best;
}

export const findNearestMouthNpc = findNearestNpc;

export function interactWithNpc(
  sim: SimulationState,
  targetNpc?: DigestiveNpc | null,
): void {
  const npc = targetNpc ?? findNearestNpc(sim) ?? sim.mouthNpc;
  if (!npc || sim.phase !== 'playing') return;
  if (!npc.interacted) {
    npc.interacted = true;
    addScore(sim, 100);
  }
  if (npc.diseaseId === 'parotitis') {
    recordDisorder(sim, 'Gondongan (Parotitis)');
    sim.phase = 'parotitis';
    sim.events.push({
      type: 'npc_interact',
      x: npc.x,
      y: npc.y,
      z: npc.z,
      intensity: 0.95,
      color: 0x38bdf8,
      message: 'Animasi Penyakit Gondongan (Parotitis)',
    });
    return;
  }
  if (npc.diseaseId === 'gerd') {
    recordDisorder(sim, 'GERD (Asam Lambung Naik)');
    sim.phase = 'gerd';
    sim.events.push({
      type: 'npc_interact',
      x: npc.x,
      y: npc.y,
      z: npc.z,
      intensity: 0.95,
      color: 0xf97316,
      message: 'Animasi Penyakit GERD',
    });
    return;
  }
  if (npc.diseaseId === 'maag') {
    recordDisorder(sim, 'Maag / Mag (Gastritis)');
    sim.phase = 'maag';
    sim.events.push({
      type: 'npc_interact',
      x: npc.x,
      y: npc.y,
      z: npc.z,
      intensity: 0.95,
      color: 0xa855f7,
      message: 'Animasi Penyakit Maag (Gastritis)',
    });
    return;
  }
  if (npc.diseaseId === 'wasir') {
    recordDisorder(sim, 'Wasir / Ambeien (Hemoroid)');
    sim.phase = 'wasir';
    sim.events.push({
      type: 'npc_interact',
      x: npc.x,
      y: npc.y,
      z: npc.z,
      intensity: 0.95,
      color: 0xf43f5e,
      message: 'Animasi Penyakit Wasir / Ambeien',
    });
    return;
  }
  recordDisorder(sim, 'Serostomia (Mulut Kering)');
  sim.phase = 'xerostomia';
  sim.events.push({
    type: 'npc_interact',
    x: npc.x,
    y: npc.y,
    z: npc.z,
    intensity: 0.9,
    color: 0xa3e635,
    message: 'Animasi Penyakit Serostomia',
  });
}

export const interactMouthNpc = interactWithNpc;

export function closeXerostomiaScene(sim: SimulationState): void {
  if (sim.phase === 'xerostomia') {
    sim.phase = 'playing';
    sim.activePrompt = {
      stimulus: 'Edukasi Serostomia Selesai!',
      response: 'Jaga produksi saliva agar pencernaan di mulut tetap lancar.',
      actionHint: 'Lanjutkan perjalanan menuju perosotan kerongkongan!',
      kind: 'info',
      timer: 4.0,
    };
  }
}

export function closeParotitisScene(sim: SimulationState): void {
  if (sim.phase === 'parotitis') {
    sim.phase = 'playing';
    sim.activePrompt = {
      stimulus: 'Edukasi Gondongan (Parotitis) Selesai!',
      response: 'Vaksinasi MMR & kebersihan diri melindungi kelenjar parotis.',
      actionHint: 'Lanjutkan meluncur menuruni kerongkongan menuju lambung!',
      kind: 'info',
      timer: 4.0,
    };
  }
}

export function closeGerdScene(sim: SimulationState): void {
  if (sim.phase === 'gerd') {
    sim.phase = 'playing';
    sim.activePrompt = {
      stimulus: 'Edukasi Penyakit GERD Selesai!',
      response: 'Jaga katup sfingter & pola makan agar asam lambung tidak naik.',
      actionHint: 'Waspadai geiser HCl & lanjutkan menjelajahi lambung!',
      kind: 'info',
      timer: 4.2,
    };
  }
}

export function closeMaagScene(sim: SimulationState): void {
  if (sim.phase === 'maag') {
    sim.phase = 'playing';
    sim.activePrompt = {
      stimulus: 'Edukasi Penyakit Maag (Gastritis) Selesai!',
      response: 'Makan teratur & hindari pemicu iritasi agar mukosa lambung sehat.',
      actionHint: 'Bersihkan sumbatan sembelit menuju garis akhir usus besar!',
      kind: 'info',
      timer: 4.2,
    };
  }
}

export function closeWasirScene(sim: SimulationState): void {
  if (sim.phase === 'wasir') {
    sim.phase = 'playing';
    sim.activePrompt = {
      stimulus: 'Edukasi Penyakit Wasir / Ambeien Selesai!',
      response: 'Cukupi serat, minum air putih & hindari mengejan berlebihan.',
      actionHint: 'Masuki pintu Anus di depan untuk menyelesaikan pencernaan!',
      kind: 'info',
      timer: 4.2,
    };
  }
}

function spawnEnemyProjectile(
  sim: SimulationState,
  enemy: HazardEntity,
): void {
  const dx = sim.player.x - enemy.x;
  const dz = sim.player.z - enemy.z;
  const len = Math.hypot(dx, dz) || 1;
  const speed = 10.5;
  let slot: ProjectileEntity | undefined = sim.projectiles.find(
    (pr) => !pr.active,
  );
  if (!slot) {
    slot = {
      id: `proj_${sim.projectiles.length}`,
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vz: 0,
      radius: 0.45,
      damage: 14,
      life: 0,
      color: 0x84cc16,
    };
    sim.projectiles.push(slot);
  }
  slot.active = true;
  slot.x = enemy.x;
  slot.y = enemy.y + 0.65;
  slot.z = enemy.z;
  slot.vx = (dx / len) * speed;
  slot.vz = (dz / len) * speed;
  slot.radius = 0.45;
  slot.damage = 14;
  slot.life = 2.6;
  slot.color = 0x84cc16;
}

export function stepSimulation(
  sim: SimulationState,
  input: InputState,
  rawDt: number,
): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  sim.events.length = 0;

  // Decay camera trauma and flash timers in real dt even during hitstop
  sim.trauma = Math.max(0, sim.trauma - dt * 1.9);
  const p = sim.player;
  p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);

  // Exponentially damp squash-and-stretch back to (1,1,1)
  const dampFactor = 1 - Math.exp(-14 * dt);
  p.scaleX += (1 - p.scaleX) * dampFactor;
  p.scaleY += (1 - p.scaleY) * dampFactor;
  p.scaleZ += (1 - p.scaleZ) * dampFactor;

  if (sim.phase !== 'playing') {
    return;
  }

  // Hitstop freezes simulation physics briefly on heavy impacts
  if (sim.hitstopTimer > 0) {
    sim.hitstopTimer = Math.max(0, sim.hitstopTimer - dt);
    return;
  }

  sim.elapsedTime += dt;
  const spec = FOODS[sim.foodId];

  // Input buffering for edge-triggered actions
  if (input.dashJustPressed) {
    input.dashBuffer = 0.14;
    input.dashJustPressed = false;
  } else {
    input.dashBuffer = Math.max(0, input.dashBuffer - dt);
  }

  if (input.shieldJustPressed) {
    input.shieldBuffer = 0.14;
    input.shieldJustPressed = false;
  } else {
    input.shieldBuffer = Math.max(0, input.shieldBuffer - dt);
  }

  if (input.stimulusJustPressed) {
    input.stimulusBuffer = 0.14;
    input.stimulusJustPressed = false;
  } else {
    input.stimulusBuffer = Math.max(0, input.stimulusBuffer - dt);
  }

  // Timers
  p.dashTimer = Math.max(0, p.dashTimer - dt);
  p.dashCooldownTimer = Math.max(0, p.dashCooldownTimer - dt);
  p.shieldTimer = Math.max(0, p.shieldTimer - dt);
  p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  sim.peristalsisBoostTimer = Math.max(0, sim.peristalsisBoostTimer - dt);
  sim.diarrheaCurrentTimer = Math.max(0, sim.diarrheaCurrentTimer - dt);
  sim.dryMouthTimer = Math.max(0, sim.dryMouthTimer - dt);

  if (sim.comboTimer > 0) {
    sim.comboTimer -= dt;
    if (sim.comboTimer <= 0) {
      sim.combo = 0;
    }
  }
  if (sim.activePrompt) {
    sim.activePrompt.timer -= dt;
    if (sim.activePrompt.timer <= 0) {
      sim.activePrompt = null;
    }
  }

  // Check Dash action
  if (input.dashBuffer > 0 && p.dashCooldownTimer <= 0) {
    input.dashBuffer = 0;
    p.dashTimer = 0.25;
    p.dashCooldownTimer = spec.dashCooldown;
    p.scaleX = 0.78;
    p.scaleY = 0.84;
    p.scaleZ = 1.38;
    sim.trauma = Math.min(1, sim.trauma + 0.18);
    sim.events.push({
      type: 'dash',
      x: p.x,
      y: p.y,
      z: p.z,
      intensity: 0.7,
      color: 0xfef08a,
    });
  }

  // Check Digestive NPC interaction (Mouth / Esophagus) on [E] before spending Mucus Shield
  const nearNpc = findNearestNpc(sim);
  if (nearNpc && input.shieldBuffer > 0) {
    input.shieldBuffer = 0;
    interactWithNpc(sim, nearNpc);
    return;
  }

  // Check Mucus Shield action
  if (input.shieldBuffer > 0 && p.mucusCharges > 0 && p.shieldTimer <= 0.1) {
    input.shieldBuffer = 0;
    p.mucusCharges -= 1;
    p.shieldTimer = 2.8;
    p.scaleX = 1.18;
    p.scaleY = 1.18;
    p.scaleZ = 1.18;
    sim.events.push({
      type: 'shield',
      x: p.x,
      y: p.y,
      z: p.z,
      intensity: 0.8,
      color: 0x38bdf8,
      message: 'Lapisan Mukus Pelindung Aktif!',
    });
  }

  // Check Stimulus Response Trigger
  const nearStimulus = findNearestStimulus(sim, STIMULUS_PRESS_RANGE);
  if (nearStimulus && input.stimulusBuffer > 0) {
    input.stimulusBuffer = 0;
    triggerStimulusNode(sim, nearStimulus);
  }
  const autoStimulus = findNearestStimulus(sim, STIMULUS_AUTO_RANGE);
  if (autoStimulus) {
    triggerStimulusNode(sim, autoStimulus);
  }

  // Camera-relative movement: rotate screen-space WASD input by input.cameraYaw into track-space
  const rawRight = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const rawFwd = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const rawMag = Math.hypot(rawRight, rawFwd);
  const camYaw = input.cameraYaw || 0;
  const cosYaw = Math.cos(camYaw);
  const sinYaw = Math.sin(camYaw);

  let moveX = 0;
  let moveZ = 0;
  if (rawMag > 0) {
    const nRight = rawRight / rawMag;
    const nFwd = rawFwd / rawMag;
    moveX = nFwd * sinYaw + nRight * cosYaw;
    moveZ = -(nFwd * cosYaw - nRight * sinYaw);
  } else if (p.dashTimer > 0) {
    // Dash without directional key bursts toward the camera's forward direction
    moveX = sinYaw;
    moveZ = -cosYaw;
  }
  const mag = rawMag;

  let speedMult = 1.0;
  if (p.dashTimer > 0) speedMult *= 2.35;
  if (sim.peristalsisBoostTimer > 0) speedMult *= 1.38;
  if (sim.dryMouthTimer > 0) speedMult *= 0.72;

  const targetVx = moveX * spec.speed * speedMult;
  let targetVz = moveZ * spec.speed * speedMult;

  // Throat Slide ("perosotan tenggorokan") naturally slides food smoothly down unless climbing up!
  if (sim.zoneId === 'esophagus' && moveZ <= 0.35) {
    targetVz -= moveZ < -0.2 ? 5.2 : 6.8;
  }
  // Diarrhea hyper-peristalsis surge pushes violently in small intestine
  if (sim.diarrheaCurrentTimer > 0) {
    targetVz -= 3.6;
  }

  const accel = 1 - Math.exp(-12 * dt);
  p.vx += (targetVx - p.vx) * accel;
  p.vz += (targetVz - p.vz) * accel;

  const prevX = p.x;
  const prevZ = p.z;
  p.x += p.vx * dt;
  p.z += p.vz * dt;

  // Keep player inside digestive tract bounds (never clip out or hit invisible front wall)
  if (p.z > 4.5) p.z = 4.5;
  const centerX = getTrackCenterX(p.z);
  const halfW = getTrackHalfWidth(p.z) - PLAYER_RADIUS - 0.35;
  if (p.x < centerX - halfW) {
    p.x = centerX - halfW;
    p.vx = Math.max(0, p.vx);
  } else if (p.x > centerX + halfW) {
    p.x = centerX + halfW;
    p.vx = Math.min(0, p.vx);
  }

  p.y = getTrackFloorY(p.z) + 0.65;
  p.distTraveled += Math.hypot(p.x - prevX, p.z - prevZ);

  if (mag > 0.05) {
    const desiredRot = Math.atan2(p.vx, p.vz);
    let diff = desiredRot - p.rotY;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.rotY += diff * Math.min(1, dt * 10);
  }

  // Zone transition detection
  const currentZone = getZoneForZ(p.z);
  if (currentZone.id !== sim.zoneId) {
    sim.zoneId = currentZone.id;
    sim.activePrompt = {
      stimulus: `Memasuki ${currentZone.name}`,
      response: `${currentZone.keyStimulus} → ${currentZone.keyResponse}`,
      actionHint: `Waspada: ${currentZone.disorderName}`,
      kind: 'info',
      timer: 4.5,
    };
    sim.events.push({
      type: 'zone_enter',
      x: p.x,
      y: p.y,
      z: p.z,
      intensity: 0.8,
      color: 0xfbbf24,
      message: currentZone.name,
    });
  }

  // Transform character into Stool (Feses) inside Large Intestine before reaching the Anus, sized by collected points
  if (p.z <= STOOL_TRANSFORM_Z) {
    const targetScale = getStoolScaleForScore(sim.score);
    if (!p.isStool) {
      p.isStool = true;
      p.stoolScale = targetScale;
      p.scaleX = 1.38;
      p.scaleY = 0.72;
      p.scaleZ = 1.38;
      sim.trauma = Math.min(1, sim.trauma + 0.35);
      sim.activePrompt = {
        stimulus: 'Pembentukan Feses Sebelum Anus!',
        response: 'Sisa pencernaan berubah menjadi kotoran (feses) menuju Anus.',
        actionHint: `Skor ${Math.round(sim.score)} → Ukuran Feses ${Math.round(targetScale * 100)}%`,
        kind: 'info',
        timer: 4.5,
      };
      sim.events.push({
        type: 'transform_stool',
        x: p.x,
        y: p.y,
        z: p.z,
        intensity: 1,
        color: 0x92400e,
        message: 'Berubah menjadi Feses!',
      });
    } else {
      p.stoolScale = targetScale;
    }
  }

  // Pickups collision
  for (const item of sim.pickups) {
    if (item.collected) continue;
    const dx = item.x - p.x;
    const dz = item.z - p.z;
    if (dx * dx + dz * dz <= (item.radius + PLAYER_RADIUS) ** 2) {
      item.collected = true;
      sim.enzymesCollected += 1;
      addScore(sim, item.points);

      if (item.kind === 'mucus') {
        p.mucusCharges = Math.min(p.maxMucusCharges, p.mucusCharges + 1);
      } else if (item.kind === 'water') {
        p.hydration = Math.min(p.maxHydration, p.hydration + 25);
        p.hp = Math.min(p.maxHp, p.hp + 10);
      } else if (item.kind === 'probiotic') {
        p.hp = Math.min(p.maxHp, p.hp + 18);
        p.mucusCharges = Math.min(p.maxMucusCharges, p.mucusCharges + 1);
      } else {
        p.hp = Math.min(p.maxHp, p.hp + 6);
      }

      p.scaleX = 1.15;
      p.scaleY = 0.88;
      p.scaleZ = 1.15;
      sim.events.push({
        type: 'pickup',
        x: item.x,
        y: item.y,
        z: item.z,
        intensity: 0.5,
        color: 0x4ade80,
        message: `+${item.label}`,
      });
    }
  }

  // Update hazards & enemy AI (distinct policies!)
  for (const h of sim.hazards) {
    if (!h.alive) continue;
    h.hitFlash = Math.max(0, h.hitFlash - dt);

    if (h.state === 'ko') {
      h.timer -= dt;
      if (h.timer <= 0) {
        h.alive = false;
      }
      continue;
    }

    const dx = p.x - h.x;
    const dz = p.z - h.z;
    const dist = Math.hypot(dx, dz);

    if (h.kind === 'tooth_crusher') {
      // Telegraphed chewing jaw cycle
      const cycle = (sim.elapsedTime + h.cycleOffset) % 3.2;
      if (cycle < 1.5) h.state = 'idle';
      else if (cycle < 2.05) h.state = 'telegraph';
      else if (cycle < 2.45) h.state = 'active';
      else h.state = 'cooldown';

      if (h.state === 'active' && dist < h.radius + PLAYER_RADIUS) {
        const kx = (dx / (dist || 1)) * 9;
        const kz = (dz / (dist || 1)) * 9;
        damagePlayer(sim, 16, h.disorderTag, false, kx, kz);
      }
    } else if (h.kind === 'acid_geyser' || h.kind === 'canker_sore') {
      // Area-denial telegraph hazard
      const period = h.kind === 'canker_sore' ? 3.4 : 3.0;
      const cycle = (sim.elapsedTime + h.cycleOffset) % period;
      if (cycle < 1.3) h.state = 'idle';
      else if (cycle < 1.95) h.state = 'telegraph';
      else if (cycle < 2.55) h.state = 'active';
      else h.state = 'cooldown';

      if (h.state === 'active' && dist < h.radius + PLAYER_RADIUS * 0.75) {
        damagePlayer(sim, 15, h.disorderTag, true, 0, 4);
      }
    } else if (h.kind === 'h_pylori') {
      // Policy 1: Chaser / Swarmer with telegraph windup
      if (dist < 14 && dist > 0.2) {
        if (h.state === 'idle') {
          h.state = 'telegraph';
          h.timer = 0.35;
        } else if (h.state === 'telegraph') {
          h.timer -= dt;
          if (h.timer <= 0) h.state = 'active';
        } else if (h.state === 'active') {
          const chaseSpeed = 4.6;
          h.x += (dx / dist) * chaseSpeed * dt;
          h.z += (dz / dist) * chaseSpeed * dt;
        }
      } else {
        h.state = 'idle';
        h.x = h.baseX + Math.sin(sim.elapsedTime * 1.6 + h.cycleOffset) * 1.4;
      }

      if (dist < h.radius + PLAYER_RADIUS) {
        if (p.dashTimer > 0) {
          h.hp = 0;
          h.state = 'ko';
          h.timer = 0.35;
          h.hitFlash = 0.2;
          sim.hitstopTimer = 0.045;
          sim.trauma = Math.min(1, sim.trauma + 0.4);
          recordDisorder(sim, h.disorderTag);
          addScore(sim, 90);
          sim.events.push({
            type: 'enemy_ko',
            x: h.x,
            y: h.y,
            z: h.z,
            intensity: 0.9,
            color: 0xa855f7,
            message: `${h.label} dilumpuhkan!`,
          });
        } else {
          damagePlayer(
            sim,
            14,
            h.disorderTag,
            false,
            (dx / (dist || 1)) * 7,
            (dz / (dist || 1)) * 7,
          );
        }
      }
    } else if (h.kind === 'e_coli') {
      // Policy 2: Ranged Kiter with visible aim windup before firing toxin
      if (dist < 16) {
        if (dist < 5.5) {
          // Kite backwards along -Z or laterally
          h.z -= (dz / (dist || 1)) * 2.8 * dt;
        }
        h.x =
          h.baseX + Math.sin(sim.elapsedTime * 1.8 + h.cycleOffset) * 1.6;
        if (h.state === 'idle') {
          h.timer -= dt;
          if (h.timer <= 0) {
            h.state = 'telegraph';
            h.timer = 0.55;
          }
        } else if (h.state === 'telegraph') {
          h.timer -= dt;
          if (h.timer <= 0) {
            spawnEnemyProjectile(sim, h);
            h.state = 'cooldown';
            h.timer = 1.6;
          }
        } else {
          h.timer -= dt;
          if (h.timer <= 0) {
            h.state = 'idle';
            h.timer = 0.3;
          }
        }
      }

      if (dist < h.radius + PLAYER_RADIUS) {
        if (p.dashTimer > 0) {
          h.hp = 0;
          h.state = 'ko';
          h.timer = 0.35;
          h.hitFlash = 0.2;
          sim.hitstopTimer = 0.045;
          sim.trauma = Math.min(1, sim.trauma + 0.4);
          recordDisorder(sim, h.disorderTag);
          addScore(sim, 100);
          sim.events.push({
            type: 'enemy_ko',
            x: h.x,
            y: h.y,
            z: h.z,
            intensity: 0.9,
            color: 0x84cc16,
            message: `${h.label} dibersihkan!`,
          });
        } else {
          sim.diarrheaCurrentTimer = 2.0;
          damagePlayer(sim, 12, h.disorderTag, false, 0, 5);
        }
      }
    } else if (h.kind === 'constipation_rock') {
      // Policy 3: Solid Obstruction broken by Dash or Fiber
      if (dist < h.radius + PLAYER_RADIUS) {
        if (p.dashTimer > 0 || spec.fiberPower >= 5) {
          h.hp = 0;
          h.state = 'ko';
          h.timer = 0.35;
          h.hitFlash = 0.2;
          sim.hitstopTimer = 0.05;
          sim.trauma = Math.min(1, sim.trauma + 0.45);
          recordDisorder(sim, h.disorderTag);
          addScore(sim, 110);
          sim.events.push({
            type: 'enemy_ko',
            x: h.x,
            y: h.y,
            z: h.z,
            intensity: 1.0,
            color: 0xd97706,
            message: 'Sumbatan Sembelit berhasil dihancurkan!',
          });
        } else {
          // Push player back slightly and prompt Dash / Fiber
          const nx = dx / (dist || 1);
          const nz = dz / (dist || 1);
          const overlap = h.radius + PLAYER_RADIUS - dist;
          p.x += nx * overlap;
          p.z += nz * overlap;
          p.vx *= 0.3;
          p.vz *= 0.3;
          if (!sim.activePrompt) {
            sim.activePrompt = {
              stimulus: 'Sumbatan Sembelit (Konstipasi)!',
              response: 'Tekan [Space] untuk menerobos atau picu Stimulus Air!',
              actionHint: 'Hancurkan sumbatan kolon',
              kind: 'warning',
              timer: 2.0,
            };
          }
        }
      }
    }
  }

  // Update projectiles
  for (const proj of sim.projectiles) {
    if (!proj.active) continue;
    proj.life -= dt;
    if (proj.life <= 0) {
      proj.active = false;
      continue;
    }
    proj.x += proj.vx * dt;
    proj.z += proj.vz * dt;
    proj.y = getTrackFloorY(proj.z) + 0.65;

    const dx = p.x - proj.x;
    const dz = p.z - proj.z;
    if (dx * dx + dz * dz < (proj.radius + PLAYER_RADIUS) ** 2) {
      proj.active = false;
      sim.diarrheaCurrentTimer = 1.6;
      damagePlayer(sim, proj.damage, 'Toksin Diare E. coli', false, 0, 4);
    }
  }

  // Victory Check: Reached end of Large Intestine -> enter Toilet Flush Outro
  if (p.z <= TRACK_END_Z && sim.phase === 'playing') {
    if (!p.isStool) {
      p.isStool = true;
      p.stoolScale = getStoolScaleForScore(sim.score);
    }
    sim.phase = 'outro';
    sim.outcome = 'victory';
    addScore(sim, 300 + Math.round(p.hp * 2));
    sim.events.push({
      type: 'victory',
      x: p.x,
      y: p.y,
      z: p.z,
      intensity: 1,
      color: 0x4ade80,
      message: 'Ekskresi Menuju Toilet!',
    });
  }
}

export function completeVictoryOutro(sim: SimulationState): void {
  if (sim.phase === 'outro') {
    sim.phase = 'gameover';
    sim.outcome = 'victory';
  }
}

export function buildHudSnapshot(sim: SimulationState): HudSnapshot {
  const zone = getZoneForZ(sim.player.z);
  const spec = FOODS[sim.foodId];
  const progress = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((TRACK_START_Z - sim.player.z) / (TRACK_START_Z - TRACK_END_Z)) * 100,
      ),
    ),
  );
  const dashReadyRatio =
    spec.dashCooldown > 0
      ? 1 - Math.min(1, sim.player.dashCooldownTimer / spec.dashCooldown)
      : 1;

  return {
    phase: sim.phase,
    outcome: sim.outcome,
    foodId: sim.foodId,
    zoneId: zone.id,
    zoneName: zone.name,
    progressPct: progress,
    hp: Math.round(sim.player.hp),
    maxHp: Math.round(sim.player.maxHp),
    hydration: Math.round(sim.player.hydration),
    mucusCharges: sim.player.mucusCharges,
    maxMucusCharges: sim.player.maxMucusCharges,
    shieldActive: sim.player.shieldTimer > 0,
    shieldRatio: Math.min(1, sim.player.shieldTimer / 2.8),
    dashReadyRatio,
    score: Math.round(sim.score),
    bestScore: Math.round(sim.bestScore),
    enzymesCollected: sim.enzymesCollected,
    stimuliTriggered: sim.stimuliTriggered,
    totalStimuli: sim.stimuli.length,
    disordersOvercome: [...sim.disordersOvercome],
    elapsedTime: sim.elapsedTime,
    nearStimulus: findNearestStimulus(sim, STIMULUS_PRESS_RANGE),
    nearNpc: findNearestMouthNpc(sim),
    activePrompt: sim.activePrompt ? { ...sim.activePrompt } : null,
    combo: sim.combo,
    isStool: sim.player.isStool,
    stoolScale: sim.player.stoolScale,
  };
}
