import sharp from 'sharp';
import { readdirSync } from 'fs';

const carpeta = 'public/fondo';
for (const f of readdirSync(carpeta)) {
  if (!f.endsWith('.png')) continue;
  const ancho = f.startsWith('ladrillos') ? 600 : 900;
  await sharp(`${carpeta}/${f}`)
    .resize({ width: ancho, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(`${carpeta}/${f.replace('.png', '.webp')}`);
  console.log('listo', f);
}