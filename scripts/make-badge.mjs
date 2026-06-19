// Generates public/badge-96.png — a monochrome, transparent badge for Android's
// status-bar notification icon (the OS fills the alpha mask white, so the source
// must be a white-on-transparent silhouette, not the full-color logo).
import sharp from 'sharp'

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <path fill="#ffffff" fill-rule="evenodd"
    d="M48 16 L84 48 H74 V82 H54 V60 H42 V82 H22 V48 H12 Z
       M54 50 H66 V62 H54 Z" />
</svg>`

await sharp(Buffer.from(svg)).png().toFile('public/badge-96.png')
console.log('wrote public/badge-96.png')
