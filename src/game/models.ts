import * as THREE from 'three';
import {
  TRACK_END_Z,
  TRACK_START_Z,
  ZONES,
  getTrackCenterX,
  getTrackFloorY,
  getTrackHalfWidth,
  getZoneForZ,
  trackToWorld,
} from './data';
import { ProceduralTextureSet } from './textures';
import { FoodId, HazardEntity, MouthNpc, PickupEntity, StimulusNode } from './types';

function addCartoonEyes(group: THREE.Group, zOffset: number, yOffset: number, spread = 0.22): void {
  const scleraGeo = new THREE.SphereGeometry(0.11, 14, 12);
  const pupilGeo = new THREE.SphereGeometry(0.065, 12, 10);
  const glintGeo = new THREE.SphereGeometry(0.025, 8, 8);

  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.0,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.1,
    metalness: 0.1,
  });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (const dir of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(dir * spread, yOffset, zOffset);

    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.075);
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.set(0.03, 0.035, 0.125);

    eye.add(sclera, pupil, glint);
    group.add(eye);
  }
}

export function buildFoodHeroGroup(
  foodId: FoodId,
  textures: ProceduralTextureSet,
): THREE.Group {
  const root = new THREE.Group();
  root.name = `food_${foodId}`;

  if (foodId === 'burger') {
    const bunMat = new THREE.MeshStandardMaterial({
      map: textures.bunMap,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.02,
    });
    const pattyMat = new THREE.MeshStandardMaterial({
      map: textures.pattyMap,
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.04,
    });
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.25,
      metalness: 0.05,
    });
    const lettuceMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.48,
      metalness: 0.0,
    });
    const tomatoMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.2,
      metalness: 0.02,
    });
    const sesameMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.5,
    });

    // 1. Bottom bun (Lathe)
    const botPts = [
      new THREE.Vector2(0.0, -0.52),
      new THREE.Vector2(0.46, -0.52),
      new THREE.Vector2(0.56, -0.44),
      new THREE.Vector2(0.55, -0.3),
      new THREE.Vector2(0.0, -0.3),
    ];
    const botBun = new THREE.Mesh(new THREE.LatheGeometry(botPts, 24), bunMat);
    botBun.castShadow = true;
    root.add(botBun);

    // 2. Beef Patty
    const patty = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.2, 24),
      pattyMat,
    );
    patty.position.y = -0.18;
    patty.castShadow = true;
    root.add(patty);

    // 3. Melted Cheese (Extrude with bevel)
    const cShape = new THREE.Shape();
    cShape.moveTo(-0.56, -0.56);
    cShape.lineTo(0.56, -0.52);
    cShape.lineTo(0.54, 0.56);
    cShape.lineTo(-0.54, 0.54);
    cShape.closePath();
    const cheese = new THREE.Mesh(
      new THREE.ExtrudeGeometry(cShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
      }),
      cheeseMat,
    );
    cheese.rotation.x = Math.PI / 2;
    cheese.rotation.z = 0.25;
    cheese.position.y = -0.02;
    cheese.castShadow = true;
    root.add(cheese);

    // 4. Lettuce ruffle
    const lettuce = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.11, 10, 24),
      lettuceMat,
    );
    lettuce.rotation.x = Math.PI / 2;
    lettuce.scale.set(1.06, 1.06, 0.6);
    lettuce.position.y = 0.05;
    root.add(lettuce);

    // 5. Tomato slice
    const tomato = new THREE.Mesh(
      new THREE.CylinderGeometry(0.49, 0.49, 0.07, 20),
      tomatoMat,
    );
    tomato.position.y = 0.11;
    root.add(tomato);

    // 6. Top bun dome (Lathe)
    const topPts = [
      new THREE.Vector2(0.0, 0.14),
      new THREE.Vector2(0.56, 0.14),
      new THREE.Vector2(0.57, 0.26),
      new THREE.Vector2(0.48, 0.44),
      new THREE.Vector2(0.28, 0.55),
      new THREE.Vector2(0.0, 0.58),
    ];
    const topBun = new THREE.Mesh(new THREE.LatheGeometry(topPts, 24), bunMat);
    topBun.castShadow = true;
    root.add(topBun);

    // 7. Sesame seeds
    const seedGeo = new THREE.SphereGeometry(0.035, 6, 6);
    seedGeo.scale(1.4, 0.6, 0.8);
    const seedCoords = [
      [0.2, 0.51, 0.18],
      [-0.22, 0.5, 0.22],
      [0.05, 0.56, -0.15],
      [-0.3, 0.44, -0.12],
      [0.32, 0.43, -0.14],
      [0.0, 0.47, 0.35],
    ];
    for (const [sx, sy, sz] of seedCoords) {
      const seed = new THREE.Mesh(seedGeo, sesameMat);
      seed.position.set(sx, sy, sz);
      root.add(seed);
    }

    addCartoonEyes(root, 0.54, 0.28, 0.2);
  } else if (foodId === 'apple') {
    const skinMat = new THREE.MeshPhysicalMaterial({
      map: textures.appleMap,
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
    });
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.85,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.45,
    });

    // 1. Sculpted Apple Lathe profile
    const applePts = [
      new THREE.Vector2(0.0, -0.35),
      new THREE.Vector2(0.18, -0.46),
      new THREE.Vector2(0.42, -0.4),
      new THREE.Vector2(0.56, -0.12),
      new THREE.Vector2(0.58, 0.16),
      new THREE.Vector2(0.45, 0.42),
      new THREE.Vector2(0.22, 0.46),
      new THREE.Vector2(0.0, 0.3),
    ];
    const body = new THREE.Mesh(new THREE.LatheGeometry(applePts, 28), skinMat);
    body.castShadow = true;
    root.add(body);

    // 2. Curved Stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.28, 0),
      new THREE.Vector3(0.04, 0.48, 0.02),
      new THREE.Vector3(0.12, 0.62, 0.04),
    ]);
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(stemCurve, 10, 0.045, 8, false),
      stemMat,
    );
    stem.castShadow = true;
    root.add(stem);

    // 3. Beveled Leaf
    const lShape = new THREE.Shape();
    lShape.moveTo(0, 0);
    lShape.quadraticCurveTo(0.22, 0.18, 0.44, 0.04);
    lShape.quadraticCurveTo(0.22, -0.14, 0, 0);
    const leaf = new THREE.Mesh(
      new THREE.ExtrudeGeometry(lShape, {
        depth: 0.025,
        bevelEnabled: true,
        bevelSize: 0.01,
        bevelThickness: 0.01,
      }),
      leafMat,
    );
    leaf.position.set(0.05, 0.48, 0.02);
    leaf.rotation.set(0.3, 0.2, 0.25);
    root.add(leaf);

    // 4. Bottom calyx star accent
    const calyx = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.08, 5),
      stemMat,
    );
    calyx.position.y = -0.37;
    root.add(calyx);

    addCartoonEyes(root, 0.54, 0.08, 0.2);
  } else if (foodId === 'chicken') {
    const meatMat = new THREE.MeshStandardMaterial({
      map: textures.chickenMap,
      color: 0xffffff,
      roughness: 0.58,
      metalness: 0.04,
    });
    const glazeMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.2,
      clearcoat: 0.7,
    });
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.35,
    });
    const herbMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.7,
    });

    // 1. Drumstick meat body (Lathe)
    const drumPts = [
      new THREE.Vector2(0.0, -0.45),
      new THREE.Vector2(0.22, -0.45),
      new THREE.Vector2(0.46, -0.25),
      new THREE.Vector2(0.52, 0.06),
      new THREE.Vector2(0.36, 0.36),
      new THREE.Vector2(0.16, 0.48),
      new THREE.Vector2(0.0, 0.5),
    ];
    const drum = new THREE.Mesh(new THREE.LatheGeometry(drumPts, 24), meatMat);
    drum.rotation.z = 0.25;
    drum.castShadow = true;
    root.add(drum);

    // 2. Bone handle shaft
    const bone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.12, 0.52, 12),
      boneMat,
    );
    bone.position.set(-0.18, 0.56, 0);
    bone.rotation.z = 0.25;
    root.add(bone);

    // 3-4. Bone double knuckles
    const knobGeo = new THREE.SphereGeometry(0.14, 12, 10);
    const k1 = new THREE.Mesh(knobGeo, boneMat);
    k1.position.set(-0.31, 0.78, 0.08);
    const k2 = new THREE.Mesh(knobGeo, boneMat);
    k2.position.set(-0.22, 0.82, -0.08);
    root.add(k1, k2);

    // 5. Glaze cap ring
    const glaze = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.08, 8, 18),
      glazeMat,
    );
    glaze.rotation.x = Math.PI / 2;
    glaze.position.set(0.02, -0.1, 0);
    root.add(glaze);

    // 6. Herb garnish flecks
    const herbGeo = new THREE.DodecahedronGeometry(0.06, 0);
    for (const [hx, hy, hz] of [
      [0.3, 0.15, -0.35],
      [-0.25, -0.12, -0.38],
      [0.12, 0.28, 0.3],
    ]) {
      const h = new THREE.Mesh(herbGeo, herbMat);
      h.position.set(hx, hy, hz);
      root.add(h);
    }

    addCartoonEyes(root, 0.46, 0.02, 0.19);
  } else {
    // Chili Pepper
    const chiliMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      roughness: 0.18,
      metalness: 0.03,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });
    const calyxMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.65,
    });

    // 1. Sculpted tapered chili pod (Lathe + gentle bend via parts)
    const podPts = [
      new THREE.Vector2(0.0, -0.58),
      new THREE.Vector2(0.09, -0.48),
      new THREE.Vector2(0.24, -0.25),
      new THREE.Vector2(0.37, 0.05),
      new THREE.Vector2(0.4, 0.32),
      new THREE.Vector2(0.26, 0.48),
      new THREE.Vector2(0.0, 0.5),
    ];
    const pod = new THREE.Mesh(new THREE.LatheGeometry(podPts, 24), chiliMat);
    pod.rotation.x = -0.22;
    pod.castShadow = true;
    root.add(pod);

    // 2. Calyx crown
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 0.12, 7),
      calyxMat,
    );
    crown.position.set(0, 0.46, -0.1);
    crown.rotation.x = -0.22;
    root.add(crown);

    // 3. Curved green stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.48, -0.1),
      new THREE.Vector3(0.06, 0.66, -0.05),
      new THREE.Vector3(0.18, 0.74, 0.04),
    ]);
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(stemCurve, 10, 0.055, 8, false),
      calyxMat,
    );
    root.add(stem);

    // 4. Spicy aura ring
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.55,
      }),
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = -0.1;
    root.add(aura);

    addCartoonEyes(root, 0.37, 0.15, 0.16);
  }

  // Contact Shadow disc anchored underneath hero
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.78, 24),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -0.62;
  shadowDisc.name = 'contact_shadow';
  root.add(shadowDisc);

  // Protective Mucus Shield bubble (hidden until E is active)
  const shieldBubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 20, 16),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  shieldBubble.visible = false;
  shieldBubble.name = 'mucus_shield';
  root.add(shieldBubble);

  return root;
}

