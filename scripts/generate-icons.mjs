/**
 * Genera via codice le icone della PWA: nessuna immagine scaricata dal web.
 * Icona gialla (marchio FitExpress) con il logogramma "MR" in giallo su
 * targhetta nera. Le lettere sono disegnate con tracciati vettoriali, così
 * non serve nessun font installato.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public');
mkdirSync(out, { recursive: true });

const GIALLO = '#FFD400';
const GIALLO_CHIARO = '#FFE979';
const NERO = '#111111';

/** Logogramma "MR" disegnato con tracciati (M spezzata + R con occhiello). */
const monogram = (stroke) => `
  <g fill="none" stroke="${stroke}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
    <path d="M130 330 L130 196 L191 272 L252 196 L252 330" />
    <path d="M292 330 L292 196" />
    <path d="M292 196 H338 a38 38 0 0 1 0 76 H292" />
    <path d="M330 272 L382 330" />
  </g>`;

const svg = ({ radius, plaque }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GIALLO_CHIARO}"/>
      <stop offset="55%" stop-color="${GIALLO}"/>
      <stop offset="100%" stop-color="#F2C200"/>
    </linearGradient>
    <linearGradient id="lucido" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="${radius}" fill="url(#g)"/>
  <rect x="0" y="0" width="512" height="300" rx="${radius}" fill="url(#lucido)"/>
  <rect x="${plaque.x}" y="${plaque.y}" width="${plaque.w}" height="${plaque.h}" rx="${plaque.r}" fill="${NERO}"/>
  ${monogram(GIALLO)}
</svg>`;

const plaque = { x: 84, y: 148, w: 344, h: 230, r: 62 };
const standard = svg({ radius: 114, plaque });
const maskable = svg({ radius: 0, plaque });

const png = async (svgText, size, file) => {
  await sharp(Buffer.from(svgText)).resize(size, size).png().toFile(resolve(out, file));
  console.log('✓', file, size);
};

writeFileSync(resolve(out, 'favicon.svg'), standard.trim() + '\n');
await png(standard, 192, 'icon-192.png');
await png(standard, 512, 'icon-512.png');
await png(standard, 180, 'apple-touch-icon.png');
await png(maskable, 512, 'icon-maskable-512.png');
console.log('✓ favicon.svg');
