import * as THREE from 'three';

export interface ProceduralTextureSet {
  mucosaMap: THREE.CanvasTexture;
  mucosaBump: THREE.CanvasTexture;
  tongueMap: THREE.CanvasTexture;
  acidMap: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  bunMap: THREE.CanvasTexture;
  pattyMap: THREE.CanvasTexture;
  appleMap: THREE.CanvasTexture;
  chickenMap: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  placematMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  maxAniso: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTex(
  canvas: HTMLCanvasElement,
  maxAniso: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAniso: number): ProceduralTextureSet {
  // 1. Mucosa Color & Bump
  const [mCanvas, mCtx] = makeCanvas(256, 256);
  const [mbCanvas, mbCtx] = makeCanvas(256, 256);
  mCtx.fillStyle = '#d98a96';
  mCtx.fillRect(0, 0, 256, 256);
  mbCtx.fillStyle = '#808080';
  mbCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 180; i++) {
    const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 256;
    const y = (Math.cos(i * 78.233) * 0.5 + 0.5) * 256;
    const r = 10 + (i % 18);
    const grad = mCtx.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, i % 2 === 0 ? 'rgba(248, 175, 185, 0.45)' : 'rgba(175, 78, 96, 0.35)');
    grad.addColorStop(1, 'rgba(217, 138, 150, 0)');
    mCtx.fillStyle = grad;
    mCtx.beginPath();
    mCtx.arc(x, y, r, 0, Math.PI * 2);
    mCtx.fill();