export function buildStoolHeroGroup(textures: ProceduralTextureSet): THREE.Group {
  const root = new THREE.Group();
  root.name = 'hero_stool';

  const stoolMat = new THREE.MeshStandardMaterial({
    map: textures.pattyMap,
    color: 0x9c5b2e,
    roughness: 0.56,
    metalness: 0.03,
  });
  const stoolDarkMat = new THREE.MeshStandardMaterial({
    color: 0x6b3b1b,
    roughness: 0.68,
    metalness: 0.04,
  });
  const fiberFleckMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.72,
  });

  // Inner solid core so coils never show hollow gaps
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), stoolDarkMat);
  core.scale.set(1.0, 0.62, 1.0);
  core.position.y = -0.34;
  root.add(core);

  // 1. Bottom base coil
  const botCoil = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.21, 14, 28), stoolMat);
  botCoil.rotation.x = Math.PI / 2;
  botCoil.position.y = -0.38;
  botCoil.castShadow = true;
  root.add(botCoil);

  // 2. Middle coil
  const midCoil = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.175, 14, 26), stoolMat);
  midCoil.rotation.x = Math.PI / 2;
  midCoil.position.y = -0.09;
  midCoil.castShadow = true;
  root.add(midCoil);

  // 3. Upper coil
  const topCoil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.135, 12, 22), stoolMat);
  topCoil.rotation.x = Math.PI / 2;
  topCoil.position.y = 0.17;
  topCoil.castShadow = true;
  root.add(topCoil);

  // 4. Sculpted curled peak tip
  const peakCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(0.02, 0.42, -0.03),
    new THREE.Vector3(0.09, 0.54, -0.11),
  ]);
  const peak = new THREE.Mesh(
    new THREE.TubeGeometry(peakCurve, 10, 0.085, 10, false),
    stoolMat,
  );
  const peakTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), stoolMat);
  peakTip.position.set(0.09, 0.54, -0.11);
  root.add(peak, peakTip);

  // Dietary fiber fleck details
  const fleckGeo = new THREE.DodecahedronGeometry(0.045, 0);
  for (const [fx, fy, fz] of [
    [-0.36, -0.28, 0.28],
    [0.34, -0.1, 0.24],
    [-0.24, 0.14, -0.2],
  ]) {
    const fleck = new THREE.Mesh(fleckGeo, fiberFleckMat);
    fleck.position.set(fx, fy, fz);
    root.add(fleck);
  }

  // Friendly Cartoon Eyes + Cute Smile on middle coil facing +Z
  addCartoonEyes(root, 0.44, -0.02, 0.17);
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.02, 6, 14, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x291509 }),
  );
  smile.position.set(0, -0.15, 0.46);
  smile.rotation.z = Math.PI;
  root.add(smile);

  // Contact Shadow disc anchored underneath
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.78, 24),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = -0.62;
  shadowDisc.name = 'contact_shadow';
  root.add(shadowDisc);

  // Protective Mucus Shield bubble
  const shieldBubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 20, 16),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  shieldBubble.visible = false;
  shieldBubble.name = 'mucus_shield';
  root.add(shieldBubble);

  return root;
}

export interface StomachChunkSlot {
  baseX: number;
  baseY: number;
  baseZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  phase: number;
  bobAmp: number;
  spinSpeed: number;
  swirlRadius: number;
}

export interface StomachChunkLayer {
  mesh: THREE.InstancedMesh;
  slots: StomachChunkSlot[];
  isBubble?: boolean;
}

export interface StomachHeroChunkRef {
  group: THREE.Group;
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  spinSpeed: number;
}

export interface WorldRefs {
  worldGroup: THREE.Group;
  peristalsisRings: THREE.Mesh[];
  teethUpper: THREE.Mesh[];
  teethLower: THREE.Mesh[];
  uvula: THREE.Mesh | null;
  villiMesh: THREE.InstancedMesh | null;
  villiBaseMatrices: THREE.Matrix4[];
  victoryPortal: THREE.Group | null;
  stomachChunkLayers: StomachChunkLayer[];
  stomachHeroChunks: StomachHeroChunkRef[];
}

