import sharp from 'sharp';

// Restrict libvips before inspecting any upload, including disguised SVG/TIFF.
sharp.block({ operation: ['VipsForeignLoad'] });
sharp.unblock({ operation: ['VipsForeignLoadJpegBuffer', 'VipsForeignLoadPngBuffer', 'VipsForeignLoadWebpBuffer', 'VipsForeignLoadHeifBuffer'] });

/** @param {Buffer} bytes */
export async function normalizeProductImage(bytes) {
  return sharp(bytes, { limitInputPixels: 25000000, failOn: 'warning' })
    .rotate()
    .webp({ quality: 90 })
    .toBuffer();
}
