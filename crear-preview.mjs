import sharp from 'sharp';

await sharp('public/personaje-grande-dia.webp')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82 })
  .toFile('public/preview.jpg');
console.log('listo');