export function buildDigestiveWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): WorldRefs {
  const worldGroup = new THREE.Group();
  worldGroup.name = 'digestive_world';
  scene.add(worldGroup);

  // 1. Continuous Organic Tunnel + Floor Geometry following 3D trackToWorld
  const zStart = TRACK_START_Z + 8;
  const zEnd = TRACK_END_Z - 8;
  const slices = 320;
  const radialSegs = 22;

  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tempColor = new THREE.Color();

  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const uParam = zStart + (zEnd - zStart) * t;
    const wp = trackToWorld(0, uParam);
    const hw = getTrackHalfWidth(uParam);
    const zone = getZoneForZ(uParam);
    tempColor.setHex(zone.wallColor);

    for (let j = 0; j <= radialSegs; j++) {
      // Map j cleanly around a smooth convex oval oriented perpendicular to track tangent
      const u = j / radialSegs;
      const angle = u * Math.PI * 2;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      const lat = cosA * (hw + 0.65);
      const x = wp.cx + lat * wp.rx;
      const z = wp.cz + lat * wp.rz;
      const headroomBonus =
        zone.id === 'esophagus' ? 1.15 : zone.id === 'stomach' ? 5.2 : 0;
      const upperH = hw * 0.76 + 1.2 + headroomBonus;
      const yOffset = sinA >= 0 ? sinA * upperH : sinA * 0.48;
      const ripple = Math.sin(uParam * 0.65 + j * 0.9) * (zone.id === 'stomach' ? 0.24 : 0.1);
      const y = wp.fy + yOffset + ripple;

      positions.push(x, y, z);
      // Slightly darker near floor crevices, brighter near upper arch
      const shade = sinA < -0.2 ? 0.88 : 1.05;
      colors.push(
        Math.min(1, tempColor.r * shade),
        Math.min(1, tempColor.g * shade),
        Math.min(1, tempColor.b * shade),
      );
      uvs.push(u * 2, t * 32);
    }
  }

  const rowStride = radialSegs + 1;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * rowStride + j;
      const b = (i + 1) * rowStride + j;
      const c = (i + 1) * rowStride + (j + 1);
      const d = i * rowStride + (j + 1);
      // Inward-facing normals so inside of digestive tract is lit cleanly
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const tunnelGeo = new THREE.BufferGeometry();
  tunnelGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  tunnelGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  tunnelGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  tunnelGeo.setIndex(indices);
  tunnelGeo.computeVertexNormals();

  const tunnelMat = new THREE.MeshStandardMaterial({
    map: textures.mucosaMap,
    bumpMap: textures.mucosaBump,
    bumpScale: 0.16,
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
  tunnelMesh.receiveShadow = !isSoftwareGl;
  worldGroup.add(tunnelMesh);

  // 2. Wide Ordinary Human Mouth Cavity: Rounded Oval Tongue + Wide Horseshoe Dental Arch + Soft Palate Arch & Uvula
  const tongueShape = new THREE.Shape();
  // Drawn in XY where X=left/right and Y maps to -Z after rotation.x = -Math.PI/2
  tongueShape.moveTo(0, -1.8); // Rounded anterior tip at z = +1.8
  tongueShape.bezierCurveTo(3.6, -1.8, 4.6, 1.8, 4.2, 5.8);
  tongueShape.bezierCurveTo(3.8, 9.6, 2.4, 11.4, 0, 11.6); // Base curving down near throat (z = -11.6)
  tongueShape.bezierCurveTo(-2.4, 11.4, -3.8, 9.6, -4.2, 5.8);
  tongueShape.bezierCurveTo(-4.6, 1.8, -3.6, -1.8, 0, -1.8);

  const tongueGeo = new THREE.ExtrudeGeometry(tongueShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.18,
    bevelSegments: 4,
    curveSegments: 24,
  });
  tongueGeo.rotateX(-Math.PI / 2);
  const tongueMat = new THREE.MeshStandardMaterial({
    map: textures.tongueMap,
    bumpMap: textures.mucosaBump,
    bumpScale: 0.08,
    color: 0xffffff,
    roughness: 0.48,
    metalness: 0.02,
  });
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  tongue.position.set(0, -0.32, 0);
  tongue.receiveShadow = !isSoftwareGl;
  worldGroup.add(tongue);

  // Curved Horseshoe Gums & Natural Teeth Arch (Incisors -> Canines -> Premolars -> Molars)
  const enamelMat = new THREE.MeshPhysicalMaterial({
    color: 0xfefce8,
    roughness: 0.15,
    metalness: 0.02,
    clearcoat: 0.75,
  });
  const gumMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.44,
  });

  const teethUpper: THREE.Mesh[] = [];
  const teethLower: THREE.Mesh[] = [];
  const molarPts = [
    new THREE.Vector2(0.0, -0.46),
    new THREE.Vector2(0.5, -0.46),
    new THREE.Vector2(0.56, 0.08),
    new THREE.Vector2(0.48, 0.42),
    new THREE.Vector2(0.28, 0.5),
    new THREE.Vector2(0.0, 0.42),
  ];
  const molarGeo = new THREE.LatheGeometry(molarPts, 14);
  const premolarGeo = new THREE.CapsuleGeometry(0.36, 0.38, 6, 12);

  // Wide U-shaped gum ridges & dental arches hugging the spacious cheeks
  for (const side of [-1, 1]) {
    const lowerGumPts: THREE.Vector3[] = [];
    const upperGumPts: THREE.Vector3[] = [];
    const archSteps = 6;
    for (let i = 0; i < archSteps; i++) {
      const t = i / (archSteps - 1); // 0 = front-lateral canine/incisor (+4.4) -> 1 = rear wisdom molar (-9.2)
      const tz = 4.4 - t * 13.6;
      const curveWidth = Math.sin(0.32 + t * 1.38);
      const gxLower = side * (2.6 + curveWidth * 5.2);
      const gxUpper = side * (2.4 + curveWidth * 4.4);
      lowerGumPts.push(new THREE.Vector3(gxLower, -0.1, tz));
      upperGumPts.push(new THREE.Vector3(gxUpper, 4.15, tz));

      const isRearMolar = i >= 2;
      const toothGeo = isRearMolar ? molarGeo : premolarGeo;
      const lower = new THREE.Mesh(toothGeo, enamelMat);
      lower.position.set(gxLower, 0.32, tz);
      lower.castShadow = !isSoftwareGl;
      worldGroup.add(lower);
      teethLower.push(lower);

      const upper = new THREE.Mesh(toothGeo, enamelMat);
      upper.position.set(gxUpper, 3.7, tz);
      upper.rotation.z = Math.PI;
      upper.castShadow = !isSoftwareGl;
      worldGroup.add(upper);
      teethUpper.push(upper);
    }

    const lowerGumMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lowerGumPts), 20, 0.54, 8, false),
      gumMat,
    );
    const upperGumMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(upperGumPts), 20, 0.5, 8, false),
      gumMat,
    );
    worldGroup.add(lowerGumMesh, upperGumMesh);

    // Smooth spherical end-caps on gum ridges so no hollow tube ends ever show
    for (const pt of [lowerGumPts[0], lowerGumPts[lowerGumPts.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.54, 10, 8), gumMat);
      cap.position.copy(pt);
      worldGroup.add(cap);
    }
    for (const pt of [upperGumPts[0], upperGumPts[upperGumPts.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), gumMat);
      cap.position.copy(pt);
      worldGroup.add(cap);
    }
  }

  // Soft Palate Arch & Hanging Uvula framing the throat slide entrance (high clearance for camera)
  const palateZ = ZONES[0].zEnd + 0.5;
  const palateArch = new THREE.Mesh(
    new THREE.TorusGeometry(4.35, 0.42, 10, 24, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xd94b64, roughness: 0.42 }),
  );
  palateArch.position.set(0, 0.65, palateZ);
  worldGroup.add(palateArch);

  const uvulaMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.35,
  });
  const uvula = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.72, 6, 12), uvulaMat);
  uvula.position.set(getTrackCenterX(palateZ), 4.15, palateZ);
  worldGroup.add(uvula);

  // 3. Esophagus 360° Spiraling Throat Slide ("Perosotan Tenggorokan Memutar"): Rings + Curved Chute
  const peristalsisRings: THREE.Mesh[] = [];
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd9778b,
    roughness: 0.45,
    metalness: 0.04,
  });
  for (let uParam = ZONES[1].zStart - 3; uParam >= ZONES[1].zEnd + 3; uParam -= 5.0) {
    const wp = trackToWorld(0, uParam);
    const wpAhead = trackToWorld(0, uParam - 0.6);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.85, 0.38, 10, 26), ringMat);
    ring.position.set(wp.cx, wp.fy + 1.65, wp.cz);
    ring.lookAt(wpAhead.cx, wpAhead.fy + 1.65, wpAhead.cz);
    worldGroup.add(ring);
    peristalsisRings.push(ring);
  }

  // Long glossy U-shaped 360° spiral slide chute running cleanly from palate (-12.5) down into stomach
  const slideLenSteps = 68;
  const slideCrossSteps = 10;
  const slideHalfW = 2.95;
  const slidePos: number[] = [];
  const slideCol: number[] = [];
  const slideIdx: number[] = [];
  const leftRailPts: THREE.Vector3[] = [];
  const rightRailPts: THREE.Vector3[] = [];
  const slideStartZ = ZONES[1].zStart + 1.5;
  const slideEndZ = ZONES[1].zEnd + 0.2;

  for (let i = 0; i <= slideLenSteps; i++) {
    const t = i / slideLenSteps;
    const uParam = slideStartZ + (slideEndZ - slideStartZ) * t;
    const endTaper = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1;
    const leftEdge = trackToWorld(-slideHalfW, uParam);
    const rightEdge = trackToWorld(slideHalfW, uParam);
    leftRailPts.push(new THREE.Vector3(leftEdge.x, leftEdge.fy + 0.4 * endTaper, leftEdge.z));
    rightRailPts.push(new THREE.Vector3(rightEdge.x, rightEdge.fy + 0.4 * endTaper, rightEdge.z));

    const stripe = i % 2 === 0 ? 1.0 : 0.9;
    for (let j = 0; j <= slideCrossSteps; j++) {
      const u = (j / slideCrossSteps) * 2 - 1; // -1..+1
      const pt = trackToWorld(u * slideHalfW, uParam);
      const dishY = u * u * 0.46 * endTaper;
      slidePos.push(pt.x, pt.fy - 0.14 + dishY, pt.z);
      slideCol.push(0.9 * stripe, 0.38 * stripe, 0.56 * stripe);
    }
  }
  const slideRow = slideCrossSteps + 1;
  for (let i = 0; i < slideLenSteps; i++) {
    for (let j = 0; j < slideCrossSteps; j++) {
      const a = i * slideRow + j;
      const b = (i + 1) * slideRow + j;
      const c = (i + 1) * slideRow + (j + 1);
      const d = i * slideRow + (j + 1);
      slideIdx.push(a, b, d, b, c, d);
    }
  }
  const slideGeo = new THREE.BufferGeometry();
  slideGeo.setAttribute('position', new THREE.Float32BufferAttribute(slidePos, 3));
  slideGeo.setAttribute('color', new THREE.Float32BufferAttribute(slideCol, 3));
  slideGeo.setIndex(slideIdx);
  slideGeo.computeVertexNormals();

  const slideChute = new THREE.Mesh(
    slideGeo,
    new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.32,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18,
      side: THREE.DoubleSide,
    }),
  );
  worldGroup.add(slideChute);

  const railMat = new THREE.MeshPhysicalMaterial({
    color: 0xf472b6,
    roughness: 0.22,
    clearcoat: 0.75,
  });
  for (const pts of [leftRailPts, rightRailPts]) {
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.19, 8, false),
      railMat,
    );
    worldGroup.add(rail);
  }

  // 4. Giant Cavernous Stomach Basin: Wall-to-Wall Gastric Acid Sea, Rugae Wall Folds, Mucosal Islands & Digested Food Chunks (ZONES[2])
  const acidMat = new THREE.MeshStandardMaterial({
    map: textures.acidMap,
    color: 0xffffff,
    emissive: 0x3f6212,
    emissiveIntensity: 0.5,
    roughness: 0.14,
    transparent: true,
    opacity: 0.86,
  });

  // Curved full-basin gastric acid surface following the 37-unit wide J-pouch floor
  const acidSlices = 48;
  const acidCross = 8;
  const acidPos: number[] = [];
  const acidUvs: number[] = [];
  const acidIdx: number[] = [];
  const stStart = ZONES[2].zStart - 0.5;
  const stEnd = ZONES[2].zEnd + 0.5;
  for (let i = 0; i <= acidSlices; i++) {
    const t = i / acidSlices;
    const uParam = stStart + (stEnd - stStart) * t;
    const wp = trackToWorld(0, uParam);
    const hw = getTrackHalfWidth(uParam) * 0.96;
    for (let j = 0; j <= acidCross; j++) {
      const s = j / acidCross;
      const lat = (s * 2 - 1) * hw;
      acidPos.push(wp.cx + lat * wp.rx, wp.fy - 0.28, wp.cz + lat * wp.rz);
      acidUvs.push(s * 5, t * 10);
    }
  }
  const acidRow = acidCross + 1;
  for (let i = 0; i < acidSlices; i++) {
    for (let j = 0; j < acidCross; j++) {
      const a = i * acidRow + j;
      const b = (i + 1) * acidRow + j;
      const c = (i + 1) * acidRow + (j + 1);
      const d = i * acidRow + (j + 1);
      acidIdx.push(a, d, b, b, d, c);
    }
  }
  const acidGeo = new THREE.BufferGeometry();
  acidGeo.setAttribute('position', new THREE.Float32BufferAttribute(acidPos, 3));
  acidGeo.setAttribute('uv', new THREE.Float32BufferAttribute(acidUvs, 2));
  acidGeo.setIndex(acidIdx);
  acidGeo.computeVertexNormals();
  const acidPool = new THREE.Mesh(acidGeo, acidMat);
  worldGroup.add(acidPool);

  // Raised mucosal walkway islands winding across the massive stomach acid lake
  const walkwayMat = new THREE.MeshStandardMaterial({
    map: textures.mucosaMap,
    color: 0xe899a4,
    roughness: 0.55,
  });
  for (let uParam = ZONES[2].zStart - 2; uParam >= ZONES[2].zEnd + 2; uParam -= 4.5) {
    const t = (ZONES[2].zStart - uParam) / (ZONES[2].zStart - ZONES[2].zEnd);
    const waveX = Math.sin(t * Math.PI * 3.0) * 3.8;
    const wp = trackToWorld(getTrackCenterX(uParam) + waveX * 0.6, uParam);
    const padRadius = 3.8 + Math.sin(t * Math.PI) * 1.4;
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(padRadius, padRadius + 0.5, 0.34, 18),
      walkwayMat,
    );
    pad.position.set(wp.x, wp.y - 0.26, wp.z);
    worldGroup.add(pad);
  }

  // Sculpted Gastric Rugae Muscular Wall Folds hugging the vast left/right stomach walls (InstancedMesh)
  const rugaCount = 52;
  const rugaGeo = new THREE.CapsuleGeometry(0.95, 5.8, 6, 10);
  const rugaMat = new THREE.MeshStandardMaterial({
    map: textures.mucosaMap,
    color: 0xb94d60,
    roughness: 0.46,
    metalness: 0.02,
  });
  const rugaMesh = new THREE.InstancedMesh(rugaGeo, rugaMat, rugaCount);
  const rugaDummy = new THREE.Object3D();
  for (let i = 0; i < rugaCount; i++) {
    const t = (i + 0.5) / rugaCount;
    const uParam = stStart - 3 - t * (stStart - stEnd - 6);
    const wp = trackToWorld(0, uParam);
    const hw = getTrackHalfWidth(uParam);
    const side = i % 2 === 0 ? -1 : 1;
    const tier = i % 3;
    const wallRadiusX = hw - 0.25 - tier * 0.18;
    const wallX = wp.cx + side * wallRadiusX * wp.rx;
    const wallZ = wp.cz + side * wallRadiusX * wp.rz;
    rugaDummy.position.set(wallX, wp.fy + 1.35 + tier * 2.1, wallZ);
    // Align along the curved stomach wall so folds ripple horizontally/diagonally like real gastric rugae
    rugaDummy.rotation.set(Math.PI / 2 + (tier - 1) * 0.16, side * 0.22, side * 0.35);
    const sc = 0.85 + (i % 4) * 0.12;
    rugaDummy.scale.set(0.68 * sc, 1.05 * sc, 1.25 * sc);
    rugaDummy.updateMatrix();
    rugaMesh.setMatrixAt(i, rugaDummy.matrix);
  }
  rugaMesh.instanceMatrix.needsUpdate = true;
  rugaMesh.computeBoundingSphere();
  worldGroup.add(rugaMesh);

  // Many Floating & Churning Partially Digested Food Chunks ("Banyak Bongkahan Makanan yang Sedang Dicerna")
  const stomachChunkLayers: StomachChunkLayer[] = [];
  const stomachHeroChunks: StomachHeroChunkRef[] = [];
  const seeded = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const chunkDummy = new THREE.Object3D();
  const chunkColor = new THREE.Color();

  // Organic displaced bread/bolus lump geometry
  const breadGeo = new THREE.IcosahedronGeometry(0.95, 1);
  const bPos = breadGeo.attributes.position;
  for (let vi = 0; vi < bPos.count; vi++) {
    const vx = bPos.getX(vi);
    const vy = bPos.getY(vi);
    const vz = bPos.getZ(vi);
    const wobble = 0.82 + 0.34 * Math.sin(vx * 3.1 + vy * 2.7 - vz * 2.3);
    bPos.setXYZ(vi, vx * wobble * 1.15, vy * wobble * 0.78, vz * wobble);
  }
  breadGeo.computeVertexNormals();

  // Fibrous protein/meat chunk geometry
  const meatGeo = new THREE.DodecahedronGeometry(0.85, 0);
  const mPos = meatGeo.attributes.position;
  for (let vi = 0; vi < mPos.count; vi++) {
    const vx = mPos.getX(vi);
    const vy = mPos.getY(vi);
    const vz = mPos.getZ(vi);
    const k = 0.85 + 0.28 * Math.cos(vx * 4.0 - vz * 3.2);
    mPos.setXYZ(vi, vx * k * 1.25, vy * 0.72, vz * k * 0.95);
  }
  meatGeo.computeVertexNormals();

  // Curved veggie/fruit wedge geometry (beveled ExtrudeGeometry)
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, 0);
  wedgeShape.absarc(0, 0, 0.95, -0.45, 0.95, false);
  wedgeShape.lineTo(0, 0);
  const veggieGeo = new THREE.ExtrudeGeometry(wedgeShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  veggieGeo.center();

  // Melted cheese/fatty bolus square chunk
  const cheeseShape = new THREE.Shape();
  cheeseShape.moveTo(-0.62, -0.62);
  cheeseShape.quadraticCurveTo(0, -0.74, 0.62, -0.58);
  cheeseShape.quadraticCurveTo(0.72, 0, 0.58, 0.62);
  cheeseShape.quadraticCurveTo(0, 0.7, -0.62, 0.56);
  cheeseShape.closePath();
  const cheeseGeo = new THREE.ExtrudeGeometry(cheeseShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  cheeseGeo.center();

  const layerConfigs: {
    count: number;
    geo: THREE.BufferGeometry;
    mat: THREE.Material;
    palette: number[];
    sizeRange: [number, number];
    seedOffset: number;
    isBubble?: boolean;
  }[] = [
    {
      // 22 golden-tan carbohydrate/bread chunks soaking in gastric juice
      count: 22,
      geo: breadGeo,
      mat: new THREE.MeshStandardMaterial({
        map: textures.bunMap,
        color: 0xffffff,
        roughness: 0.74,
        metalness: 0.02,
      }),
      palette: [0xf3c677, 0xe8ad55, 0xfde68a, 0xd99b43],
      sizeRange: [0.85, 1.85],
      seedOffset: 11,
    },
    {
      // 20 protein / seared meat chunks softening under Pepsin
      count: 20,
      geo: meatGeo,
      mat: new THREE.MeshStandardMaterial({
        map: textures.pattyMap,
        color: 0xffffff,
        roughness: 0.68,
        metalness: 0.04,
      }),
      palette: [0x9a4a2a, 0xb85d35, 0x7c341d, 0xc9743c],
      sizeRange: [0.8, 1.7],
      seedOffset: 103,
    },
    {
      // 18 green & carrot-orange vegetable/apple fiber wedges
      count: 18,
      geo: veggieGeo,
      mat: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.42,
        metalness: 0.02,
      }),
      palette: [0x4ade80, 0x22c55e, 0xf97316, 0xef4444],
      sizeRange: [0.75, 1.55],
      seedOffset: 217,
    },
    {
      // 16 melted cheese & lipid droplets dissolving in acid
      count: 16,
      geo: cheeseGeo,
      mat: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.25,
        clearcoat: 0.55,
      }),
      palette: [0xfacc15, 0xfbbf24, 0xfef08a, 0xfb923c],
      sizeRange: [0.75, 1.45],
      seedOffset: 331,
    },
    {
      // 42 effervescent lime-chartreuse acid fizz bubbles rising around chunks
      count: 42,
      geo: new THREE.SphereGeometry(0.28, 10, 8),
      mat: new THREE.MeshStandardMaterial({
        color: 0xd9f99d,
        emissive: 0x65a30d,
        emissiveIntensity: 0.65,
        roughness: 0.12,
        transparent: true,
        opacity: 0.78,
      }),
      palette: [0xd9f99d, 0xbef264, 0xecfccb, 0xa3e635],
      sizeRange: [0.5, 1.45],
      seedOffset: 499,
      isBubble: true,
    },
  ];

  for (const cfg of layerConfigs) {
    const inst = new THREE.InstancedMesh(cfg.geo, cfg.mat, cfg.count);
    inst.frustumCulled = false;
    const slots: StomachChunkSlot[] = [];

    for (let i = 0; i < cfg.count; i++) {
      const r1 = seeded(cfg.seedOffset + i * 7 + 1);
      const r2 = seeded(cfg.seedOffset + i * 7 + 2);
      const r3 = seeded(cfg.seedOffset + i * 7 + 3);
      const r4 = seeded(cfg.seedOffset + i * 7 + 4);
      const r5 = seeded(cfg.seedOffset + i * 7 + 5);

      const uParam = -98.5 - r1 * 61.5; // spread generously across -98.5 .. -160
      const hw = getTrackHalfWidth(uParam);
      const cx = getTrackCenterX(uParam);
      // Scatter heavily across the wide flanks and mid-basin so chunks visibly fill the giant stomach
      const latSign = r2 < 0.5 ? -1 : 1;
      const latFrac = cfg.isBubble ? (r2 * 2 - 1) * 0.86 : latSign * (0.18 + Math.abs(r2 * 2 - 1) * 0.68);
      const wp = trackToWorld(cx + latFrac * hw, uParam);

      const scBase = cfg.sizeRange[0] + r3 * (cfg.sizeRange[1] - cfg.sizeRange[0]);
      const yBase = cfg.isBubble
        ? wp.fy - 0.1 + r4 * 2.6
        : wp.fy - 0.15 + r4 * 0.48;

      const slot: StomachChunkSlot = {
        baseX: wp.x,
        baseY: yBase,
        baseZ: wp.z,
        scaleX: scBase * (0.85 + r4 * 0.32),
        scaleY: scBase * (0.82 + r5 * 0.32),
        scaleZ: scBase * (0.85 + r1 * 0.3),
        rotX: r3 * Math.PI * 2,
        rotY: r4 * Math.PI * 2,
        rotZ: r5 * Math.PI * 2,
        phase: r1 * Math.PI * 2,
        bobAmp: cfg.isBubble ? 0.55 + r2 * 0.45 : 0.12 + r3 * 0.16,
        spinSpeed: (r5 - 0.5) * 0.75,
        swirlRadius: cfg.isBubble ? 0.18 : 0.25 + r4 * 0.35,
      };
      slots.push(slot);

      chunkDummy.position.set(slot.baseX, slot.baseY, slot.baseZ);
      chunkDummy.rotation.set(slot.rotX, slot.rotY, slot.rotZ);
      chunkDummy.scale.set(slot.scaleX, slot.scaleY, slot.scaleZ);
      chunkDummy.updateMatrix();
      inst.setMatrixAt(i, chunkDummy.matrix);

      const hex = cfg.palette[i % cfg.palette.length];
      chunkColor.setHex(hex);
      inst.setColorAt(i, chunkColor);
    }

    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    worldGroup.add(inst);
    stomachChunkLayers.push({ mesh: inst, slots, isBubble: cfg.isBubble });
  }

  // 8 Hero-Scale Composite Half-Digested Food Islands floating across the acid basin (each 4-5 distinct parts!)
  const foamRingGeo = new THREE.RingGeometry(1.15, 1.65, 22);
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xd9f99d,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const heroChunkPlacements: { z: number; latFrac: number; kind: 'burger_bit' | 'drumstick_bit' | 'apple_wedge' | 'chili_bit' }[] = [
    { z: -106, latFrac: -0.54, kind: 'burger_bit' },
    { z: -112, latFrac: 0.56, kind: 'apple_wedge' },
    { z: -120, latFrac: -0.62, kind: 'drumstick_bit' },
    { z: -126, latFrac: 0.58, kind: 'burger_bit' },
    { z: -135, latFrac: 0.54, kind: 'chili_bit' },
    { z: -141, latFrac: -0.60, kind: 'apple_wedge' },
    { z: -149, latFrac: -0.52, kind: 'burger_bit' },
    { z: -155, latFrac: 0.50, kind: 'drumstick_bit' },
  ];

  heroChunkPlacements.forEach((hc, idx) => {
    const hw = getTrackHalfWidth(hc.z);
    const cx = getTrackCenterX(hc.z);
    const wp = trackToWorld(cx + hc.latFrac * hw, hc.z);
    const g = new THREE.Group();
    const baseY = wp.fy + 0.08;
    g.position.set(wp.x, baseY, wp.z);

    // Acid digestion froth ring at liquid surface
    const foam = new THREE.Mesh(foamRingGeo, foamMat);
    foam.rotation.x = -Math.PI / 2;
    foam.position.y = -0.3;
    g.add(foam);

    if (hc.kind === 'burger_bit') {
      const bunM = new THREE.MeshStandardMaterial({ map: textures.bunMap, color: 0xf6c978, roughness: 0.72 });
      const patM = new THREE.MeshStandardMaterial({ map: textures.pattyMap, color: 0x92400e, roughness: 0.84 });
      const chzM = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25 });
      const letM = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.45 });

      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.92, 14, 10, 0, Math.PI * 1.45, 0, Math.PI * 0.65), bunM);
      bun.position.y = 0.1;
      const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.82, 0.28, 14, 1, false, 0, Math.PI * 1.5), patM);
      patty.position.y = -0.15;
      const cheese = new THREE.Mesh(cheeseGeo, chzM);
      cheese.rotation.set(Math.PI / 2, 0, 0.4);
      cheese.position.set(0.18, 0.02, 0.1);
      const lettuce = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.14, 8, 14, Math.PI * 1.3), letM);
      lettuce.rotation.x = Math.PI / 2;
      lettuce.position.y = 0.06;
      g.add(bun, patty, cheese, lettuce);
    } else if (hc.kind === 'drumstick_bit') {
      const meatM = new THREE.MeshStandardMaterial({ map: textures.chickenMap, color: 0xd97706, roughness: 0.56 });
      const boneM = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.35 });
      const meat = new THREE.Mesh(meatGeo, meatM);
      meat.scale.set(1.35, 1.15, 1.35);
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.05, 10), boneM);
      bone.position.set(0.62, 0.42, 0);
      bone.rotation.z = -0.85;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), boneM);
      knob.position.set(1.02, 0.72, 0);
      g.add(meat, bone, knob);
    } else if (hc.kind === 'apple_wedge') {
      const skinM = new THREE.MeshPhysicalMaterial({ map: textures.appleMap, color: 0xe11d48, roughness: 0.24, clearcoat: 0.5 });
      const fleshM = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 });
      const stemM = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });
      const wedgeOuter = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 12, 0, Math.PI * 0.9), skinM);
      const flesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.45, 0.22), fleshM);
      flesh.rotation.y = 0.25;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 8), stemM);
      stem.position.set(0, 0.92, 0);
      stem.rotation.z = 0.28;
      g.add(wedgeOuter, flesh, stem);
    } else {
      const chiliM = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.2, clearcoat: 0.75 });
      const greenM = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 });
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 1.15, 6, 12), chiliM);
      pod.rotation.z = 1.05;
      const calyx = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.22, 7), greenM);
      calyx.position.set(-0.62, 0.38, 0);
      calyx.rotation.z = 1.05;
      const seeds = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 }));
      seeds.position.set(0.45, -0.1, 0.22);
      g.add(pod, calyx, seeds);
    }

    g.scale.setScalar(1.18 + (idx % 3) * 0.16);
    g.rotation.set(0.18 * (idx % 2 === 0 ? 1 : -1), idx * 1.1, 0.15);
    worldGroup.add(g);
    stomachHeroChunks.push({
      group: g,
      baseX: wp.x,
      baseY,
      baseZ: wp.z,
      phase: idx * 0.9,
      spinSpeed: (idx % 2 === 0 ? 1 : -1) * 0.38,
    });
  });

  // 5. Small Intestine Villi (ZONES[3], InstancedMesh > 20 instances)
  const villiCount = 96;
  const villusGeo = new THREE.CapsuleGeometry(0.16, 0.85, 4, 8);
  const villusMat = new THREE.MeshStandardMaterial({
    color: 0xf4a28c,
    roughness: 0.48,
    metalness: 0.02,
  });
  const villiMesh = new THREE.InstancedMesh(villusGeo, villusMat, villiCount);
  const villiBaseMatrices: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  const smallStart = ZONES[3].zStart - 2;
  const smallSpan = ZONES[3].zStart - ZONES[3].zEnd - 4;
  for (let i = 0; i < villiCount; i++) {
    const uParam = smallStart - (i / villiCount) * smallSpan;
    const wp = trackToWorld(getTrackCenterX(uParam), uParam);
    const side = i % 2 === 0 ? -1 : 1;
    const x = wp.x + side * (3.6 + (i % 3) * 0.35);
    const y = wp.y + 0.35 + (i % 4) * 0.4;
    dummy.position.set(x, y, wp.z);
    dummy.rotation.set(0, 0, -side * 0.65);
    const sc = 0.85 + (i % 5) * 0.07;
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    villiMesh.setMatrixAt(i, dummy.matrix);
    villiBaseMatrices.push(dummy.matrix.clone());
    tint.setHSL(0.03 + (i % 6) * 0.01, 0.72, 0.72);
    villiMesh.setColorAt(i, tint);
  }
  villiMesh.instanceMatrix.needsUpdate = true;
  if (villiMesh.instanceColor) villiMesh.instanceColor.needsUpdate = true;
  villiMesh.computeBoundingSphere();
  worldGroup.add(villiMesh);

  // 6. Large Intestine Haustra Rings & Victory Portal (ZONES[4])
  const colonMat = new THREE.MeshStandardMaterial({
    color: 0x9d4edd,
    roughness: 0.6,
    metalness: 0.05,
  });
  for (let uParam = ZONES[4].zStart - 4; uParam >= ZONES[4].zEnd + 4; uParam -= 5.5) {
    const wp = trackToWorld(getTrackCenterX(uParam), uParam);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.8, 0.5, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xa85568, roughness: 0.5 }),
    );
    ring.position.set(wp.x, wp.y + 1.4, wp.z);
    worldGroup.add(ring);
  }

  // Victory Absorption & Anus Sphincter Exit Portal at TRACK_END_Z
  const victoryPortal = new THREE.Group();
  const wEnd = trackToWorld(getTrackCenterX(TRACK_END_Z), TRACK_END_Z);
  victoryPortal.position.set(wEnd.x, wEnd.y + 1.4, wEnd.z);
  const outerGate = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.32, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.5,
    }),
  );
  const innerDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2.55, 28),
    new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
  );
  victoryPortal.add(outerGate, innerDisc);
  worldGroup.add(victoryPortal);

  // Muscular Sfingter Ani (Anus) Framing Ring just around the exit
  const anusSphincter = new THREE.Mesh(
    new THREE.TorusGeometry(3.45, 0.68, 12, 28),
    new THREE.MeshStandardMaterial({
      map: textures.mucosaMap,
      color: 0xc84b65,
      roughness: 0.42,
    }),
  );
  anusSphincter.position.set(wEnd.x, wEnd.y + 1.4, wEnd.z + 0.15);
  worldGroup.add(anusSphincter);

  // Zone Gateway Arch Markers so player clearly sees transitions
  for (const zone of ZONES.slice(1)) {
    const wp = trackToWorld(getTrackCenterX(zone.zStart), zone.zStart);
    const archWidth = getTrackHalfWidth(zone.zStart) + 0.25;
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(archWidth, 0.24, 8, 24, Math.PI),
      colonMat,
    );
    arch.material = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0x92400e,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.4,
    });
    arch.position.set(wp.x, wp.y + 0.1, wp.z);
    worldGroup.add(arch);
  }

  return {
    worldGroup,
    peristalsisRings,
    teethUpper,
    teethLower,
    uvula,
    villiMesh,
    villiBaseMatrices,
    victoryPortal,
    stomachChunkLayers,
    stomachHeroChunks,
  };
}

