import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  TRACK_END_Z,
  ZONES,
  getTrackFloorY,
  getTrackHalfWidth,
  trackToWorld,
} from './data';
import { soundEngine } from './audio';
import {
  buildDigestiveWorld,
  buildDiningTableStage,
  buildFoodHeroGroup,
  buildDigestiveNpcMesh,
  buildHazardMesh,
  buildPickupMesh,
  buildStimulusMesh,
  buildStoolHeroGroup,
  buildToiletStage,
} from './models';
import {
  buildHudSnapshot,
  clearInputState,
  closeGerdScene,
  closeMaagScene,
  closeParotitisScene,
  closeWasirScene,
  closeXerostomiaScene,
  completeVictoryOutro,
  createInputState,
  createSimulation,
  getStoolScaleForScore,
  stepSimulation,
  switchFoodInSimulation,
} from './simulation';
import { createProceduralTextures } from './textures';
import { FoodId, GamePhase, HudSnapshot, SimulationState } from './types';

export interface GameController {
  startGame: () => void;
  skipIntro: () => void;
  skipOutro: () => void;
  closeXerostomia: () => void;
  closeParotitis: () => void;
  closeGerd: () => void;
  closeMaag: () => void;
  closeWasir: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  returnToTitle: () => void;
  selectFood: (foodId: FoodId) => void;
  triggerStimulus: () => void;
  triggerMucus: () => void;
  triggerDash: () => void;
  setCameraOrbitHold: (dir: -1 | 0 | 1) => void;
  nudgeCameraYaw: (deltaRad: number) => void;
  resetCamera: () => void;
  toggleShiftLock: () => void;
  setShiftLock: (enabled: boolean) => void;
}

interface ThreeGameCanvasProps {
  initialFood: FoodId;
  autostart: boolean;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onControllerReady: (ctrl: GameController) => void;
  onShiftLockChange?: (locked: boolean) => void;
}

// Pre-allocated scratch math objects (Zero GC in render loop)
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _curLookAt = new THREE.Vector3(0, 1.0, -6);
const _camFwd = new THREE.Vector3();
const _fogColor = new THREE.Color();
const _dummy = new THREE.Object3D();
const _chunkDummy = new THREE.Object3D();
const _partColor = new THREE.Color();
const _villiOffset = new THREE.Matrix4();

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

const PARTICLE_POOL_SIZE = 120;

