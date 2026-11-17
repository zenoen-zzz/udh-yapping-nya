import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STOOL_TRANSFORM_Z,
  buildHudSnapshot,
  closeGerdScene,
  closeMaagScene,
  closeParotitisScene,
  closeWasirScene,
  closeXerostomiaScene,
  completeVictoryOutro,
  createInputState,
  createSimulation,
  findNearestMouthNpc,
  findNearestNpc,
  getStoolScaleForScore,
  stepSimulation,
  switchFoodInSimulation,
} from './simulation';
import { TRACK_END_Z, ZONES, getTrackHalfWidth, trackToWorld } from './data';

test('player always starts inside the human mouth (Rongga Mulut)', () => {
  const sim = createSimulation('burger', 'playing');
  assert.equal(sim.zoneId, 'mouth');
  assert.equal(sim.player.z, 0);
  const hud = buildHudSnapshot(sim);
  assert.equal(hud.zoneId, 'mouth');
  assert.equal(hud.zoneName, 'Rongga Mulut');
});

test('food character can be swapped in menu and updates maxHp cleanly', () => {
  const sim = createSimulation('burger', 'title');
  assert.equal(sim.foodId, 'burger');
  assert.equal(sim.player.maxHp, 110);

  switchFoodInSimulation(sim, 'apple');
  assert.equal(sim.foodId, 'apple');
  assert.equal(sim.player.maxHp, 100);

  switchFoodInSimulation(sim, 'chicken');
  assert.equal(sim.foodId, 'chicken');
  assert.equal(sim.player.maxHp, 130);
});

test('player survives initial seconds without input in mouth', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  for (let i = 0; i < 120; i++) {
    stepSimulation(sim, input, 0.04);
  }
  assert.equal(sim.phase, 'playing');
  assert.equal(sim.player.hp, sim.player.maxHp);
});

test('moving forward collects amylase enzyme and transitions from mouth to esophagus', () => {
  const sim = createSimulation('apple', 'playing');
  const input = createInputState();
  input.forward = true;
  for (let i = 0; i < 80; i++) {
    stepSimulation(sim, input, 0.03);
  }
  assert.ok(sim.player.z < -14, `Expected z < -14, got ${sim.player.z}`);
  assert.equal(sim.zoneId, 'esophagus');
  assert.ok(sim.score > 0);
  assert.ok(sim.enzymesCollected >= 1);
});

test('mucus shield protects against acid hazard and records disorder overcome', () => {
  const sim = createSimulation('chili', 'playing');
  const input = createInputState();
  const initialHp = sim.player.hp;
  const gerd = sim.hazards.find((h) => h.id === 'gerd_1');
  assert.ok(gerd);
  sim.player.x = gerd.x;
  sim.player.z = gerd.z;
  sim.elapsedTime = 2.0 - gerd.cycleOffset; // align with active geyser window
  input.shieldJustPressed = true;

  stepSimulation(sim, input, 0.02);
  assert.ok(sim.player.shieldTimer > 0);
  assert.equal(sim.player.hp, initialHp);
  assert.ok(sim.disordersOvercome.includes('GERD / Refluks'));
});

test('triggering stimulus node in mouth awards points and restores hydration', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  const stim = sim.stimuli[0];
  sim.player.hydration = 60;
  sim.player.x = stim.x;
  sim.player.z = stim.z;
  input.stimulusJustPressed = true;

  stepSimulation(sim, input, 0.02);
  assert.equal(stim.triggered, true);
  assert.equal(sim.stimuliTriggered, 1);
  assert.equal(sim.player.hydration, 85);
  assert.ok(sim.score >= 120);
});

test('reaching end of large intestine triggers toilet-flush outro and completes to victory', () => {
  const sim = createSimulation('apple', 'playing');
  const input = createInputState();
  sim.score = 1200;
  sim.player.z = TRACK_END_Z + 0.05;
  sim.player.isStool = true;
  sim.player.stoolScale = getStoolScaleForScore(sim.score);
  const preFinishScale = sim.player.stoolScale;
  input.forward = true;

  stepSimulation(sim, input, 0.05);
  assert.equal(sim.phase, 'outro');
  assert.equal(sim.outcome, 'victory');
  assert.equal(sim.player.isStool, true);
  assert.equal(sim.player.stoolScale, preFinishScale);

  completeVictoryOutro(sim);
  assert.equal(sim.phase, 'gameover');
  assert.equal(sim.outcome, 'victory');
});