export interface DiningStageRefs {
  stage: THREE.Group;
  mouthPortal: THREE.Group;
  upperJaw: THREE.Group;
  lowerJaw: THREE.Group;
  tongue: THREE.Mesh;
  uvula: THREE.Mesh;
}

export function buildDiningTableStage(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): DiningStageRefs {
  const stage = new THREE.Group();
  stage.name = 'dining_table_stage';
  scene.add(stage);

  // 1. Oak Wooden Tabletop (top surface at y = -0.14)
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    color: 0xffffff,
    roughness: 0.52,
    metalness: 0.04,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2c18,
    roughness: 0.68,
    metalness: 0.05,
  });

  const tabletop = new THREE.Mesh(new THREE.BoxGeometry(15, 0.36, 9.5), woodMat);
  tabletop.position.set(0, -0.32, -1.2);
  tabletop.receiveShadow = !isSoftwareGl;
  stage.add(tabletop);

  const apron = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.55, 8.2), darkWoodMat);
  apron.position.set(0, -0.76, -1.2);
  stage.add(apron);

  const legGeo = new THREE.CylinderGeometry(0.24, 0.16, 3.2, 12);
  for (const [lx, lz] of [
    [-6.2, 2.4],
    [6.2, 2.4],
    [-6.2, -4.8],
    [6.2, -4.8],
  ]) {
    const leg = new THREE.Mesh(legGeo, darkWoodMat);
    leg.position.set(lx, -2.5, lz);
    stage.add(leg);
  }

  // Warm Dining Room Floor & Wall Backdrop (no empty void)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 32),
    new THREE.MeshStandardMaterial({ color: 0x3b2317, roughness: 0.85 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -4.1, -3);
  stage.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 22),
    new THREE.MeshStandardMaterial({ color: 0x6b3e2e, roughness: 0.88 }),
  );
  backWall.position.set(0, 4.5, -10.5);
  stage.add(backWall);

  const wainscot = new THREE.Mesh(
    new THREE.BoxGeometry(42, 4.6, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x4b2a1c, roughness: 0.72 }),
  );
  wainscot.position.set(0, -1.8, -10.4);
  stage.add(wainscot);

  // Multi-part slatted wooden dining chairs behind the table
  for (const cx of [-3.6, 2.8]) {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, -6.1);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.24, 0.16), darkWoodMat);
    topRail.position.y = 2.05;
    chair.add(topRail);
    for (const sx of [-0.74, 0.74]) {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), darkWoodMat);
      stile.position.set(sx, 0.9, 0);
      chair.add(stile);
    }
    for (const slatX of [-0.36, 0, 0.36]) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.08), woodMat);
      slat.position.set(slatX, 1.2, 0);
      chair.add(slat);
    }
    stage.add(chair);
  }

  // 2. Woven Linen Placemat (offset +0.02 above tabletop)
  const placemat = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.03, 3.4),
    new THREE.MeshStandardMaterial({
      map: textures.placematMap,
      color: 0xffffff,
      roughness: 0.88,
    }),
  );
  placemat.position.set(0, -0.125, -0.1);
  placemat.receiveShadow = !isSoftwareGl;
  stage.add(placemat);

  // 3. Sculpted Ceramic Dinner Plate (LatheGeometry + gold rim)
  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: 0xfdfcf7,
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  });
  const platePts = [
    new THREE.Vector2(0.0, -0.09),
    new THREE.Vector2(0.95, -0.09),
    new THREE.Vector2(1.02, -0.04),
    new THREE.Vector2(1.42, 0.07),
    new THREE.Vector2(1.48, 0.05),
    new THREE.Vector2(1.12, -0.07),
    new THREE.Vector2(0.92, -0.11),
    new THREE.Vector2(0.0, -0.11),
  ];
  const plate = new THREE.Mesh(new THREE.LatheGeometry(platePts, 36), porcelainMat);
  plate.position.set(0, -0.01, 0);
  plate.receiveShadow = !isSoftwareGl;
  stage.add(plate);

  const goldRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.43, 0.02, 8, 36),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.85,
    }),
  );
  goldRim.rotation.x = Math.PI / 2;
  goldRim.position.set(0, 0.06, 0);
  stage.add(goldRim);

  // 4. Stainless Steel Fork & Knife (Composite Multi-Part)
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.92,
  });

  const forkGroup = new THREE.Group();
  forkGroup.position.set(-1.72, -0.08, 0.05);
  const forkHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.04, 1.35),
    steelMat,
  );
  forkHandle.position.z = 0.35;
  const forkHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.03, 0.16),
    steelMat,
  );
  forkHead.position.z = -0.35;
  forkGroup.add(forkHandle, forkHead);
  for (const tx of [-0.09, -0.03, 0.03, 0.09]) {
    const tine = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.025, 0.36),
      steelMat,
    );
    tine.position.set(tx, 0, -0.58);
    forkGroup.add(tine);
  }
  stage.add(forkGroup);

  const knifeGroup = new THREE.Group();
  knifeGroup.position.set(1.72, -0.08, 0.05);
  const knifeHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.055, 1.0, 10),
    steelMat,
  );
  knifeHandle.rotation.x = Math.PI / 2;
  knifeHandle.position.z = 0.48;
  const knifeBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.14, 1.05),
    steelMat,
  );
  knifeBlade.position.z = -0.45;
  knifeBlade.rotation.z = Math.PI / 2;
  knifeGroup.add(knifeHandle, knifeBlade);
  stage.add(knifeGroup);

  // 5. Folded Cloth Napkin next to Fork
  const napkin = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.1, 1.45),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.85 }),
  );
  napkin.position.set(-2.22, -0.06, 0.08);
  stage.add(napkin);

  // 6. Glass of Water on the Upper Right
  const glassGroup = new THREE.Group();
  glassGroup.position.set(2.15, -0.14, -1.15);
  const tumblerPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.38, 1.05),
    new THREE.Vector2(0.35, 1.05),
    new THREE.Vector2(0.29, 0.07),
    new THREE.Vector2(0.0, 0.07),
  ];
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const tumbler = new THREE.Mesh(new THREE.LatheGeometry(tumblerPts, 24), glassMat);
  tumbler.renderOrder = 2;
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.28, 0.72, 20),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
    }),
  );
  water.position.y = 0.44;
  glassGroup.add(water, tumbler);
  stage.add(glassGroup);

  // 7. Salt & Pepper Shakers in background for cozy table depth
  for (const [sx, col] of [
    [-1.4, 0xf8fafc],
    [-1.9, 0x334155],
  ] as const) {
    const shaker = new THREE.Group();
    shaker.position.set(sx, -0.14, -2.1);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.17, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 }),
    );
    body.position.y = 0.225;
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      steelMat,
    );
    cap.position.y = 0.45;
    shaker.add(body, cap);
    stage.add(shaker);
  }

  // 8. Friendly Stylized 3D Human Head & Oral Portal (hidden during 'title', animates during 'intro')
  const mouthPortal = new THREE.Group();
  mouthPortal.name = 'intro_mouth_portal';
  mouthPortal.position.set(0, 1.55, -2.55);
  mouthPortal.visible = false;

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf4bfa0,
    roughness: 0.58,
    metalness: 0.02,
  });
  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xf48fb1,
    roughness: 0.7,
    transparent: true,
    opacity: 0.55,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.72,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: 0xd94b64,
    roughness: 0.32,
    metalness: 0.04,
  });
  const introGumMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.45,
  });
  const cavityWallMat = new THREE.MeshStandardMaterial({
    color: 0x881d38,
    roughness: 0.58,
    side: THREE.BackSide,
  });
  const throatMat = new THREE.MeshBasicMaterial({ color: 0x450b1a });
  const introEnamelMat = new THREE.MeshPhysicalMaterial({
    color: 0xfefce8,
    roughness: 0.12,
    clearcoat: 0.85,
  });
  const introTongueMat = new THREE.MeshStandardMaterial({
    map: textures.tongueMap,
    color: 0xffffff,
    roughness: 0.42,
  });

  // Sculpted Face Mask with real oval mouth cutout (ExtrudeGeometry + Bevel, zero cavity blocking!)
  const faceShape = new THREE.Shape();
  faceShape.absellipse(0, 0.45, 2.38, 2.48, 0, Math.PI * 2, false, 0);
  const mouthHole = new THREE.Path();
  mouthHole.absellipse(0, 0.0, 1.54, 1.06, 0, Math.PI * 2, true, 0);
  faceShape.holes.push(mouthHole);

  const faceGeo = new THREE.ExtrudeGeometry(faceShape, {
    depth: 0.65,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.18,
    bevelSegments: 5,
    curveSegments: 28,
  });
  const faceMesh = new THREE.Mesh(faceGeo, skinMat);
  faceMesh.position.z = -0.72;
  mouthPortal.add(faceMesh);

  // Warm hair crown above forehead (above mouth opening so tunnel stays clear)
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(2.38, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hairMat,
  );
  hairCrown.scale.set(1.06, 0.82, 0.85);
  hairCrown.position.set(0, 1.65, -0.58);
  mouthPortal.add(hairCrown);

  // Cute Nose + Rosy Cheeks + Friendly Eyes looking down toward the plate
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skinMat);
  nose.scale.set(1.0, 0.82, 1.15);
  nose.position.set(0, 1.18, 0.24);
  mouthPortal.add(nose);

  for (const side of [-1, 1]) {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), blushMat);
    blush.scale.set(1.15, 0.72, 0.32);
    blush.position.set(side * 1.48, 0.56, 0.12);
    mouthPortal.add(blush);

    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    sclera.scale.set(1.0, 1.15, 0.55);
    sclera.position.set(side * 0.72, 1.68, 0.14);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x1e293b }),
    );
    pupil.position.set(side * 0.70, 1.63, 0.25);
    const brow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.34, 4, 8),
      hairMat,
    );
    brow.rotation.z = Math.PI / 2 - side * 0.14;
    brow.position.set(side * 0.72, 2.04, 0.18);
    mouthPortal.add(sclera, pupil, brow);
  }

  // Concave Oral Cavity Tunnel extending strictly backward (-Z from 0.02 to -3.4)
  const cavityTunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(1.38, 0.96, 3.4, 28, 1, true),
    cavityWallMat,
  );
  cavityTunnel.rotation.x = Math.PI / 2;
  cavityTunnel.scale.set(1.06, 1.0, 0.82);
  cavityTunnel.position.z = -1.7;
  mouthPortal.add(cavityTunnel);

  const throatCap = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 24),
    throatMat,
  );
  throatCap.position.z = -3.38;
  mouthPortal.add(throatCap);

  // Soft palate Uvula hanging inside mouth back
  const uvula = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.24, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.34 }),
  );
  uvula.position.set(0, 0.42, -1.65);
  mouthPortal.add(uvula);

  // Upper Jaw Group (Seamless Curved Upper Lip + Gum Arch + Rounded Enamel Teeth)
  const upperJaw = new THREE.Group();
  const upperLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.38, 0.0, 0.18),
    new THREE.Vector3(-0.68, 0.72, 0.26),
    new THREE.Vector3(0, 0.65, 0.28),
    new THREE.Vector3(0.68, 0.72, 0.26),
    new THREE.Vector3(1.38, 0.0, 0.18),
  ]);
  const upperLip = new THREE.Mesh(
    new THREE.TubeGeometry(upperLipCurve, 28, 0.16, 10, false),
    lipMat,
  );
  upperJaw.add(upperLip);

  const upperGumCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.12, 0.22, 0.02),
    new THREE.Vector3(-0.58, 0.62, 0.12),
    new THREE.Vector3(0, 0.66, 0.16),
    new THREE.Vector3(0.58, 0.62, 0.12),
    new THREE.Vector3(1.12, 0.22, 0.02),
  ]);
  upperJaw.add(
    new THREE.Mesh(new THREE.TubeGeometry(upperGumCurve, 20, 0.11, 8, false), introGumMat),
  );

  const roundedToothGeo = new THREE.CapsuleGeometry(0.12, 0.13, 6, 10);
  for (let i = -3; i <= 3; i++) {
    const t = new THREE.Mesh(roundedToothGeo, introEnamelMat);
    const angle = (i / 3.7) * 0.92;
    t.scale.set(1.06, 1.0, 0.65);
    t.position.set(
      Math.sin(angle) * 1.06,
      0.56 - Math.abs(i) * 0.08,
      Math.cos(angle) * 0.18 - 0.02,
    );
    upperJaw.add(t);
  }
  mouthPortal.add(upperJaw);

  // Lower Jaw Group (Seamless Curved Lower Lip + Gum Arch + Rounded Teeth + Tongue)
  const lowerJaw = new THREE.Group();
  const lowerLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.38, 0.0, 0.18),
    new THREE.Vector3(-0.68, -0.70, 0.24),
    new THREE.Vector3(0, -0.78, 0.26),
    new THREE.Vector3(0.68, -0.70, 0.24),
    new THREE.Vector3(1.38, 0.0, 0.18),
  ]);
  const lowerLip = new THREE.Mesh(
    new THREE.TubeGeometry(lowerLipCurve, 28, 0.17, 10, false),
    lipMat,
  );
  lowerJaw.add(lowerLip);

  const lowerGumCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.10, -0.22, 0.02),
    new THREE.Vector3(-0.56, -0.62, 0.12),
    new THREE.Vector3(0, -0.66, 0.16),
    new THREE.Vector3(0.56, -0.62, 0.12),
    new THREE.Vector3(1.10, -0.22, 0.02),
  ]);
  lowerJaw.add(
    new THREE.Mesh(new THREE.TubeGeometry(lowerGumCurve, 20, 0.11, 8, false), introGumMat),
  );

  for (let i = -3; i <= 3; i++) {
    const t = new THREE.Mesh(roundedToothGeo, introEnamelMat);
    const angle = (i / 3.7) * 0.92;
    t.scale.set(1.04, 1.0, 0.65);
    t.position.set(
      Math.sin(angle) * 1.04,
      -0.56 + Math.abs(i) * 0.08,
      Math.cos(angle) * 0.18 - 0.02,
    );
    lowerJaw.add(t);
  }

  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.86, 18, 12),
    introTongueMat,
  );
  tongue.scale.set(1.02, 0.3, 1.35);
  tongue.position.set(0, -0.5, -0.78);
  lowerJaw.add(tongue);
  mouthPortal.add(lowerJaw);

  stage.add(mouthPortal);

  return {
    stage,
    mouthPortal,
    upperJaw,
    lowerJaw,
    tongue,
    uvula,
  };
}

