export type GamePhase =
  | 'title'
  | 'intro'
  | 'playing'
  | 'xerostomia'
  | 'parotitis'
  | 'gerd'
  | 'maag'
  | 'wasir'
  | 'outro'
  | 'paused'
  | 'gameover';

export type FoodId = 'burger' | 'apple' | 'chicken' | 'chili';

export type ZoneId =
  | 'mouth'
  | 'esophagus'
  | 'stomach'
  | 'small_intestine'
  | 'large_intestine';

export interface FoodSpec {
  id: FoodId;
  name: string;
  subtitle: string;
  nutrientType: string;
  speed: number;
  maxHp: number;
  acidResist: number; // 0..0.6 damage reduction against acid
  fiberPower: number; // 1..5 breaks constipation & boosts peristalsis
  dashCooldown: number;
  stimulusSensitivity: number; // multiplier for stimulus score & effect
  primaryColor: string;
  accentColor: string;
  bioNote: string;
}

export interface ZoneSpec {
  id: ZoneId;
  name: string;
  organLabel: string;
  locationDesc: string;
  zStart: number;
  zEnd: number;
  halfWidth: number;
  wallColor: number;
  fogColor: number;
  keyStimulus: string;
  keyResponse: string;
  disorderName: string;
  disorderDesc: string;
}

export type HazardKind =
  | 'tooth_crusher'
  | 'acid_geyser'
  | 'h_pylori'
  | 'e_coli'
  | 'constipation_rock'
  | 'canker_sore';

export interface HazardEntity {
  id: string;
  kind: HazardKind;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseZ: number;
  radius: number;
  hp: number;
  maxHp: number;
  state: 'idle' | 'telegraph' | 'active' | 'cooldown' | 'ko';
  timer: number;
  cycleOffset: number;
  hitFlash: number;
  alive: boolean;
  label: string;
  disorderTag: string;
}

export type PickupKind =
  | 'amylase'
  | 'mucus'
  | 'pepsin'
  | 'bile'
  | 'water'
  | 'probiotic';

export interface PickupEntity {
  id: string;
  kind: PickupKind;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  radius: number;
  collected: boolean;
  label: string;
  points: number;
}

export interface StimulusNode {
  id: string;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  radius: number;
  triggered: boolean;
  stimulusName: string;
  responseName: string;
  effectDesc: string;
  pulse: number;
}

export interface ProjectileEntity {
  id: string;
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  damage: number;
  life: number;
  color: number;
}

export type NpcDiseaseId = 'xerostomia' | 'parotitis' | 'gerd' | 'maag' | 'wasir';

export interface DigestiveNpc {
  id: string;
  zone: ZoneId;
  diseaseId: NpcDiseaseId;
  name: string;
  topic: string;
  x: number;
  y: number;
  z: number;
  interactRadius: number;
  interacted: boolean;
}

export type MouthNpc = DigestiveNpc;

export interface SimEvent {
  type:
    | 'pickup'
    | 'stimulus'
    | 'dash'
    | 'shield'
    | 'hit'
    | 'enemy_ko'
    | 'zone_enter'
    | 'transform_stool'
    | 'npc_interact'
    | 'victory'
    | 'defeat';
  x: number;
  y: number;
  z: number;
  intensity: number;
  color: number;
  message?: string;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  hp: number;
  maxHp: number;
  hydration: number;
  maxHydration: number;
  mucusCharges: number;
  maxMucusCharges: number;
  shieldTimer: number;
  dashTimer: number;
  dashCooldownTimer: number;
  invulnTimer: number;
  hitFlashTimer: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotY: number;
  distTraveled: number;
  isStool: boolean;
  stoolScale: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  cameraYaw: number;
  dashJustPressed: boolean;
  shieldJustPressed: boolean;
  stimulusJustPressed: boolean;
  dashBuffer: number;
  shieldBuffer: number;
  stimulusBuffer: number;
}

export interface ActivePrompt {
  stimulus: string;
  response: string;
  actionHint: string;
  kind: 'info' | 'warning' | 'stimulus';
  timer: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  outcome: 'victory' | 'defeat' | null;
  foodId: FoodId;
  zoneId: ZoneId;
  zoneName: string;
  progressPct: number;
  hp: number;
  maxHp: number;
  hydration: number;
  mucusCharges: number;
  maxMucusCharges: number;
  shieldActive: boolean;
  shieldRatio: number;
  dashReadyRatio: number;
  score: number;
  bestScore: number;
  enzymesCollected: number;
  stimuliTriggered: number;
  totalStimuli: number;
  disordersOvercome: string[];
  elapsedTime: number;
  nearStimulus: StimulusNode | null;
  nearNpc: MouthNpc | null;
  activePrompt: ActivePrompt | null;
  combo: number;
  isStool: boolean;
  stoolScale: number;
}

export interface SimulationState {
  phase: GamePhase;
  outcome: 'victory' | 'defeat' | null;
  foodId: FoodId;
  zoneId: ZoneId;
  player: PlayerState;
  hazards: HazardEntity[];
  pickups: PickupEntity[];
  stimuli: StimulusNode[];
  mouthNpc: MouthNpc;
  npcs: DigestiveNpc[];
  projectiles: ProjectileEntity[];
  events: SimEvent[];
  score: number;
  bestScore: number;
  enzymesCollected: number;
  stimuliTriggered: number;
  disordersOvercome: string[];
  elapsedTime: number;
  hitstopTimer: number;
  trauma: number;
  combo: number;
  comboTimer: number;
  activePrompt: ActivePrompt | null;
  peristalsisBoostTimer: number;
  diarrheaCurrentTimer: number;
  dryMouthTimer: number;
}