test('esophagus forms a smooth 360-degree descending spiral back to stomach center', () => {
  const entry = trackToWorld(0, -14);
  const quarter = trackToWorld(0, -34);
  const half = trackToWorld(0, -54);
  const exit = trackToWorld(0, -94);

  assert.equal(entry.x, 0);
  assert.ok(Math.abs(entry.y) < 1e-6);
  assert.ok(half.cx > 12, `Expected spiral half-loop bulge X > 12, got ${half.cx}`);
  assert.ok(quarter.fy < entry.fy && half.fy < quarter.fy);
  assert.ok(Math.abs(exit.x) < 0.01, `Expected exit centered near X=0, got ${exit.x}`);
  assert.ok(Math.abs(exit.tx) < 0.01 && exit.tz < -0.99);
});

test('character movement adapts smoothly to camera direction (left/right/back camera)', () => {
  // 1. Camera orbited left looking toward +X (cameraYaw = +PI/2): pressing W moves +X!
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  input.forward = true;
  input.cameraYaw = Math.PI / 2;
  for (let i = 0; i < 15; i++) {
    stepSimulation(sim, input, 0.03);
  }
  assert.ok(sim.player.x > 1.5, `Expected player to move +X along camera look, got ${sim.player.x}`);
  assert.ok(Math.abs(sim.player.z) < 0.25, `Expected minimal Z drift, got ${sim.player.z}`);

  // 2. Same camera (+PI/2 looking +X), pressing A (left on screen) moves down the tract (-Z)!
  const simLeft = createSimulation('burger', 'playing');
  const inputLeft = createInputState();
  inputLeft.left = true;
  inputLeft.cameraYaw = Math.PI / 2;
  for (let i = 0; i < 15; i++) {
    stepSimulation(simLeft, inputLeft, 0.03);
  }
  assert.ok(simLeft.player.z < -1.5, `Expected screen-left to move -Z down tract, got ${simLeft.player.z}`);
});

test('stomach chamber is huge (width >= 35 units, length >= 65 units) with continuous boundaries', () => {
  const stomach = ZONES.find((z) => z.id === 'stomach');
  assert.ok(stomach);
  const length = stomach.zStart - stomach.zEnd;
  assert.ok(length >= 65, `Expected stomach length >= 65, got ${length}`);

  const midZ = (stomach.zStart + stomach.zEnd) / 2;
  const midWidth = getTrackHalfWidth(midZ) * 2;
  assert.ok(midWidth >= 35, `Expected stomach mid width >= 35, got ${midWidth}`);
  assert.ok(Math.abs(getTrackHalfWidth(stomach.zStart) - 4.5) < 0.2);
  assert.ok(Math.abs(getTrackHalfWidth(stomach.zEnd) - 4.5) < 0.25);
});

test('character transforms into stool in large intestine before anus with size scaled by collected points', () => {
  // Low score -> small stool
  const lowSim = createSimulation('burger', 'playing');
  const input = createInputState();
  lowSim.player.z = STOOL_TRANSFORM_Z + 1.5;
  stepSimulation(lowSim, input, 0.02);
  assert.equal(lowSim.player.isStool, false);

  lowSim.player.z = STOOL_TRANSFORM_Z - 0.5;
  stepSimulation(lowSim, input, 0.02);
  assert.equal(lowSim.zoneId, 'large_intestine');
  assert.equal(lowSim.player.isStool, true);
  assert.ok(lowSim.events.some((e) => e.type === 'transform_stool'));
  assert.ok(lowSim.player.stoolScale < 0.75, `Expected small stool scale < 0.75 at 0 pts, got ${lowSim.player.stoolScale}`);

  // High score -> much larger stool
  const highSim = createSimulation('burger', 'playing');
  highSim.score = 1400;
  highSim.player.z = STOOL_TRANSFORM_Z - 0.5;
  stepSimulation(highSim, input, 0.02);
  assert.equal(highSim.player.isStool, true);
  assert.ok(highSim.player.stoolScale > 1.55, `Expected large stool scale > 1.55 at 1400 pts, got ${highSim.player.stoolScale}`);
  assert.ok(getStoolScaleForScore(900) > getStoolScaleForScore(300));
  assert.ok(getStoolScaleForScore(5000) <= 1.85);

  // Collecting extra points while already stool dynamically increases stoolScale
  const prevScale = lowSim.player.stoolScale;
  lowSim.score = 800;
  stepSimulation(lowSim, input, 0.02);
  assert.ok(lowSim.player.stoolScale > prevScale);
});