export interface ToiletStageRefs {
  stage: THREE.Group;
  toiletGroup: THREE.Group;
  waterSurface: THREE.Mesh;
  swirlGroup: THREE.Group;
  flushHandlePivot: THREE.Group;
  drainWell: THREE.Mesh;
}

export function buildToiletStage(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): ToiletStageRefs {
  const stage = new THREE.Group();
  stage.visible = false;
  scene.add(stage);

  // Soft pastel tiled bathroom floor & rear wall
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xd1fae5,
    roughness: 0.38,
    metalness: 0.04,
  });
  const tileLineMat = new THREE.MeshStandardMaterial({
    color: 0xa7f3d0,
    roughness: 0.55,
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 28), floorMat);
  floor.position.set(0, -0.2, 0);
  floor.receiveShadow = !isSoftwareGl;
  stage.add(floor);

  for (let i = -5; i <= 5; i++) {
    const lineX = new THREE.Mesh(new THREE.BoxGeometry(24, 0.015, 0.04), tileLineMat);
    lineX.position.set(0, 0.008, i * 1.6);
    const lineZ = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 24), tileLineMat);
    lineZ.position.set(i * 1.6, 0.008, 0);
    stage.add(lineX, lineZ);
  }

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xbfdbfe,
    roughness: 0.62,
  });
  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(28, 12, 0.5), wallMat);
  rearWall.position.set(0, 5.8, -3.5);
  const dado = new THREE.Mesh(
    new THREE.BoxGeometry(28, 2.2, 0.56),
    new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.42 }),
  );
  dado.position.set(0, 1.1, -3.48);
  const dadoTrim = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.16, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }),
  );
  dadoTrim.position.set(0, 2.22, -3.46);
  stage.add(rearWall, dado, dadoTrim);

  // Cozy oval bath mat in front of the toilet pedestal
  const bathMat = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.62, 0.08, 28),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.92 }),
  );
  bathMat.scale.set(1.25, 1, 0.78);
  bathMat.position.set(0, 0.04, 2.15);
  bathMat.receiveShadow = !isSoftwareGl;
  stage.add(bathMat);

  // Sculpted Porcelain Toilet Group centered cleanly at (0, 0, 0)
  const toiletGroup = new THREE.Group();
  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.14,
    metalness: 0.02,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const seatMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.18,
    clearcoat: 0.7,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.85,
  });

  // Pedestal base foot
  const pedestalFoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 1.02, 0.62, 28),
    porcelainMat,
  );
  pedestalFoot.position.set(0, 0.31, -0.05);
  pedestalFoot.scale.set(1.06, 1, 1.24);
  pedestalFoot.castShadow = !isSoftwareGl;
  toiletGroup.add(pedestalFoot);

  // Closed-profile LatheGeometry: thick glossy outer bowl + smooth concave inner bowl down to drain well
  const bowlProfile = [
    new THREE.Vector2(0.54, 0.44),
    new THREE.Vector2(0.72, 0.44),
    new THREE.Vector2(1.02, 0.76),
    new THREE.Vector2(1.34, 1.08),
    new THREE.Vector2(1.46, 1.38),
    new THREE.Vector2(1.46, 1.49),
    new THREE.Vector2(1.32, 1.54),
    new THREE.Vector2(1.18, 1.46),
    new THREE.Vector2(1.06, 1.18),
    new THREE.Vector2(0.72, 0.84),
    new THREE.Vector2(0.54, 0.64),
    new THREE.Vector2(0.54, 0.44),
  ];
  const bowlMesh = new THREE.Mesh(
    new THREE.LatheGeometry(bowlProfile, 36),
    porcelainMat,
  );
  bowlMesh.scale.set(1.12, 1.0, 1.28);
  bowlMesh.castShadow = !isSoftwareGl;
  bowlMesh.receiveShadow = !isSoftwareGl;
  toiletGroup.add(bowlMesh);

  // Open ergonomic toilet seat ring along top rim
  const seatRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.31, 0.14, 14, 36),
    seatMat,
  );
  seatRing.rotation.x = Math.PI / 2;
  seatRing.scale.set(1.12, 1.28, 1.0);
  seatRing.position.set(0, 1.56, 0);
  seatRing.castShadow = !isSoftwareGl;
  toiletGroup.add(seatRing);

  // Deep drain hole inside center bottom of the bowl ("lobang toilet")
  const drainWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.48, 0.36, 24),
    new THREE.MeshBasicMaterial({ color: 0x082f49 }),
  );
  drainWell.scale.set(1.12, 1, 1.26);
  drainWell.position.set(0, 0.48, 0);
  toiletGroup.add(drainWell);

  // Swirling turquoise toilet water surface inside bowl
  const waterSurface = new THREE.Mesh(
    new THREE.CircleGeometry(1.04, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
      roughness: 0.08,
      transparent: true,
      opacity: 0.72,
      clearcoat: 0.9,
    }),
  );
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.scale.set(1.12, 1.28, 1);
  waterSurface.position.set(0, 1.04, 0);
  toiletGroup.add(waterSurface);

  // Animated whirlpool foam rings & bubbles during flush
  const swirlGroup = new THREE.Group();
  swirlGroup.position.set(0, 1.06, 0);
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.78,
  });
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.38 + i * 0.24, 0.035, 8, 22, Math.PI * 1.15),
      foamMat,
    );
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = (i * Math.PI * 2) / 3;
    arc.scale.set(1.08, 1.22, 1);
    swirlGroup.add(arc);
  }
  const bubbleGeo = new THREE.SphereGeometry(0.065, 8, 8);
  for (let b = 0; b < 8; b++) {
    const ang = (b / 8) * Math.PI * 2;
    const rad = 0.35 + (b % 3) * 0.25;
    const bub = new THREE.Mesh(bubbleGeo, foamMat);
    bub.position.set(Math.cos(ang) * rad, 0.02, Math.sin(ang) * rad * 1.15);
    swirlGroup.add(bub);
  }
  toiletGroup.add(swirlGroup);

  // Raised open toilet lid leaning against cistern
  const toiletLid = new THREE.Mesh(
    new THREE.CylinderGeometry(1.36, 1.36, 0.11, 30),
    seatMat,
  );
  toiletLid.scale.set(1.08, 1.0, 1.12);
  toiletLid.rotation.x = Math.PI / 2 - 0.14;
  toiletLid.position.set(0, 2.74, -1.52);
  toiletGroup.add(toiletLid);

  // Porcelain Cistern Tank behind the bowl + Lid
  const tankBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 1.85, 0.95),
    porcelainMat,
  );
  tankBody.position.set(0, 2.28, -2.05);
  tankBody.castShadow = !isSoftwareGl;
  const tankCap = new THREE.Mesh(
    new THREE.BoxGeometry(2.28, 0.16, 1.08),
    porcelainMat,
  );
  tankCap.position.set(0, 3.24, -2.05);
  const tankConnector = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.9, 0.72),
    porcelainMat,
  );
  tankConnector.position.set(0, 1.18, -1.78);
  toiletGroup.add(tankBody, tankCap, tankConnector);

  // Animated Chrome Flush Lever on front-left of tank
  const flushHandlePivot = new THREE.Group();
  flushHandlePivot.position.set(-0.88, 2.95, -1.56);
  const leverMount = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12),
    chromeMat,
  );
  leverMount.rotation.x = Math.PI / 2;
  const leverArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.42, 10),
    chromeMat,
  );
  leverArm.rotation.z = Math.PI / 2;
  leverArm.position.set(-0.2, 0, 0.06);
  const leverTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 10, 8),
    chromeMat,
  );
  leverTip.position.set(-0.4, 0, 0.06);
  flushHandlePivot.add(leverMount, leverArm, leverTip);
  toiletGroup.add(flushHandlePivot);

  stage.add(toiletGroup);

  // Cute Free-Standing Chrome Toilet Paper Holder to the right
  const tpStand = new THREE.Group();
  tpStand.position.set(2.45, 0, -0.55);
  const tpBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 16), chromeMat);
  tpBase.position.y = 0.04;
  const tpPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.85, 12), chromeMat);
  tpPole.position.y = 0.96;
  const tpRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.42, 18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }),
  );
  tpRoll.rotation.z = Math.PI / 2;
  tpRoll.position.set(-0.18, 1.82, 0);
  const tpCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.44, 12),
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 }),
  );
  tpCore.rotation.z = Math.PI / 2;
  tpCore.position.set(-0.18, 1.82, 0);
  const tpSheet = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.42, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }),
  );
  tpSheet.position.set(-0.18, 1.62, 0.23);
  tpStand.add(tpBase, tpPole, tpRoll, tpCore, tpSheet);
  stage.add(tpStand);

  // Ground shadow circle under toilet base
  const toiletShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.75, 24),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  toiletShadow.rotation.x = -Math.PI / 2;
  toiletShadow.scale.set(1.12, 1.32, 1);
  toiletShadow.position.set(0, 0.02, -0.15);
  stage.add(toiletShadow);

  return {
    stage,
    toiletGroup,
    waterSurface,
    swirlGroup,
    flushHandlePivot,
    drainWell,
  };
}

