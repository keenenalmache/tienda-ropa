import sharp from 'sharp';

for (const f of ['personaje-grande', 'personaje-grande-dia']) {
  await sharp(`public/${f}.png`)
    .resize({ width: 1100, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`public/${f}.webp`);
  console.log('listo', f);
}