test('mouth germ NPC allows E-key interaction to open Serostomia screen and resume gameplay cleanly', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  const initialCharges = sim.player.mucusCharges;

  // Move right up to the Mouth Germ NPC
  sim.player.x = sim.mouthNpc.x - 1.2;
  sim.player.z = sim.mouthNpc.z + 1.0;
  const near = findNearestMouthNpc(sim);
  assert.ok(near);
  assert.equal(near.id, 'npc_kuman_mulut');

  // Press E near NPC -> opens xerostomia without draining mucus charges
  input.shieldJustPressed = true;
  stepSimulation(sim, input, 0.02);
  assert.equal(sim.phase, 'xerostomia');
  assert.equal(sim.player.mucusCharges, initialCharges);
  assert.ok(sim.mouthNpc.interacted);
  assert.ok(sim.disordersOvercome.includes('Serostomia (Mulut Kering)'));

  // Closing Serostomia resumes playing smoothly
  closeXerostomiaScene(sim);
  assert.equal(sim.phase, 'playing');
});

test('esophagus throat germ NPC allows E-key interaction to open Parotitis screen and resume gameplay cleanly', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  const throatNpc = sim.npcs.find((n) => n.zone === 'esophagus');
  assert.ok(throatNpc, 'Expected an NPC inside esophagus tunnel');
  assert.equal(throatNpc.id, 'npc_kuman_tenggorokan');
  assert.equal(throatNpc.diseaseId, 'parotitis');

  const initialCharges = sim.player.mucusCharges;
  sim.zoneId = 'esophagus';
  sim.player.x = throatNpc.x + 1.1;
  sim.player.z = throatNpc.z + 1.0;

  const near = findNearestNpc(sim);
  assert.ok(near);
  assert.equal(near.id, 'npc_kuman_tenggorokan');
  const hudBefore = buildHudSnapshot(sim);
  assert.equal(hudBefore.nearNpc?.id, 'npc_kuman_tenggorokan');

  // Press E near throat NPC -> opens parotitis screen without spending mucus charges
  input.shieldJustPressed = true;
  stepSimulation(sim, input, 0.02);
  assert.equal(sim.phase, 'parotitis');
  assert.equal(sim.player.mucusCharges, initialCharges);
  assert.ok(throatNpc.interacted);
  assert.ok(sim.score >= 100);
  assert.ok(sim.disordersOvercome.includes('Gondongan (Parotitis)'));

  // Closing Parotitis resumes playing inside esophagus
  closeParotitisScene(sim);
  assert.equal(sim.phase, 'playing');
  assert.equal(sim.zoneId, 'esophagus');
});

test('stomach germ NPC allows E-key interaction to open GERD screen and resume gameplay cleanly', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  const stomachNpc = sim.npcs.find((n) => n.zone === 'stomach');
  assert.ok(stomachNpc, 'Expected an NPC inside stomach chamber');
  assert.equal(stomachNpc.id, 'npc_kuman_lambung');
  assert.equal(stomachNpc.diseaseId, 'gerd');

  const initialCharges = sim.player.mucusCharges;
  sim.zoneId = 'stomach';
  sim.player.x = stomachNpc.x - 1.2;
  sim.player.z = stomachNpc.z + 1.0;

  const near = findNearestNpc(sim);
  assert.ok(near);
  assert.equal(near.id, 'npc_kuman_lambung');
  const hudBefore = buildHudSnapshot(sim);
  assert.equal(hudBefore.nearNpc?.id, 'npc_kuman_lambung');

  // Press E near stomach NPC -> opens gerd screen without spending mucus charges
  input.shieldJustPressed = true;
  stepSimulation(sim, input, 0.02);
  assert.equal(sim.phase, 'gerd');
  assert.equal(sim.player.mucusCharges, initialCharges);
  assert.ok(stomachNpc.interacted);
  assert.ok(sim.score >= 100);
  assert.ok(sim.disordersOvercome.includes('GERD (Asam Lambung Naik)'));

  // Closing GERD resumes playing inside stomach
  closeGerdScene(sim);
  assert.equal(sim.phase, 'playing');
  assert.equal(sim.zoneId, 'stomach');
});