export function buildPickupMesh(
  pickup: PickupEntity,
  textures: ProceduralTextureSet,
): THREE.Group {
  const g = new THREE.Group();
  const colorMap: Record<PickupEntity['kind'], number> = {
    amylase: 0x38bdf8,
    mucus: 0x22d3ee,
    pepsin: 0xfacc15,
    bile: 0xfb923c,
    water: 0x60a5fa,
    probiotic: 0x4ade80,
  };
  const col = colorMap[pickup.kind];

  // Composite 3-part orb + orbiting ring + shadow
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 1),
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.25,
    }),
  );
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.045, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  halo.rotation.x = Math.PI / 3;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 16),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.68;

  g.add(core, halo, shadow);
  const wp = trackToWorld(pickup.x, pickup.z);
  g.position.set(wp.x, wp.y + 0.75, wp.z);
  return g;
}

export function buildStimulusMesh(
  node: StimulusNode,
  textures: ProceduralTextureSet,
): THREE.Group {
  const g = new THREE.Group();

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.35, 1.3, 12),
    new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.4 }),
  );
  stem.position.y = -0.2;

  const bulb = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.65, 1),
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.7,
      roughness: 0.15,
      metalness: 0.2,
    }),
  );
  bulb.position.y = 0.55;
  bulb.name = 'stim_bulb';

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.38, 28),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.82;
  ring.name = 'stim_ring';

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 18),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.85;

  g.add(stem, bulb, ring, shadow);
  const wp = trackToWorld(node.x, node.z);
  g.position.set(wp.x, wp.y + 0.9, wp.z);
  return g;
}