    const bGrad = mbCtx.createRadialGradient(x, y, 1, x, y, r);
    bGrad.addColorStop(0, i % 2 === 0 ? 'rgba(235,235,235,0.5)' : 'rgba(40,40,40,0.45)');
    bGrad.addColorStop(1, 'rgba(128,128,128,0)');
    mbCtx.fillStyle = bGrad;
    mbCtx.beginPath();
    mbCtx.arc(x, y, r, 0, Math.PI * 2);
    mbCtx.fill();
  }
  // Subtle organic capillary lines
  mCtx.strokeStyle = 'rgba(166, 48, 72, 0.25)';
  mCtx.lineWidth = 1.5;
  for (let i = 0; i < 24; i++) {
    const sx = (i * 37) % 256;
    const sy = (i * 71) % 256;
    mCtx.beginPath();
    mCtx.moveTo(sx, sy);
    mCtx.quadraticCurveTo(sx + 18, sy + 12, sx + 34, sy - 8);
    mCtx.stroke();
  }

  const mucosaMap = finalizeColorTex(mCanvas, maxAniso, 6, 16);
  const mucosaBump = finalizeDataTex(mbCanvas, maxAniso, 6, 16);

  // 2. Tongue Papillae Texture
  const [tCanvas, tCtx] = makeCanvas(256, 256);
  const tGrad = tCtx.createLinearGradient(0, 0, 256, 0);
  tGrad.addColorStop(0, '#d95f76');
  tGrad.addColorStop(0.45, '#ea7b90');
  tGrad.addColorStop(0.5, '#c2465e'); // central tongue sulcus
  tGrad.addColorStop(0.55, '#ea7b90');
  tGrad.addColorStop(1, '#d95f76');
  tCtx.fillStyle = tGrad;
  tCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 520; i++) {
    const x = ((i * 53) % 256) + ((i % 5) - 2);
    const y = ((i * 97) % 256) + ((i % 7) - 3);
    tCtx.fillStyle = i % 3 === 0 ? '#f9a8b8' : '#b83e57';
    tCtx.beginPath();
    tCtx.arc(x, y, 1.8 + (i % 3), 0, Math.PI * 2);
    tCtx.fill();
  }
  const tongueMap = finalizeColorTex(tCanvas, maxAniso, 1, 8);

  // 3. Gastric Acid Bubbling Texture
  const [aCanvas, aCtx] = makeCanvas(256, 256);
  aCtx.fillStyle = '#7cb518';
  aCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 65; i++) {
    const x = (i * 43) % 256;
    const y = (i * 89) % 256;
    const r = 6 + (i % 14);
    const g = aCtx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, '#ecfccb');
    g.addColorStop(0.55, '#a3e635');
    g.addColorStop(1, 'rgba(124, 181, 24, 0)');
    aCtx.fillStyle = g;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();
  }
  const acidMap = finalizeColorTex(aCanvas, maxAniso, 2, 4);

  // 4. Radial Contact Shadow
  const [sCanvas, sCtx] = makeCanvas(128, 128);
  const sGrad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
  sGrad.addColorStop(0, 'rgba(20, 4, 10, 0.72)');
  sGrad.addColorStop(0.55, 'rgba(20, 4, 10, 0.3)');
  sGrad.addColorStop(1, 'rgba(20, 4, 10, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(sCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  // 5. Food Textures
  const [bCanvas, bCtx] = makeCanvas(128, 128);
  bCtx.fillStyle = '#d98a36';
  bCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 60; i++) {
    bCtx.fillStyle = i % 2 === 0 ? '#c47222' : '#eab15e';
    bCtx.beginPath();
    bCtx.arc((i * 29) % 128, (i * 47) % 128, 4 + (i % 4), 0, Math.PI * 2);
    bCtx.fill();
  }
  const bunMap = finalizeColorTex(bCanvas, maxAniso);

  const [pCanvas, pCtx] = makeCanvas(128, 128);
  pCtx.fillStyle = '#5c2d18';
  pCtx.fillRect(0, 0, 128, 128);
  pCtx.fillStyle = '#3b190b';
  for (let y = 12; y < 128; y += 26) {
    pCtx.fillRect(0, y, 128, 7);
  }
  const pattyMap = finalizeColorTex(pCanvas, maxAniso);

  const [apCanvas, apCtx] = makeCanvas(128, 128);
  const apGrad = apCtx.createLinearGradient(0, 0, 0, 128);
  apGrad.addColorStop(0, '#ef4444');
  apGrad.addColorStop(0.65, '#dc2626');
  apGrad.addColorStop(1, '#fbbf24');
  apCtx.fillStyle = apGrad;
  apCtx.fillRect(0, 0, 128, 128);
  apCtx.fillStyle = 'rgba(254, 240, 138, 0.35)';
  for (let i = 0; i < 70; i++) {
    apCtx.fillRect((i * 31) % 128, (i * 67) % 128, 2, 2);
  }
  const appleMap = finalizeColorTex(apCanvas, maxAniso);

  const [cCanvas, cCtx] = makeCanvas(128, 128);
  cCtx.fillStyle = '#b95d24';
  cCtx.fillRect(0, 0, 128, 128);
  cCtx.fillStyle = 'rgba(69, 26, 3, 0.45)';
  for (let i = 0; i < 6; i++) {
    cCtx.fillRect(0, i * 22 + 4, 128, 5);
  }
  const chickenMap = finalizeColorTex(cCanvas, maxAniso);

  // 6. Dining Table Oak Wood Grain Texture
  const [wCanvas, wCtx] = makeCanvas(256, 256);
  wCtx.fillStyle = '#8b5a36';
  wCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) {
    wCtx.fillStyle = y % 128 === 0 ? 'rgba(110, 66, 34, 0.35)' : 'rgba(155, 102, 62, 0.25)';
    wCtx.fillRect(0, y, 256, 62);
    wCtx.fillStyle = 'rgba(56, 30, 14, 0.45)';
    wCtx.fillRect(0, y + 62, 256, 2);
  }
  wCtx.strokeStyle = 'rgba(66, 35, 16, 0.28)';
  wCtx.lineWidth = 1.5;
  for (let i = 0; i < 42; i++) {
    const yy = (i * 19) % 256;
    wCtx.beginPath();
    wCtx.moveTo(0, yy);
    wCtx.bezierCurveTo(85, yy + ((i % 3) - 1) * 6, 170, yy - ((i % 3) - 1) * 6, 256, yy);
    wCtx.stroke();
  }
  const woodMap = finalizeColorTex(wCanvas, maxAniso, 3, 2);

  // 7. Woven Linen Placemat Texture
  const [pmCanvas, pmCtx] = makeCanvas(128, 128);
  pmCtx.fillStyle = '#f5ead6';
  pmCtx.fillRect(0, 0, 128, 128);
  pmCtx.fillStyle = 'rgba(205, 168, 124, 0.35)';
  for (let x = 0; x < 128; x += 8) {
    pmCtx.fillRect(x, 0, 3, 128);
  }
  for (let y = 0; y < 128; y += 8) {
    pmCtx.fillRect(0, y, 128, 3);
  }
  pmCtx.strokeStyle = '#c2410c';
  pmCtx.lineWidth = 4;
  pmCtx.strokeRect(4, 4, 120, 120);
  const placematMap = finalizeColorTex(pmCanvas, maxAniso);

  return {
    mucosaMap,
    mucosaBump,
    tongueMap,
    acidMap,
    contactShadow,
    bunMap,
    pattyMap,
    appleMap,
    chickenMap,
    woodMap,
    placematMap,
    dispose: () => {
      mucosaMap.dispose();
      mucosaBump.dispose();
      tongueMap.dispose();
      acidMap.dispose();
      contactShadow.dispose();
      bunMap.dispose();
      pattyMap.dispose();
      appleMap.dispose();
      chickenMap.dispose();
      woodMap.dispose();
      placematMap.dispose();
    },
  };
}