test('large intestine germ NPC allows E-key interaction to open Maag screen and resume gameplay cleanly', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  const colonNpc = sim.npcs.find((n) => n.zone === 'large_intestine');
  assert.ok(colonNpc, 'Expected an NPC inside large intestine');
  assert.equal(colonNpc.id, 'npc_kuman_usus_besar');
  assert.equal(colonNpc.diseaseId, 'maag');

  const initialCharges = sim.player.mucusCharges;
  sim.zoneId = 'large_intestine';
  sim.player.x = colonNpc.x + 1.0;
  sim.player.z = colonNpc.z + 1.0;

  const near = findNearestNpc(sim);
  assert.ok(near);
  assert.equal(near.id, 'npc_kuman_usus_besar');
  const hudBefore = buildHudSnapshot(sim);
  assert.equal(hudBefore.nearNpc?.id, 'npc_kuman_usus_besar');

  // Press E near large intestine NPC -> opens maag screen without draining mucus charges
  input.shieldJustPressed = true;
  stepSimulation(sim, input, 0.02);
  assert.equal(sim.phase, 'maag');
  assert.equal(sim.player.mucusCharges, initialCharges);
  assert.ok(colonNpc.interacted);
  assert.ok(sim.score >= 100);
  assert.ok(sim.disordersOvercome.includes('Maag / Mag (Gastritis)'));

  // Closing Maag resumes playing inside large_intestine
  closeMaagScene(sim);
  assert.equal(sim.phase, 'playing');
  assert.equal(sim.zoneId, 'large_intestine');
});

test('final pre-anus NPC allows E-key interaction to open Wasir/Ambeien screen before exiting anus', () => {
  const sim = createSimulation('burger', 'playing');
  const input = createInputState();
  const anusNpc = sim.npcs.find((n) => n.id === 'npc_kuman_anus');
  assert.ok(anusNpc, 'Expected final pre-anus NPC before TRACK_END_Z');
  assert.equal(anusNpc.zone, 'large_intestine');
  assert.equal(anusNpc.diseaseId, 'wasir');
  assert.ok(
    anusNpc.z > TRACK_END_Z && anusNpc.z <= -248,
    `Expected pre-anus NPC just before TRACK_END_Z (${TRACK_END_Z}), got ${anusNpc.z}`,
  );

  const initialCharges = sim.player.mucusCharges;
  sim.zoneId = 'large_intestine';
  sim.player.x = anusNpc.x - 1.2;
  sim.player.z = anusNpc.z + 1.0;

  const near = findNearestNpc(sim);
  assert.ok(near);
  assert.equal(near.id, 'npc_kuman_anus');
  const hudBefore = buildHudSnapshot(sim);
  assert.equal(hudBefore.nearNpc?.id, 'npc_kuman_anus');

  // Press E near pre-anus NPC -> opens wasir screen without spending mucus charges
  input.shieldJustPressed = true;
  stepSimulation(sim, input, 0.02);
  assert.equal(sim.phase, 'wasir');
  assert.equal(sim.player.mucusCharges, initialCharges);
  assert.ok(anusNpc.interacted);
  assert.ok(sim.score >= 100);
  assert.ok(sim.disordersOvercome.includes('Wasir / Ambeien (Hemoroid)'));

  // Closing Wasir resumes playing inside large_intestine right before the Anus exit
  closeWasirScene(sim);
  assert.equal(sim.phase, 'playing');
  assert.equal(sim.zoneId, 'large_intestine');
});