export function buildMouthGermNpcMesh(
  npc: MouthNpc,
  textures: ProceduralTextureSet,
): THREE.Group {
  const g = new THREE.Group();
  g.name = npc.id;
  const isParotitis = npc.diseaseId === 'parotitis';
  const isGerd = npc.diseaseId === 'gerd';
  const isMaag = npc.diseaseId === 'maag';
  const isWasir = npc.diseaseId === 'wasir';

  const germMat = new THREE.MeshStandardMaterial({
    color: isWasir ? 0xf43f5e : isMaag ? 0xa855f7 : isGerd ? 0xf97316 : isParotitis ? 0x22d3ee : 0x84cc16,
    emissive: isWasir ? 0x9f1239 : isMaag ? 0x6b21a8 : isGerd ? 0xc2410c : isParotitis ? 0x0e7490 : 0x3f6212,
    emissiveIntensity: 0.4,
    roughness: 0.34,
    metalness: 0.06,
  });
  const spotMat = new THREE.MeshStandardMaterial({
    color: isWasir ? 0x881337 : isMaag ? 0x581c87 : isGerd ? 0x9a3412 : isParotitis ? 0x0369a1 : 0x4d7c0f,
    roughness: 0.48,
  });
  const sporeMat = new THREE.MeshStandardMaterial({
    color: isWasir ? 0xfef08a : isMaag ? 0xfef08a : isGerd ? 0xfef08a : isParotitis ? 0xfda4af : 0xfef08a,
    emissive: isWasir ? 0xfb7185 : isMaag ? 0xc084fc : isGerd ? 0xf59e0b : isParotitis ? 0xe11d48 : 0xeab308,
    emissiveIntensity: 0.55,
    roughness: 0.24,
  });

  // Main plump cartoon microbe / virus body
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'npc_body';

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 16), germMat);
  body.scale.set(isParotitis ? 1.12 : 1.06, 0.94, 1.0);
  bodyGroup.add(body);

  // Subtle puffy cheek bumps on Parotitis NPC as a visual hint of swollen parotid glands
  if (isParotitis) {
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0xbe123c,
      emissiveIntensity: 0.28,
      roughness: 0.4,
    });
    const cheekGeo = new THREE.SphereGeometry(0.24, 12, 10);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.52, -0.08, 0.24);
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.52, -0.08, 0.24);
    bodyGroup.add(leftCheek, rightCheek);
  }

  // Microbe spots around flanks & back
  const spotGeo = new THREE.SphereGeometry(0.14, 10, 8);
  for (const [sx, sy, sz] of [
    [-0.44, 0.16, -0.2],
    [0.42, -0.1, -0.25],
    [0.0, 0.36, -0.4],
    [-0.3, -0.26, 0.28],
    [0.34, 0.28, 0.18],
  ]) {
    const sp = new THREE.Mesh(spotGeo, spotMat);
    sp.position.set(sx, sy, sz);
    sp.scale.set(1, 0.7, 1);
    bodyGroup.add(sp);
  }

  // Radial germ cilia / viral glycoprotein spikes topped with glowing bulbs
  const stalkGeo = new THREE.CapsuleGeometry(0.055, 0.22, 5, 8);
  const bulbGeo = new THREE.SphereGeometry(0.095, 10, 8);
  const antennaDirs = [
    [0, 1, 0],
    [0.85, 0.55, 0],
    [-0.85, 0.55, 0],
    [0.7, 0.3, -0.65],
    [-0.7, 0.3, -0.65],
    [0.0, 0.48, -0.86],
    [0.92, -0.15, 0.1],
    [-0.92, -0.15, 0.1],
  ];
  for (const [dx, dy, dz] of antennaDirs) {
    const pivot = new THREE.Group();
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const stalk = new THREE.Mesh(stalkGeo, germMat);
    stalk.position.y = 0.66;
    const tip = new THREE.Mesh(bulbGeo, sporeMat);
    tip.position.y = 0.84;
    pivot.add(stalk, tip);
    bodyGroup.add(pivot);
  }

  // Friendly/cheeky cartoon eyes + wide grin facing +Z
  addCartoonEyes(bodyGroup, 0.54, 0.12, 0.2);
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.032, 8, 16, Math.PI),
    new THREE.MeshBasicMaterial({
      color: isWasir ? 0x4c0519 : isMaag ? 0x2e1065 : isGerd ? 0x431407 : isParotitis ? 0x082f49 : 0x1a2e05,
    }),
  );
  smile.position.set(0, -0.1, 0.56);
  smile.rotation.z = Math.PI;
  bodyGroup.add(smile);

  g.add(bodyGroup);

  // Hovering Golden Interaction Beacon above head
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.75,
      roughness: 0.2,
    }),
  );
  beacon.position.y = 1.28;
  beacon.name = 'npc_beacon';
  g.add(beacon);

  // Interactive aura ring & contact shadow on floor
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.42, 32),
    new THREE.MeshBasicMaterial({
      color: isWasir ? 0xfb7185 : isMaag ? 0xc084fc : isGerd ? 0xfb923c : isParotitis ? 0x38bdf8 : 0xa3e635,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.8;
  ring.name = 'npc_ring';
  g.add(ring);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.05, 20),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.82;
  g.add(shadow);

  const wp = trackToWorld(npc.x, npc.z);
  g.position.set(wp.x, wp.y + 0.85, wp.z);
  return g;
}