export const ThreeGameCanvas: React.FC<ThreeGameCanvasProps> = ({
  initialFood,
  autostart,
  onHudUpdate,
  onControllerReady,
  onShiftLockChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hudCallbackRef = useRef(onHudUpdate);
  hudCallbackRef.current = onHudUpdate;

  const controllerCallbackRef = useRef(onControllerReady);
  controllerCallbackRef.current = onControllerReady;

  const shiftLockCallbackRef = useRef(onShiftLockChange);
  shiftLockCallbackRef.current = onShiftLockChange;

  const initialFoodRef = useRef(initialFood);
  const autostartRef = useRef(autostart);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL (SwiftShader/llvmpipe/WARP)
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Renderer & Scene Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.tabIndex = 0;
    container.appendChild(renderer.domElement);

    const isInitialTitle = !autostartRef.current;
    const startBgHex = isInitialTitle ? 0x3b2218 : ZONES[0].fogColor;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(startBgHex);
    scene.fog = new THREE.FogExp2(startBgHex, isInitialTitle ? 0.015 : 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      62,
      (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
      0.1,
      140,
    );
    if (isInitialTitle) {
      camera.position.set(-1.4, 1.65, 3.9);
      _curLookAt.set(-1.15, 0.35, -0.35);
    } else {
      camera.position.set(0, 3.9, 5.8);
      _curLookAt.set(0, 1.1, -7.5);
    }
    camera.lookAt(_curLookAt);

    // 3. Three-point / Warm-Cool Studio Lighting + Player PointLight
    const hemiLight = new THREE.HemisphereLight(0xfef2f2, 0x3b0764, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1e6, 1.45);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const playerLight = new THREE.PointLight(0xffe4e6, 1.8, 22, 1.6);
    playerLight.position.set(0, 2.8, 0);
    scene.add(playerLight);

    // 4. Procedural Textures & World
    const maxAniso = isSoftwareGl
      ? 1
      : renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTextures(maxAniso);
    const worldRefs = buildDigestiveWorld(scene, textures, isSoftwareGl);
    const diningRefs = buildDiningTableStage(scene, textures, isSoftwareGl);
    const toiletRefs = buildToiletStage(scene, textures, isSoftwareGl);

    // 5. Simulation State & Dynamic Entity Meshes
    const initialPhase: GamePhase = autostartRef.current ? 'playing' : 'title';
    let sim: SimulationState = createSimulation(
      initialFoodRef.current,
      initialPhase,
      0,
    );
    const urlParams =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const startZoneParam = urlParams?.get('zone') ?? null;
    if (autostartRef.current && startZoneParam === 'stomach') {
      const stZ = -106;
      const wStart = trackToWorld(0, stZ);
      sim.player.z = stZ;
      sim.player.x = wStart.cx;
      sim.player.y = wStart.fy + 0.65;
      sim.zoneId = 'stomach';
      sim.activePrompt = {
        stimulus: 'Memasuki Lambung',
        response: 'Asam HCl & Pepsin mencerna bongkahan makanan!',
        actionHint: 'Jelajahi kantung lambung luas · E Mukus · F Stimulus',
        kind: 'info',
        timer: 4.5,
      };
      const wCam = trackToWorld(0, stZ + 6);
      camera.position.set(wCam.cx, wCam.fy + 4.2, wCam.cz);
      const wLook = trackToWorld(0, stZ - 14);
      _curLookAt.set(wLook.cx, wLook.fy + 1.2, wLook.cz);
      camera.lookAt(_curLookAt);
      if (scene.background instanceof THREE.Color) {
        scene.background.setHex(ZONES[2].fogColor);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(ZONES[2].fogColor);
        scene.fog.density = 0.011;
      }
    } else if (
      autostartRef.current &&
      (startZoneParam === 'colon' || startZoneParam === 'large_intestine')
    ) {
      const colonScore = Math.max(
        0,
        Number(urlParams?.get('score') ?? 300) || 0,
      );
      const customZ = Number(urlParams?.get('z'));
      const colonZ =
        Number.isFinite(customZ) && customZ <= -212 && customZ >= -253.8
          ? customZ
          : -236;
      const wStart = trackToWorld(0, colonZ);
      sim.score = colonScore;
      sim.bestScore = Math.max(sim.bestScore, colonScore);
      sim.player.z = colonZ;
      sim.player.x = wStart.cx;
      sim.player.y = wStart.fy + 0.65;
      sim.zoneId = 'large_intestine';
      sim.player.isStool = colonZ <= -230;
      sim.player.stoolScale = sim.player.isStool ? getStoolScaleForScore(colonScore) : 1;
      sim.activePrompt = {
        stimulus: 'Pembentukan Feses Sebelum Anus!',
        response: 'Sisa pencernaan berubah menjadi kotoran (feses) menuju Anus.',
        actionHint: `Skor ${Math.round(sim.score)} → Ukuran Feses ${Math.round(sim.player.stoolScale * 100)}%`,
        kind: 'info',
        timer: 4.5,
      };
      const wCam = trackToWorld(0, colonZ + 5.4);
      camera.position.set(wCam.cx, wCam.fy + 2.9, wCam.cz);
      const wLook = trackToWorld(0, colonZ - 14);
      _curLookAt.set(wLook.cx, wLook.fy + 1.0, wLook.cz);
      camera.lookAt(_curLookAt);
      if (scene.background instanceof THREE.Color) {
        scene.background.setHex(ZONES[4].fogColor);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(ZONES[4].fogColor);
        scene.fog.density = 0.021;
      }
    }
    const input = createInputState();

    // Food Hero Meshes Cache + Stool Form Mesh
    const heroGroups: Record<FoodId, THREE.Group> = {
      burger: buildFoodHeroGroup('burger', textures),
      apple: buildFoodHeroGroup('apple', textures),
      chicken: buildFoodHeroGroup('chicken', textures),
      chili: buildFoodHeroGroup('chili', textures),
    };
    const stoolHeroGroup = buildStoolHeroGroup(textures);
    const heroPivot = new THREE.Group();
    heroPivot.rotation.order = 'YXZ';
    scene.add(heroPivot);
    let activeFoodId: FoodId = sim.foodId;
    let visualStoolScale = sim.player.isStool ? sim.player.stoolScale : 1;
    (Object.keys(heroGroups) as FoodId[]).forEach((fid) => {
      heroGroups[fid].visible = !sim.player.isStool && fid === activeFoodId;
      heroPivot.add(heroGroups[fid]);
    });
    stoolHeroGroup.visible = sim.player.isStool;
    heroPivot.add(stoolHeroGroup);

    // Dynamic entity mesh maps
    let pickupMeshes = new Map<string, THREE.Group>();
    let hazardMeshes = new Map<string, THREE.Group>();
    let stimulusMeshes = new Map<string, THREE.Group>();
    let npcMeshes = new Map<string, THREE.Group>();
    const projectileMeshes = new Map<string, THREE.Mesh>();
    const projGeo = new THREE.SphereGeometry(0.42, 12, 10);
    const projMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x4d7c0f,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    });

    // Pooled InstancedMesh particles
    const partGeo = new THREE.SphereGeometry(0.16, 8, 6);
    const partMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(
      partGeo,
      partMat,
      PARTICLE_POOL_SIZE,
    );
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particles: ParticleSlot[] = Array.from(
      { length: PARTICLE_POOL_SIZE },
      () => ({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 0,
        color: 0xffffff,
      }),
    );
    let particleCursor = 0;

    function spawnParticles(
      x: number,
      y: number,
      z: number,
      count: number,
      color: number,
      speed = 4.5,
      sizeScale = 1,
    ): void {
      for (let i = 0; i < count; i++) {
        const slot = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.z = z;
        const a = Math.random() * Math.PI * 2;
        const up = 0.4 + Math.random() * 0.9;
        const sp = speed * (0.45 + Math.random() * 0.75);
        slot.vx = Math.cos(a) * sp;
        slot.vy = up * sp;
        slot.vz = Math.sin(a) * sp;
        slot.maxLife = 0.45 + Math.random() * 0.35;
        slot.life = slot.maxLife;
        slot.size = (0.7 + Math.random() * 0.8) * sizeScale;
        slot.color = color;
      }
    }

    function rebuildEntityMeshes(): void {
      pickupMeshes.forEach((m) => scene.remove(m));
      hazardMeshes.forEach((m) => scene.remove(m));
      stimulusMeshes.forEach((m) => scene.remove(m));
      projectileMeshes.forEach((m) => scene.remove(m));
      npcMeshes.forEach((m) => scene.remove(m));
      pickupMeshes.clear();
      hazardMeshes.clear();
      stimulusMeshes.clear();
      npcMeshes.clear();
      projectileMeshes.clear();

      for (const pk of sim.pickups) {
        const m = buildPickupMesh(pk, textures);
        scene.add(m);
        pickupMeshes.set(pk.id, m);
      }
      for (const hz of sim.hazards) {
        const m = buildHazardMesh(hz, textures);
        scene.add(m);
        hazardMeshes.set(hz.id, m);
      }
      for (const st of sim.stimuli) {
        const m = buildStimulusMesh(st, textures);
        scene.add(m);
        stimulusMeshes.set(st.id, m);
      }
      for (const npc of sim.npcs) {
        const m = buildDigestiveNpcMesh(npc, textures);
        scene.add(m);
        npcMeshes.set(npc.id, m);
      }
    }

    rebuildEntityMeshes();
    diningRefs.stage.visible = isInitialTitle;
    diningRefs.mouthPortal.visible = false;
    toiletRefs.stage.visible = false;
    worldRefs.worldGroup.visible = !isInitialTitle;
    heroPivot.position.set(sim.player.x, isInitialTitle ? 0.41 : sim.player.y, sim.player.z);
    if (isInitialTitle) {
      pickupMeshes.forEach((m) => { m.visible = false; });
      hazardMeshes.forEach((m) => { m.visible = false; });
      stimulusMeshes.forEach((m) => { m.visible = false; });
      npcMeshes.forEach((m) => { m.visible = false; });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Sync body attributes immediately
    function syncBodyAttributes(): void {
      document.body.dataset.state = sim.phase;
      document.body.dataset.zone = sim.zoneId;
      document.body.dataset.food = sim.foodId;
      document.body.dataset.hp = String(Math.round(sim.player.hp));
      document.body.dataset.score = String(Math.round(sim.score));
      document.body.dataset.stool = sim.player.isStool ? '1' : '0';
      document.body.dataset.stoolscale = sim.player.stoolScale.toFixed(2);
    }

    syncBodyAttributes();
    hudCallbackRef.current(buildHudSnapshot(sim));

    const INTRO_DURATION = 2.25;
    let introTimer = 0;
    const OUTRO_DURATION = 3.1;
    let outroTimer = 0;
    let outroSplashPlayed = false;
    let outroFlushPlayed = false;

    // Interactive Movable Camera & Shift Lock State
    const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
    let camYawOffset = 0;
    let camPitchOffset = 0;
    let camDistScale = 1.0;
    let camKeyLeft = false;
    let camKeyRight = false;
    let camHudHoldDir: -1 | 0 | 1 = 0;
    let isDraggingCam = false;
    let shiftLockEnabled = false;
    let shoulderOffset = 0;
    let heroVisualYaw = Math.PI;
    let hasLastMousePos = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const applyShiftLock = (next: boolean) => {
      const target = next && sim.phase === 'playing';
      if (shiftLockEnabled !== target) {
        shiftLockEnabled = target;
        hasLastMousePos = false;
        document.body.dataset.shiftlock = shiftLockEnabled ? 'on' : 'off';
        shiftLockCallbackRef.current?.(shiftLockEnabled);
      } else {
        document.body.dataset.shiftlock = shiftLockEnabled ? 'on' : 'off';
      }
      if (shiftLockEnabled) {
        try {
          if (document.pointerLockElement !== renderer.domElement) {
            const maybePromise = renderer.domElement.requestPointerLock?.() as unknown as Promise<void> | undefined;
            if (maybePromise && typeof maybePromise.catch === 'function') {
              maybePromise.catch(() => {});
            }
          }
        } catch {
          // Pointer lock may be blocked in sandboxed iframes; hover fallback stays active
        }
      } else {
        try {
          if (document.pointerLockElement === renderer.domElement) {
            document.exitPointerLock?.();
          }
        } catch {
          // Ignore exitPointerLock errors
        }
      }
    };
    document.body.dataset.shiftlock = 'off';

    const resetRun = (targetPhase: GamePhase, foodId: FoodId) => {
      const best = sim.bestScore;
      sim = createSimulation(foodId, targetPhase, best);
      clearInputState(input);
      activeFoodId = foodId;
      visualStoolScale = 1;
      outroTimer = 0;
      outroSplashPlayed = false;
      outroFlushPlayed = false;
      heroPivot.visible = true;
      stoolHeroGroup.visible = false;
      toiletRefs.stage.visible = false;
      (Object.keys(heroGroups) as FoodId[]).forEach((fid) => {
        heroGroups[fid].visible = fid === activeFoodId;
      });
      rebuildEntityMeshes();
      syncBodyAttributes();
      hudCallbackRef.current(buildHudSnapshot(sim));
    };

    const finishIntroToPlaying = () => {
      if (sim.phase !== 'intro') return;
      introTimer = 0;
      sim.phase = 'playing';
      sim.activePrompt = {
        stimulus: 'Rongga Mulut Siap!',
        response: 'Hindari gigi geraham & kumpulkan Enzim Amilase.',
        actionHint: 'WASD Gerak · Space Dash · E Mukus · F Respon Saraf',
        kind: 'info',
        timer: 4.5,
      };
      diningRefs.mouthPortal.visible = false;
      diningRefs.stage.visible = false;
      worldRefs.worldGroup.visible = true;
      heroPivot.visible = true;
      heroPivot.rotation.set(0, sim.player.rotY, 0);
      heroVisualYaw = sim.player.rotY;
      heroPivot.scale.set(1, 1, 1);
      heroPivot.position.set(sim.player.x, sim.player.y, sim.player.z);
      if (camera.fov !== 62) {
        camera.fov = 62;
        camera.updateProjectionMatrix();
      }
      // Enter slightly zoomed forward so the follow-camera glides smoothly into standard framing
      camera.position.set(0, 2.75, 2.4);
      _curLookAt.set(0, 1.25, -7.5);
      camera.lookAt(_curLookAt);
      if (scene.background instanceof THREE.Color) {
        scene.background.setHex(ZONES[0].fogColor);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(ZONES[0].fogColor);
      }
      soundEngine.playZoneEnter();
      renderer.domElement.focus();
      syncBodyAttributes();
      hudCallbackRef.current(buildHudSnapshot(sim));
    };

    const finishOutroToVictory = () => {
      if (sim.phase !== 'outro') return;
      outroTimer = 0;
      completeVictoryOutro(sim);
      heroPivot.visible = false;
      soundEngine.playVictory();
      spawnParticles(0, 1.35, 0, 24, 0xfbbf24, 5.8);
      syncBodyAttributes();
      hudCallbackRef.current(buildHudSnapshot(sim));
    };

    // Expose Controller to React UI
    const controller: GameController = {
      startGame: () => {
        introTimer = 0;
        applyShiftLock(false);
        resetRun('intro', sim.foodId);
        diningRefs.stage.visible = true;
        diningRefs.mouthPortal.visible = true;
        diningRefs.mouthPortal.position.set(0, 2.65, -4.1);
        diningRefs.mouthPortal.rotation.set(0.08, 0, 0);
        diningRefs.mouthPortal.scale.setScalar(1);
        diningRefs.upperJaw.position.y = -0.18;
        diningRefs.lowerJaw.position.y = 0.18;
        diningRefs.tongue.position.y = -0.5;
        worldRefs.worldGroup.visible = false;
        heroPivot.position.set(0, 0.41, 0);
        heroPivot.rotation.set(0, 0, 0);
        heroPivot.scale.set(1, 1, 1);
        camera.fov = 62;
        camera.updateProjectionMatrix();
        camera.position.set(-1.4, 1.65, 3.9);
        _curLookAt.set(-1.15, 0.35, -0.35);
        camera.lookAt(_curLookAt);
        soundEngine.playMouthEntry();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        renderer.domElement.focus();
      },
      skipIntro: () => {
        finishIntroToPlaying();
      },
      skipOutro: () => {
        finishOutroToVictory();
      },
      closeXerostomia: () => {
        if (sim.phase === 'xerostomia') {
          closeXerostomiaScene(sim);
          clearInputState(input);
          renderer.domElement.focus();
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      closeParotitis: () => {
        if (sim.phase === 'parotitis') {
          closeParotitisScene(sim);
          clearInputState(input);
          renderer.domElement.focus();
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      closeGerd: () => {
        if (sim.phase === 'gerd') {
          closeGerdScene(sim);
          clearInputState(input);
          renderer.domElement.focus();
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      closeMaag: () => {
        if (sim.phase === 'maag') {
          closeMaagScene(sim);
          clearInputState(input);
          renderer.domElement.focus();
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      closeWasir: () => {
        if (sim.phase === 'wasir') {
          closeWasirScene(sim);
          clearInputState(input);
          renderer.domElement.focus();
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      pauseGame: () => {
        if (sim.phase === 'playing') {
          sim.phase = 'paused';
          applyShiftLock(false);
          clearInputState(input);
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      resumeGame: () => {
        if (sim.phase === 'paused') {
          sim.phase = 'playing';
          clearInputState(input);
          renderer.domElement.focus();
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      },
      restartGame: () => {
        introTimer = 0;
        applyShiftLock(false);
        diningRefs.mouthPortal.visible = false;
        if (camera.fov !== 62) {
          camera.fov = 62;
          camera.updateProjectionMatrix();
        }
        resetRun('playing', sim.foodId);
        heroVisualYaw = sim.player.rotY;
        camera.position.set(0, 3.9, 5.8);
        _curLookAt.set(0, 1.1, -7.5);
        camera.lookAt(_curLookAt);
        renderer.domElement.focus();
      },
      returnToTitle: () => {
        introTimer = 0;
        applyShiftLock(false);
        diningRefs.mouthPortal.visible = false;
        if (camera.fov !== 62) {
          camera.fov = 62;
          camera.updateProjectionMatrix();
        }
        resetRun('title', sim.foodId);
        heroPivot.rotation.set(0, 0, 0);
        heroPivot.scale.set(1, 1, 1);
        camera.position.set(-1.4, 1.65, 3.9);
        _curLookAt.set(-1.15, 0.35, -0.35);
        camera.lookAt(_curLookAt);
      },
      selectFood: (foodId: FoodId) => {
        switchFoodInSimulation(sim, foodId);
        activeFoodId = foodId;
        (Object.keys(heroGroups) as FoodId[]).forEach((fid) => {
          heroGroups[fid].visible = !sim.player.isStool && fid === foodId;
        });
        stoolHeroGroup.visible = sim.player.isStool;
        spawnParticles(sim.player.x, sim.player.y + 0.3, sim.player.z, 10, 0xfbbf24, 3.2);
        syncBodyAttributes();
        hudCallbackRef.current(buildHudSnapshot(sim));
      },
      triggerStimulus: () => {
        input.stimulusJustPressed = true;
      },
      triggerMucus: () => {
        input.shieldJustPressed = true;
      },
      triggerDash: () => {
        input.dashJustPressed = true;
      },
      setCameraOrbitHold: (dir: -1 | 0 | 1) => {
        camHudHoldDir = dir;
      },
      nudgeCameraYaw: (deltaRad: number) => {
        camYawOffset = wrapAngle(camYawOffset + deltaRad);
      },
      resetCamera: () => {
        camYawOffset = 0;
        camPitchOffset = 0;
        camDistScale = 1.0;
      },
      toggleShiftLock: () => {
        applyShiftLock(!shiftLockEnabled);
      },
      setShiftLock: (enabled: boolean) => {
        applyShiftLock(enabled);
      },
    };
    controllerCallbackRef.current(controller);

    // 6. Keyboard & Focus Hygiene
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
          code,
        )
      ) {
        e.preventDefault();
      }
      if (code === 'KeyW' || code === 'ArrowUp') input.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') input.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') input.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') input.right = true;
      if (code === 'KeyQ') camKeyLeft = true;
      if (code === 'KeyR') camKeyRight = true;

      if (!e.repeat) {
        if ((code === 'ShiftLeft' || code === 'ShiftRight') && sim.phase === 'playing') {
          e.preventDefault();
          applyShiftLock(!shiftLockEnabled);
        }
        if (code === 'KeyC') {
          camYawOffset = 0;
          camPitchOffset = 0;
          camDistScale = 1.0;
        }
        if (code === 'Space') {
          if (sim.phase === 'title') {
            controller.startGame();
          } else if (sim.phase === 'intro') {
            finishIntroToPlaying();
          } else if (sim.phase === 'xerostomia') {
            controller.closeXerostomia();
          } else if (sim.phase === 'parotitis') {
            controller.closeParotitis();
          } else if (sim.phase === 'gerd') {
            controller.closeGerd();
          } else if (sim.phase === 'maag') {
            controller.closeMaag();
          } else if (sim.phase === 'wasir') {
            controller.closeWasir();
          } else if (sim.phase === 'outro') {
            finishOutroToVictory();
          } else {
            input.dashJustPressed = true;
          }
        }
        if (code === 'Enter') {
          if (sim.phase === 'title') {
            controller.startGame();
          } else if (sim.phase === 'intro') {
            finishIntroToPlaying();
          } else if (sim.phase === 'xerostomia') {
            controller.closeXerostomia();
          } else if (sim.phase === 'parotitis') {
            controller.closeParotitis();
          } else if (sim.phase === 'gerd') {
            controller.closeGerd();
          } else if (sim.phase === 'maag') {
            controller.closeMaag();
          } else if (sim.phase === 'wasir') {
            controller.closeWasir();
          } else if (sim.phase === 'outro') {
            finishOutroToVictory();
          }
        }
        if (code === 'KeyE') input.shieldJustPressed = true;
        if (code === 'KeyF') input.stimulusJustPressed = true;
        if (code === 'Escape' || code === 'KeyP') {
          if (sim.phase === 'intro') finishIntroToPlaying();
          else if (sim.phase === 'xerostomia') controller.closeXerostomia();
          else if (sim.phase === 'parotitis') controller.closeParotitis();
          else if (sim.phase === 'gerd') controller.closeGerd();
          else if (sim.phase === 'maag') controller.closeMaag();
          else if (sim.phase === 'wasir') controller.closeWasir();
          else if (sim.phase === 'outro') finishOutroToVictory();
          else if (sim.phase === 'playing') controller.pauseGame();
          else if (sim.phase === 'paused') controller.resumeGame();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') input.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') input.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') input.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') input.right = false;
      if (code === 'KeyQ') camKeyLeft = false;
      if (code === 'KeyR') camKeyRight = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDraggingCam = true;
      hasLastMousePos = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      if (shiftLockEnabled && sim.phase === 'playing' && document.pointerLockElement !== renderer.domElement) {
        try {
          const maybePromise = renderer.domElement.requestPointerLock?.() as unknown as Promise<void> | undefined;
          if (maybePromise && typeof maybePromise.catch === 'function') {
            maybePromise.catch(() => {});
          }
        } catch {
          // Ignore pointer lock rejection inside sandboxed iframes
        }
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const hasPtrLock = document.pointerLockElement === renderer.domElement;
      const trackFreeMouse = shiftLockEnabled && sim.phase === 'playing';
      if (!hasPtrLock && !isDraggingCam && !trackFreeMouse) return;

      let dx = 0;
      let dy = 0;
      if (hasPtrLock) {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      } else {
        if (!hasLastMousePos) {
          lastPointerX = e.clientX;
          lastPointerY = e.clientY;
          hasLastMousePos = true;
          return;
        }
        dx = e.clientX - lastPointerX;
        dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      }

      camYawOffset = wrapAngle(camYawOffset + dx * 0.0055);
      camPitchOffset = Math.max(-0.45, Math.min(0.55, camPitchOffset - dy * 0.004));
    };
    const onPointerUp = () => {
      isDraggingCam = false;
    };
    const onWheel = (e: WheelEvent) => {
      camDistScale = Math.max(
        0.72,
        Math.min(1.45, camDistScale + Math.sign(e.deltaY) * 0.06),
      );
    };

    const onBlurOrHide = () => {
      clearInputState(input);
      camKeyLeft = false;
      camKeyRight = false;
      camHudHoldDir = 0;
      isDraggingCam = false;
      hasLastMousePos = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlurOrHide);
    document.addEventListener('visibilitychange', onBlurOrHide);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 7. Game Loop (Software-WebGL safe pacing + Zero GC)
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let hudAccum = 0;
    let ambientTime = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      ambientTime += dt;

      // Compute character movement yaw relative to live camera look direction
      if (sim.phase === 'playing') {
        camera.getWorldDirection(_camFwd);
        const fLen = Math.hypot(_camFwd.x, _camFwd.z);
        if (fLen > 1e-4) {
          const ux = _camFwd.x / fLen;
          const uz = _camFwd.z / fLen;
          const wFrame = trackToWorld(sim.player.x, sim.player.z);
          const fwdComp = ux * wFrame.tx + uz * wFrame.tz;
          const rightComp = ux * wFrame.rx + uz * wFrame.rz;
          input.cameraYaw = Math.atan2(rightComp, fwdComp);
        } else {
          input.cameraYaw = 0;
        }
      } else {
        input.cameraYaw = 0;
      }

      const prevPhase = sim.phase;
      stepSimulation(sim, input, dt);

      // Process simulation events -> Audio & Pooled Particles (mapped via trackToWorld)
      for (const ev of sim.events) {
        const wEv = trackToWorld(ev.x, ev.z);
        if (ev.type === 'pickup') {
          soundEngine.playPickup();
          spawnParticles(wEv.x, wEv.y + 0.65, wEv.z, 8, ev.color, 3.8);
        } else if (ev.type === 'stimulus') {
          soundEngine.playStimulus();
          spawnParticles(wEv.x, wEv.y + 0.85, wEv.z, 18, ev.color, 5.5);
        } else if (ev.type === 'dash') {
          soundEngine.playDash();
          spawnParticles(wEv.x, wEv.y + 0.65, wEv.z, 10, ev.color, 4.0);
        } else if (ev.type === 'shield') {
          soundEngine.playShield();
          spawnParticles(wEv.x, wEv.y + 0.65, wEv.z, 12, ev.color, 4.2);
        } else if (ev.type === 'hit') {
          soundEngine.playHit();
          spawnParticles(wEv.x, wEv.y + 0.65, wEv.z, 16, ev.color, 5.8);
        } else if (ev.type === 'enemy_ko') {
          soundEngine.playEnemyKo();
          spawnParticles(wEv.x, wEv.y + 0.65, wEv.z, 22, ev.color, 6.2);
        } else if (ev.type === 'zone_enter') {
          soundEngine.playZoneEnter();
        } else if (ev.type === 'transform_stool') {
          soundEngine.playStimulus();
          spawnParticles(wEv.x, wEv.y + 0.75, wEv.z, 22, ev.color, 5.2);
        } else if (ev.type === 'npc_interact') {
          applyShiftLock(false);
          clearInputState(input);
          soundEngine.playStimulus();
          spawnParticles(wEv.x, wEv.y + 0.9, wEv.z, 20, ev.color, 5.0);
        } else if (ev.type === 'victory') {
          applyShiftLock(false);
          outroTimer = 0;
          outroSplashPlayed = false;
          outroFlushPlayed = false;
          heroPivot.visible = true;
          toiletRefs.waterSurface.position.y = 1.04;
          toiletRefs.swirlGroup.position.y = 1.06;
          toiletRefs.swirlGroup.rotation.y = 0;
          toiletRefs.swirlGroup.scale.setScalar(1);
          toiletRefs.flushHandlePivot.rotation.z = 0;
          if (camera.fov !== 62) {
            camera.fov = 62;
            camera.updateProjectionMatrix();
          }
          camera.position.set(3.15, 3.85, 4.15);
          _curLookAt.set(0, 1.4, 0.0);
          camera.lookAt(_curLookAt);
          if (scene.background instanceof THREE.Color) {
            scene.background.setHex(0xdbeafe);
          }
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.setHex(0xdbeafe);
            scene.fog.density = 0.008;
          }
          soundEngine.playZoneEnter();
        } else if (ev.type === 'defeat') {
          soundEngine.playDefeat();
        }
      }

      // Toggle Dining Table (Menu & Intro), Digestive World (Gameplay), or Bathroom Toilet (Outro & Victory)
      const isTitle = sim.phase === 'title';
      const isIntro = sim.phase === 'intro';
      const isOutro = sim.phase === 'outro';
      const isOutroDone = sim.phase === 'gameover' && sim.outcome === 'victory';
      const showDining = isTitle || isIntro;
      const showToilet = isOutro || isOutroDone;
      const hideWorldEntities = showDining || showToilet;
      diningRefs.stage.visible = showDining;
      diningRefs.mouthPortal.visible = isIntro;
      toiletRefs.stage.visible = showToilet;
      worldRefs.worldGroup.visible = !showDining && !showToilet;

      // Sync Food Hero Transform, Gait Bob, Intro Mouth-Entry, Outro Toilet-Flush, & Shield Bubble
      const p = sim.player;
      let fogTargetHex = isTitle
        ? 0x3b2218
        : showToilet
          ? 0xdbeafe
          : (ZONES.find((z) => z.id === sim.zoneId) || ZONES[0]).fogColor;

      if (isIntro) {
        introTimer += dt;
        const u = Math.min(1, introTimer / INTRO_DURATION);
        diningRefs.uvula.rotation.z = Math.sin(ambientTime * 6.2) * 0.14;

        if (u < 0.28) {
          // Act 1: Diner head leans forward & opens mouth wide while food squats to launch
          const tA = u / 0.28;
          const easeA = 1 - Math.pow(1 - tA, 3);
          diningRefs.mouthPortal.position.set(0, 2.65 - 1.1 * easeA, -4.1 + 1.55 * easeA);
          diningRefs.mouthPortal.rotation.set(0.08 * (1 - easeA), 0, 0);
          diningRefs.mouthPortal.scale.setScalar(1);
          diningRefs.upperJaw.position.y = -0.18 + 0.44 * easeA;
          diningRefs.lowerJaw.position.y = 0.18 - 0.56 * easeA;
          diningRefs.tongue.position.y = -0.5;

          const squat = Math.sin(tA * Math.PI);
          heroPivot.position.set(0, 0.41 - 0.09 * squat, 0);
          heroPivot.rotation.set(-0.2 * easeA, Math.sin(tA * Math.PI) * 0.25, 0);
          heroPivot.scale.set(1 + 0.18 * squat, 1 - 0.25 * squat, 1 + 0.18 * squat);

          _camTargetPos.set(-1.4 + 1.65 * easeA, 1.65 - 0.13 * easeA, 3.9 - 0.65 * easeA);
          _camLookTarget.set(-1.15 * (1 - easeA), 0.35 + 1.0 * easeA, -0.35 - 2.0 * easeA);
        } else if (u < 0.74) {
          // Act 2: Joyful ballistic leap & spin off the plate directly over the teeth onto the tongue
          const tB = (u - 0.28) / 0.46;
          const easeB = tB < 0.5 ? 4 * tB * tB * tB : 1 - Math.pow(-2 * tB + 2, 3) / 2;
          diningRefs.mouthPortal.position.set(0, 1.55, -2.55);
          diningRefs.mouthPortal.rotation.set(0, 0, 0);
          diningRefs.mouthPortal.scale.setScalar(1 + Math.sin(tB * Math.PI) * 0.04);
          diningRefs.upperJaw.position.y = 0.26 + Math.sin(tB * Math.PI) * 0.07;
          diningRefs.lowerJaw.position.y = -0.38 - Math.sin(tB * Math.PI) * 0.08;
          diningRefs.tongue.position.y = -0.5 - Math.sin(tB * Math.PI) * 0.1;

          const hy = 0.41 + (1.42 - 0.41) * easeB + Math.sin(tB * Math.PI) * 1.12;
          const hz = -2.55 * easeB;
          heroPivot.position.set(0, hy, hz);
          heroPivot.rotation.set(-0.26 * Math.cos(tB * Math.PI), tB * Math.PI * 2, 0);
          const stretch = Math.sin(tB * Math.PI) * 0.16;
          const baseSc = 1.0 - 0.34 * easeB;
          heroPivot.scale.set(
            baseSc * (1 - stretch * 0.5),
            baseSc * (1 + stretch),
            baseSc * (1 - stretch * 0.5),
          );
          if (Math.random() < 0.45) {
            spawnParticles(0, hy - 0.1, hz, 1, 0xfbbf24, 1.4, 0.32);
          }

          _camTargetPos.set(0.25 * (1 - easeB), 1.52 + 0.14 * easeB, 3.25 - 3.35 * easeB);
          _camLookTarget.set(0, 1.35 + 0.1 * easeB, -2.35 - 1.6 * easeB);
        } else {
          // Act 3: Friendly bite/swallow motion & smooth FOV dive into crimson oral cavity
          const tC = (u - 0.74) / 0.26;
          const easeC = tC * tC * (3 - 2 * tC);
          diningRefs.mouthPortal.position.set(0, 1.55, -2.55);
          diningRefs.mouthPortal.scale.setScalar(1.0 + 0.12 * easeC);
          diningRefs.upperJaw.position.y = 0.26 - 0.28 * easeC;
          diningRefs.lowerJaw.position.y = -0.38 + 0.34 * easeC;
          diningRefs.tongue.position.y = -0.5 + 0.12 * easeC;

          const hy = 1.42 - 0.06 * easeC;
          const hz = -2.55 - 1.75 * easeC;
          heroPivot.position.set(0, hy, hz);
          heroPivot.rotation.set(-0.1 * (1 - easeC), Math.PI * 2 + easeC * 0.35, 0);
          heroPivot.scale.setScalar(0.66 * (1 - 0.45 * easeC));

          // Smooth cinematic FOV zoom as camera glides inside the mouth opening (stays in front of throatCap)
          camera.fov = 62 - 14 * easeC;
          camera.updateProjectionMatrix();
          _camTargetPos.set(0, 1.66 - 0.12 * easeC, -0.1 - 1.95 * easeC);
          _camLookTarget.set(0, 1.48, -3.95 - 1.85 * easeC);
          fogTargetHex = ZONES[0].fogColor;
        }
        playerLight.position.set(
          heroPivot.position.x,
          heroPivot.position.y + 1.8,
          heroPivot.position.z + 1.6,
        );
      } else if (isOutro) {
        outroTimer += dt;
        const u = Math.min(1, outroTimer / OUTRO_DURATION);
        const sBase = Math.max(0.68, p.stoolScale);
        // Slightly normalize visual dive fit inside porcelain rim while clearly preserving small vs giant size contrast
        const bowlFit = sBase * 0.85;

        if (u < 0.34) {
          // Act 1: Stool arcs joyfully into the open toilet bowl with splashdown
          const tA = u / 0.34;
          const easeA = tA * tA;
          const hy = 2.85 - (2.85 - (1.08 + 0.22 * bowlFit)) * easeA + Math.sin(tA * Math.PI) * 0.55;
          const hz = 0.48 * (1 - tA) + 0.05 * tA;
          heroPivot.visible = true;
          heroPivot.position.set(0, hy, hz);
          heroPivot.rotation.set(tA * Math.PI * 2, Math.sin(tA * Math.PI) * 0.35, 0);
          const impactSquash = tA > 0.88 ? Math.sin(((tA - 0.88) / 0.12) * Math.PI) * 0.24 : 0;
          heroPivot.scale.set(
            bowlFit * (1 + impactSquash),
            bowlFit * (1 - impactSquash * 0.8),
            bowlFit * (1 + impactSquash),
          );

          toiletRefs.flushHandlePivot.rotation.z = 0;
          toiletRefs.waterSurface.position.y = 1.04 + (tA > 0.85 ? Math.sin(tA * 18) * 0.045 : 0);
          toiletRefs.swirlGroup.position.y = toiletRefs.waterSurface.position.y + 0.02;
          toiletRefs.swirlGroup.rotation.y -= dt * 0.9;

          if (tA >= 0.86 && !outroSplashPlayed) {
            outroSplashPlayed = true;
            soundEngine.playSplash();
            spawnParticles(0, 1.15, 0.06, 28, 0x7dd3fc, 5.4, 1.05);
          }

          _camTargetPos.set(3.15 - 0.85 * tA, 3.85 - 0.15 * tA, 4.15 - 1.05 * tA);
          _camLookTarget.set(0, 1.4 - 0.18 * tA, 0.02);
        } else if (u < 0.86) {
          // Act 2: Flush lever pulls down -> swirling whirlpool sucks the stool straight into the toilet drain hole!
          const tB = (u - 0.34) / 0.52;
          if (!outroFlushPlayed) {
            outroFlushPlayed = true;
            soundEngine.playFlush();
          }

          // Flush lever depresses then rebounds
          const leverPhase = Math.min(1, tB / 0.28);
          toiletRefs.flushHandlePivot.rotation.z = Math.sin(leverPhase * Math.PI) * 0.62;

          // Water swirls rapidly & drops slightly into siphon
          const drainDrop = Math.max(0, tB - 0.42) * 0.42;
          toiletRefs.waterSurface.position.y =
            1.04 + Math.sin(tB * Math.PI) * 0.07 - drainDrop;
          toiletRefs.swirlGroup.position.y = toiletRefs.waterSurface.position.y + 0.02;
          toiletRefs.swirlGroup.rotation.y -= dt * (6.0 + tB * 12.0);
          toiletRefs.swirlGroup.scale.setScalar(1.0 - tB * 0.55);

          // Stool orbits inward into the drain hole and plunges down
          const orbitRad = (1 - tB) * 0.44 * Math.sin(Math.min(1, tB * 2.4) * Math.PI * 0.5);
          const orbitAng = tB * Math.PI * 5.2;
          const sx = Math.cos(orbitAng) * orbitRad;
          const sz = Math.sin(orbitAng) * orbitRad;
          const sinkEase = tB * tB;
          const sy = (1.08 + 0.22 * bowlFit) * (1 - sinkEase) + 0.34 * sinkEase;

          const drainShrink =
            tB < 0.52
              ? 1 - tB * 0.22
              : Math.max(0.02, 0.88 * (1 - (tB - 0.52) / 0.48));
          heroPivot.visible = drainShrink > 0.03;
          heroPivot.position.set(sx, sy, sz);
          heroPivot.rotation.set(0.32 * tB, orbitAng + tB * 7.5, Math.sin(tB * 10) * 0.15);
          heroPivot.scale.set(
            bowlFit * drainShrink * (1 - 0.14 * tB),
            bowlFit * drainShrink * (1 + 0.24 * tB),
            bowlFit * drainShrink * (1 - 0.14 * tB),
          );

          if (Math.random() < 0.55) {
            spawnParticles(sx, sy + 0.15, sz, 1, 0xe0f2fe, 2.2, 0.55);
          }

          _camTargetPos.set(2.3 - 0.8 * tB, 3.7 + 0.18 * tB, 3.1 - 0.95 * tB);
          _camLookTarget.set(0, 1.22 - 0.26 * tB, 0.0);
        } else {
          // Act 3: Stool vanishes completely into drain; clean water settles & sparkles
          const tC = (u - 0.86) / 0.14;
          heroPivot.visible = false;
          toiletRefs.flushHandlePivot.rotation.z = 0;
          toiletRefs.waterSurface.position.y = 0.86 + tC * 0.14;
          toiletRefs.swirlGroup.position.y = toiletRefs.waterSurface.position.y + 0.02;
          toiletRefs.swirlGroup.rotation.y -= dt * (6.0 * (1 - tC) + 1.2);
          toiletRefs.swirlGroup.scale.setScalar(0.45 + tC * 0.45);
          if (Math.random() < 0.45) {
            spawnParticles(
              (Math.random() - 0.5) * 0.6,
              1.15,
              (Math.random() - 0.5) * 0.6,
              1,
              0xfbbf24,
              2.6,
              0.48,
            );
          }
          _camTargetPos.set(1.5, 3.88, 2.15);
          _camLookTarget.set(0, 0.96, 0.0);
        }
        playerLight.position.set(1.8, 4.4, 2.2);
      } else if (isOutroDone) {
        heroPivot.visible = false;
        toiletRefs.swirlGroup.rotation.y -= dt * 1.4;
        playerLight.position.set(1.8, 4.4, 2.2);
      } else {
        heroPivot.visible = true;
        const isStoolNow = !isTitle && !isIntro && p.isStool;
        const targetFormScale = isStoolNow ? p.stoolScale : 1;
        visualStoolScale += (targetFormScale - visualStoolScale) * Math.min(1, dt * 10);

        const gaitBob = isTitle
          ? Math.sin(ambientTime * 2.2) * 0.024
          : Math.abs(Math.sin(p.distTraveled * 1.4)) * 0.14;
        const wHero = isTitle
          ? { x: p.x, y: 0.41, z: p.z, tx: 0, tz: -1, rx: 1, rz: 0, fy: 0 }
          : trackToWorld(p.x, p.z);
        heroPivot.position.set(
          wHero.x,
          (isTitle ? 0.41 : wHero.fy + 0.65 * visualStoolScale) + gaitBob,
          wHero.z,
        );
        if (isTitle) {
          heroPivot.rotation.x = 0;
          heroPivot.rotation.y = Math.sin(ambientTime * 1.15) * 0.42;
        } else {
          const slopeDrop = getTrackFloorY(p.z + 0.6) - getTrackFloorY(p.z - 0.6);
          const cosC = Math.cos(camYawOffset);
          const sinC = Math.sin(camYawOffset);
          const aimFwdHeroX = wHero.tx * cosC + wHero.rx * sinC;
          const aimFwdHeroZ = wHero.tz * cosC + wHero.rz * sinC;
          const trackFwdYaw = Math.atan2(wHero.tx, wHero.tz);
          const simYaw = trackFwdYaw + (p.rotY - Math.PI);
          const targetYaw = shiftLockEnabled
            ? Math.atan2(aimFwdHeroX, aimFwdHeroZ)
            : simYaw;
          const yawDiff = wrapAngle(targetYaw - heroVisualYaw);
          heroVisualYaw = wrapAngle(
            heroVisualYaw + yawDiff * (1 - Math.exp(-(shiftLockEnabled ? 28 : 18) * dt)),
          );
          const pitchSign = shiftLockEnabled ? Math.cos(camYawOffset) : -Math.cos(p.rotY);
          heroPivot.rotation.x = Math.atan2(slopeDrop * pitchSign, 1.2) * 0.55;
          heroPivot.rotation.y = heroVisualYaw;
        }
        if (isTitle) {
          const breath = Math.sin(ambientTime * 2.5) * 0.035;
          heroPivot.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);
        } else {
          heroPivot.scale.set(
            p.scaleX * visualStoolScale,
            p.scaleY * visualStoolScale,
            p.scaleZ * visualStoolScale,
          );
        }
        playerLight.position.set(
          wHero.x - wHero.tx * 1.5,
          heroPivot.position.y + 1.9,
          wHero.z - wHero.tz * 1.5,
        );
      }

      const showStoolMesh = !isTitle && !isIntro && (isOutro || p.isStool);
      if (stoolHeroGroup.visible !== showStoolMesh) {
        stoolHeroGroup.visible = showStoolMesh;
        (Object.keys(heroGroups) as FoodId[]).forEach((fid) => {
          heroGroups[fid].visible = !showStoolMesh && fid === sim.foodId;
        });
      }

      const activeHero = showStoolMesh ? stoolHeroGroup : heroGroups[sim.foodId];
      const shieldMesh = activeHero.getObjectByName('mucus_shield');
      if (shieldMesh) {
        shieldMesh.visible = !isIntro && !showToilet && p.shieldTimer > 0;
        if (shieldMesh.visible) {
          const pulse = 1 + Math.sin(ambientTime * 10) * 0.05;
          shieldMesh.scale.setScalar(pulse);
        }
      }
      // Hit flash feedback on hero emissive
      activeHero.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.name !== 'mucus_shield' && child.name !== 'contact_shadow') {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            if (!isIntro && !showToilet && p.hitFlashTimer > 0) {
              mat.emissive.setHex(0xffffff);
              mat.emissiveIntensity = 0.65;
            } else {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
          }
        }
      });

      // Sync Zone / Dining Room / Bathroom Fog Color & Cavern Visibility
      _fogColor.setHex(fogTargetHex);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_fogColor, Math.min(1, dt * (isIntro || isOutro ? 8 : 5)));
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(_fogColor, Math.min(1, dt * (isIntro || isOutro ? 8 : 5)));
        const targetFogDensity = isTitle
          ? 0.015
          : showToilet
            ? 0.008
            : sim.zoneId === 'stomach'
              ? 0.011
              : 0.021;
        scene.fog.density += (targetFogDensity - scene.fog.density) * Math.min(1, dt * 4);
      }
      playerLight.distance = showToilet ? 28 : sim.zoneId === 'stomach' ? 54 : 24;
      playerLight.intensity = showToilet ? 2.1 : sim.zoneId === 'stomach' ? 2.55 : 1.8;

      // Sync Pickups (hidden on Title/Intro/Toilet, mapped via trackToWorld)
      for (const pk of sim.pickups) {
        const mesh = pickupMeshes.get(pk.id);
        if (!mesh) continue;
        mesh.visible = !hideWorldEntities && !pk.collected;
        if (mesh.visible) {
          const wp = trackToWorld(pk.x, pk.z);
          mesh.rotation.y = ambientTime * 1.8;
          mesh.position.set(
            wp.x,
            wp.y + 0.75 + Math.sin(ambientTime * 3 + pk.z) * 0.14,
            wp.z,
          );
        }
      }

      // Sync Stimulus Nodes (hidden on Title/Intro/Toilet)
      for (const st of sim.stimuli) {
        const mesh = stimulusMeshes.get(st.id);
        if (!mesh) continue;
        mesh.visible = !hideWorldEntities;
        if (!mesh.visible) continue;
        const wp = trackToWorld(st.x, st.z);
        mesh.position.set(wp.x, wp.y + 0.9, wp.z);
        const bulb = mesh.getObjectByName('stim_bulb') as THREE.Mesh | undefined;
        const ring = mesh.getObjectByName('stim_ring') as THREE.Mesh | undefined;
        if (bulb) {
          bulb.rotation.y = ambientTime * 1.4;
          const mat = bulb.material as THREE.MeshStandardMaterial;
          if (st.triggered) {
            mat.color.setHex(0x4ade80);
            mat.emissive.setHex(0x16a34a);
            mat.emissiveIntensity = 0.35;
          } else {
            const s = 1 + Math.sin(ambientTime * 4) * 0.12;
            bulb.scale.setScalar(s);
          }
        }
        if (ring) {
          ring.visible = !st.triggered;
          const rs = 1 + Math.sin(ambientTime * 3.5) * 0.12;
          ring.scale.setScalar(rs);
        }
      }

      // Sync Digestive NPCs (Mouth Germ NPC + Esophagus Tunnel NPC)
      const wPlayer = trackToWorld(p.x, p.z);
      for (const npc of sim.npcs) {
        const mesh = npcMeshes.get(npc.id);
        if (!mesh) continue;
        mesh.visible = !hideWorldEntities;
        if (!mesh.visible) continue;
        const wn = trackToWorld(npc.x, npc.z);
        mesh.position.set(
          wn.x,
          wn.y + 0.85 + Math.sin(ambientTime * 2.6 + (npc.zone === 'esophagus' ? 1.4 : 0)) * 0.1,
          wn.z,
        );
        const npcBody = mesh.getObjectByName('npc_body');
        if (npcBody) {
          npcBody.rotation.y = Math.atan2(wPlayer.x - wn.x, wPlayer.z - wn.z);
          npcBody.rotation.z = Math.sin(ambientTime * 3.1) * 0.08;
        }
        const npcBeacon = mesh.getObjectByName('npc_beacon');
        if (npcBeacon) {
          npcBeacon.rotation.y = ambientTime * 2.4;
          npcBeacon.position.y = 1.28 + Math.sin(ambientTime * 3.8) * 0.1;
        }
        const npcRing = mesh.getObjectByName('npc_ring') as THREE.Mesh | undefined;
        if (npcRing) {
          const rs = 1 + Math.sin(ambientTime * 3.5) * 0.1;
          npcRing.scale.setScalar(rs);
          const mat = npcRing.material as THREE.MeshBasicMaterial;
          if (npc.interacted) {
            mat.color.setHex(0x4ade80);
          } else {
            mat.color.setHex(
              npc.diseaseId === 'wasir'
                ? 0xfb7185
                : npc.diseaseId === 'maag'
                  ? 0xc084fc
                  : npc.diseaseId === 'gerd'
                    ? 0xfb923c
                    : npc.diseaseId === 'parotitis'
                      ? 0x38bdf8
                      : 0xa3e635,
            );
          }
        }
      }

      // Sync Hazards & Telegraphs (hidden on Title/Intro/Toilet, mapped via trackToWorld)
      for (const hz of sim.hazards) {
        const mesh = hazardMeshes.get(hz.id);
        if (!mesh) continue;
        mesh.visible = !hideWorldEntities && hz.alive;
        if (!mesh.visible) continue;
        const wp = trackToWorld(hz.x, hz.z);
        mesh.position.set(wp.x, wp.y, wp.z);

        if (hz.state === 'ko') {
          const koT = Math.max(0.01, hz.timer / 0.35);
          mesh.scale.set(1.2, koT, 1.2);
          mesh.rotation.z += dt * 8;
          continue;
        }
        mesh.scale.set(1, 1, 1);

        if (hz.kind === 'tooth_crusher') {
          const jaw = mesh.getObjectByName('crusher_jaw');
          const ring = mesh.getObjectByName('telegraph_ring') as THREE.Mesh | undefined;
          if (jaw) {
            if (hz.state === 'telegraph') {
              jaw.position.y = 3.2 + Math.sin(ambientTime * 45) * 0.12;
            } else if (hz.state === 'active') {
              jaw.position.y = 1.05;
            } else {
              jaw.position.y = 3.3;
            }
          }
          if (ring) {
            const mat = ring.material as THREE.MeshBasicMaterial;
            mat.opacity = hz.state === 'telegraph' || hz.state === 'active' ? 0.85 : 0.25;
            mat.color.setHex(hz.state === 'active' ? 0xef4444 : 0xfbbf24);
          }
        } else if (hz.kind === 'acid_geyser' || hz.kind === 'canker_sore') {
          const jet = mesh.getObjectByName('acid_jet');
          const ring = mesh.getObjectByName('telegraph_ring') as THREE.Mesh | undefined;
          if (jet) {
            if (hz.state === 'active') {
              jet.scale.set(1.0, 1.0, 1.0);
            } else if (hz.state === 'telegraph') {
              jet.scale.set(0.55, 0.25, 0.55);
            } else {
              jet.scale.set(0.15, 0.05, 0.15);
            }
          }
          if (ring) {
            const mat = ring.material as THREE.MeshBasicMaterial;
            mat.opacity = hz.state === 'telegraph' ? 0.9 : hz.state === 'active' ? 0.85 : 0.28;
            mat.color.setHex(hz.state === 'telegraph' ? 0xfacc15 : 0xa3e635);
          }
        } else if (hz.kind === 'h_pylori') {
          mesh.rotation.y += dt * 3.5;
        } else if (hz.kind === 'e_coli') {
          mesh.rotation.y = Math.atan2(wPlayer.x - wp.x, wPlayer.z - wp.z);
          const ring = mesh.getObjectByName('telegraph_ring') as THREE.Mesh | undefined;
          if (ring) {
            const mat = ring.material as THREE.MeshBasicMaterial;
            mat.opacity = hz.state === 'telegraph' ? 0.9 : 0.25;
            mat.color.setHex(hz.state === 'telegraph' ? 0xef4444 : 0xfacc15);
          }
        }
      }

      // Sync Enemy Projectiles (mapped via trackToWorld)
      for (const pr of sim.projectiles) {
        let pm = projectileMeshes.get(pr.id);
        if (!pm && pr.active) {
          pm = new THREE.Mesh(projGeo, projMat);
          scene.add(pm);
          projectileMeshes.set(pr.id, pm);
        }
        if (pm) {
          pm.visible = !hideWorldEntities && pr.active;
          if (pm.visible) {
            const wp = trackToWorld(pr.x, pr.z);
            pm.position.set(wp.x, wp.y + 0.65, wp.z);
          }
        }
      }

      // Animate Environment Landmarks (Peristalsis rings, Uvula, Villi, Victory Portal)
      worldRefs.peristalsisRings.forEach((ring, idx) => {
        const wave = 1 + Math.sin(ambientTime * 3.2 - idx * 0.7) * 0.11;
        ring.scale.set(wave, wave, 1);
      });
      if (worldRefs.uvula) {
        worldRefs.uvula.rotation.z = Math.sin(ambientTime * 2.2) * 0.14;
      }
      if (worldRefs.victoryPortal) {
        worldRefs.victoryPortal.rotation.z = ambientTime * 0.8;
      }
      if (worldRefs.villiMesh && sim.zoneId === 'small_intestine') {
        const count = worldRefs.villiBaseMatrices.length;
        for (let i = 0; i < count; i++) {
          _villiOffset.makeRotationZ(Math.sin(ambientTime * 2.6 + i * 0.35) * 0.14);
          _villiOffset.premultiply(worldRefs.villiBaseMatrices[i]);
          worldRefs.villiMesh.setMatrixAt(i, _villiOffset);
        }
        worldRefs.villiMesh.instanceMatrix.needsUpdate = true;
      }

      // Animate Churning Partially Digested Food Chunks & Effervescent Bubbles in Giant Stomach
      if (!showDining && sim.player.z <= -76 && sim.player.z >= -182) {
        for (const layer of worldRefs.stomachChunkLayers) {
          const slots = layer.slots;
          for (let i = 0; i < slots.length; i++) {
            const s = slots[i];
            if (layer.isBubble) {
              const riseCycle = ((ambientTime * 0.55 + s.phase) % 2.4) / 2.4;
              const yPos = s.baseY + riseCycle * 2.1;
              const popScale = Math.sin(riseCycle * Math.PI);
              _chunkDummy.position.set(
                s.baseX + Math.sin(ambientTime * 2.2 + s.phase) * s.swirlRadius,
                yPos,
                s.baseZ + Math.cos(ambientTime * 1.9 + s.phase) * s.swirlRadius,
              );
              _chunkDummy.rotation.set(0, 0, 0);
              _chunkDummy.scale.set(
                s.scaleX * popScale,
                s.scaleY * popScale,
                s.scaleZ * popScale,
              );
            } else {
              _chunkDummy.position.set(
                s.baseX + Math.sin(ambientTime * 0.85 + s.phase) * s.swirlRadius,
                s.baseY + Math.sin(ambientTime * 1.7 + s.phase) * s.bobAmp,
                s.baseZ + Math.cos(ambientTime * 0.72 + s.phase) * s.swirlRadius,
              );
              _chunkDummy.rotation.set(
                s.rotX + Math.sin(ambientTime * 1.1 + s.phase) * 0.2,
                s.rotY + ambientTime * s.spinSpeed,
                s.rotZ + Math.cos(ambientTime * 0.95 + s.phase) * 0.18,
              );
              _chunkDummy.scale.set(s.scaleX, s.scaleY, s.scaleZ);
            }
            _chunkDummy.updateMatrix();
            layer.mesh.setMatrixAt(i, _chunkDummy.matrix);
          }
          layer.mesh.instanceMatrix.needsUpdate = true;
        }

        for (const hc of worldRefs.stomachHeroChunks) {
          hc.group.position.set(
            hc.baseX + Math.sin(ambientTime * 0.65 + hc.phase) * 0.42,
            hc.baseY + Math.sin(ambientTime * 1.5 + hc.phase) * 0.18,
            hc.baseZ + Math.cos(ambientTime * 0.58 + hc.phase) * 0.38,
          );
          hc.group.rotation.y += dt * hc.spinSpeed;
          hc.group.rotation.x = Math.sin(ambientTime * 1.2 + hc.phase) * 0.14;
          hc.group.rotation.z = Math.cos(ambientTime * 1.0 + hc.phase) * 0.12;
        }
      }

      // Update Pooled Particles (Zero GC)
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const sl = particles[i];
        if (!sl.active) {
          _dummy.position.set(0, -100, 0);
          _dummy.scale.setScalar(0.001);
          _dummy.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummy.matrix);
          continue;
        }
        sl.life -= dt;
        if (sl.life <= 0) {
          sl.active = false;
          continue;
        }
        sl.vy -= 9.5 * dt;
        sl.x += sl.vx * dt;
        sl.y += sl.vy * dt;
        sl.z += sl.vz * dt;
        const frac = sl.life / sl.maxLife;
        _dummy.position.set(sl.x, sl.y, sl.z);
        _dummy.scale.setScalar(sl.size * frac);
        _dummy.updateMatrix();
        particleInstanced.setMatrixAt(i, _dummy.matrix);
        _partColor.setHex(sl.color);
        particleInstanced.setColorAt(i, _partColor);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (particleInstanced.instanceColor) {
        particleInstanced.instanceColor.needsUpdate = true;
      }

      // Update Camera Orbit from Q/R Keys or Held HUD Camera Buttons
      const keyOrbitDir = (camKeyRight ? 1 : 0) - (camKeyLeft ? 1 : 0) + camHudHoldDir;
      if (keyOrbitDir !== 0 && !isIntro && !isOutro) {
        camYawOffset = wrapAngle(camYawOffset + Math.sign(keyOrbitDir) * 2.1 * dt);
      }

      // Auto-release Shift Lock if gameplay ends (Victory / Defeat / Outro)
      if (prevPhase !== sim.phase && (sim.phase === 'gameover' || sim.phase === 'outro')) {
        applyShiftLock(false);
      }

      // Camera Rig: Title Showcase / Intro / Toilet Outro / Over-Shoulder Shift Lock & Spiral-Aware Wall-Clamped Orbit Camera
      const camDamp = 1 - Math.exp(-(isIntro || isOutro ? 10 : shiftLockEnabled ? 18 : 12.5) * dt);
      if (isTitle) {
        const titleYaw = Math.max(-1.05, Math.min(1.05, camYawOffset));
        const r = 4.15 * camDistScale;
        const baseAz = -0.34 + titleYaw + Math.sin(ambientTime * 0.45) * 0.06;
        _camTargetPos.set(
          p.x + Math.sin(baseAz) * r,
          Math.max(0.75, 1.65 - camPitchOffset * 1.4),
          p.z + Math.cos(baseAz) * r,
        );
        _camLookTarget.set(p.x - 1.15, 0.35, p.z - 0.35);
      } else if (isOutroDone) {
        _camTargetPos.set(1.3, 3.7, 1.88);
        _camLookTarget.set(0, 0.96, 0.0);
      } else if (!isIntro && !isOutro) {
        const shakeAmt = sim.trauma * sim.trauma * 0.38;
        const shakeX = (Math.random() - 0.5) * shakeAmt;
        const shakeY = (Math.random() - 0.5) * shakeAmt;

        const theta = camYawOffset;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const aimFwdX = wPlayer.tx * cosT + wPlayer.rx * sinT;
        const aimFwdZ = wPlayer.tz * cosT + wPlayer.rz * sinT;
        const scrRightX = -aimFwdZ;
        const scrRightZ = aimFwdX;

        const targetShoulder = shiftLockEnabled ? 0.92 : 0;
        shoulderOffset += (targetShoulder - shoulderOffset) * (1 - Math.exp(-14 * dt));

        const pivotX = wPlayer.x + scrRightX * shoulderOffset;
        const pivotZ = wPlayer.z + scrRightZ * shoulderOffset;

        const baseDist = shiftLockEnabled ? 5.0 : 5.75;
        const horzDist =
          baseDist * camDistScale * Math.max(0.58, Math.cos(camPitchOffset * 0.55));
        const rawCamX = pivotX - aimFwdX * horzDist + shakeX;
        const rawCamZ = pivotZ - aimFwdZ * horzDist;

        const aimDotTrack = aimFwdX * wPlayer.tx + aimFwdZ * wPlayer.tz;
        const camTrackU = Math.max(
          TRACK_END_Z - 4,
          Math.min(5.5, p.z + aimDotTrack * horzDist),
        );
        const wSeg = trackToWorld(0, camTrackU);
        const segHalfW = getTrackHalfWidth(camTrackU);

        const rawLat = (rawCamX - wSeg.cx) * wSeg.rx + (rawCamZ - wSeg.cz) * wSeg.rz;
        const maxLat = Math.max(0.85, segHalfW - 0.85);
        const clampedLat = Math.max(-maxLat, Math.min(maxLat, rawLat));
        const latCorr = clampedLat - rawLat;

        const camMaxY = wSeg.fy + segHalfW * 0.72 + 0.8;
        const camMinY = Math.max(wPlayer.y + 0.65, wSeg.fy + 0.72);
        const baseHeight = shiftLockEnabled ? 2.35 : 2.75;
        const rawCamY =
          wPlayer.y + baseHeight * camDistScale - camPitchOffset * 2.15 + shakeY;
        const camY = Math.max(camMinY, Math.min(camMaxY, rawCamY));

        _camTargetPos.set(
          rawCamX + latCorr * wSeg.rx,
          camY,
          rawCamZ + latCorr * wSeg.rz,
        );

        const slopeDropBias =
          (getTrackFloorY(p.z - 7.5) - wPlayer.y) * 0.34 * Math.max(0, aimDotTrack);
        const lookDist = 8.5;
        const lookY =
          wPlayer.y +
          (shiftLockEnabled ? 1.15 : 0.95) +
          camPitchOffset * 4.2 +
          slopeDropBias;
        _camLookTarget.set(
          pivotX + aimFwdX * lookDist,
          lookY,
          pivotZ + aimFwdZ * lookDist,
        );
      }
      camera.position.lerp(_camTargetPos, camDamp);
      _curLookAt.lerp(_camLookTarget, camDamp);
      camera.lookAt(_curLookAt);

      renderer.render(scene, camera);

      // Complete Intro or Outro Cutscene -> Transition Cleanly
      if (isIntro && introTimer >= INTRO_DURATION) {
        finishIntroToPlaying();
      } else if (isOutro && outroTimer >= OUTRO_DURATION) {
        finishOutroToVictory();
      } else {
        // Throttled HUD & State Sync (<= 10Hz or immediate on phase change)
        hudAccum += dt;
        if (hudAccum >= 0.1 || prevPhase !== sim.phase || sim.events.length > 0) {
          hudAccum = 0;
          syncBodyAttributes();
          hudCallbackRef.current(buildHudSnapshot(sim));
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlurOrHide);
      document.removeEventListener('visibilitychange', onBlurOrHide);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      textures.dispose();
      projGeo.dispose();
      projMat.dispose();
      partGeo.dispose();
      partMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="game-canvas-container"
      className="fixed inset-0 w-full h-full overflow-hidden"
    />
  );
};