export const buildDigestiveNpcMesh = buildMouthGermNpcMesh;

export function buildHazardMesh(
  hazard: HazardEntity,
  textures: ProceduralTextureSet,
): THREE.Group {
  const g = new THREE.Group();
  const wp = trackToWorld(hazard.x, hazard.z);
  g.position.set(wp.x, wp.y, wp.z);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(hazard.radius * 0.9, 18),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);

  if (hazard.kind === 'tooth_crusher') {
    const enamel = new THREE.MeshPhysicalMaterial({
      color: 0xfefce8,
      roughness: 0.15,
      clearcoat: 0.7,
    });
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.1, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 }),
    );
    base.position.y = 0.2;
    const upperTooth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.72, 1.7, 10),
      enamel,
    );
    upperTooth.position.y = 3.2;
    upperTooth.name = 'crusher_jaw';

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.3, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.name = 'telegraph_ring';
    g.add(base, upperTooth, ring);
  } else if (hazard.kind === 'acid_geyser' || hazard.kind === 'canker_sore') {
    const isCanker = hazard.kind === 'canker_sore';
    const crater = new THREE.Mesh(
      new THREE.TorusGeometry(hazard.radius * 0.7, 0.24, 10, 22),
      new THREE.MeshStandardMaterial({
        color: isCanker ? 0xfda4af : 0x65a30d,
        roughness: 0.45,
      }),
    );
    crater.rotation.x = Math.PI / 2;
    crater.position.y = 0.12;

    const jet = new THREE.Mesh(
      new THREE.ConeGeometry(hazard.radius * 0.65, 2.8, 16),
      new THREE.MeshStandardMaterial({
        color: isCanker ? 0xfb7185 : 0xa3e635,
        emissive: isCanker ? 0xe11d48 : 0x65a30d,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.75,
      }),
    );
    jet.position.y = 1.4;
    jet.scale.set(0.2, 0.1, 0.2);
    jet.name = 'acid_jet';

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(hazard.radius * 0.75, hazard.radius, 24),
      new THREE.MeshBasicMaterial({
        color: isCanker ? 0xf43f5e : 0xa3e635,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.name = 'telegraph_ring';

    g.add(crater, jet, ring);
  } else if (hazard.kind === 'h_pylori') {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    });
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.45, 0.6, -0.3),
      new THREE.Vector3(0.3, 0.8, 0.0),
      new THREE.Vector3(-0.3, 0.9, 0.35),
      new THREE.Vector3(0.35, 1.0, 0.55),
    ]);
    const spiral = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.24, 8, false),
      bodyMat,
    );
    const eyeGeo = new THREE.SphereGeometry(0.11, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const e1 = new THREE.Mesh(eyeGeo, eyeMat);
    e1.position.set(0.22, 1.05, 0.62);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat);
    e2.position.set(0.45, 1.05, 0.52);
    g.add(spiral, e1, e2);
  } else if (hazard.kind === 'e_coli') {
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x365314,
      emissiveIntensity: 0.5,
      roughness: 0.32,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.7, 6, 12), capMat);
    body.position.y = 0.75;
    body.rotation.x = Math.PI / 2;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat);
    e1.position.set(-0.2, 0.92, 0.45);
    const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat);
    e2.position.set(0.2, 0.92, 0.45);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.95, 20),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.name = 'telegraph_ring';
    g.add(body, e1, e2, ring);
  } else {
    // Constipation rock cluster
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.92,
      metalness: 0.05,
    });
    const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), rockMat);
    mainRock.position.y = 0.85;
    mainRock.scale.set(1.2, 0.95, 0.9);
    const sub1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), rockMat);
    sub1.position.set(0.85, 0.55, 0.3);
    const sub2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), rockMat);
    sub2.position.set(-0.78, 0.5, -0.25);
    g.add(mainRock, sub1, sub2);
  }

  return g;
}
