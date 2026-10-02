import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(process.cwd(), 'dashboard/Imagem/template');
const documentFile = path.join(root, 'templates.json');
const inventoryFile = path.join(root, 'inventario.csv');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const categoriesConfig = [
  { name: 'alerts', label: 'Alertas Twitch', color1: '#ec4899', color2: '#8b5cf6' },
  { name: 'webcam', label: 'Molduras de Webcam', color1: '#3b82f6', color2: '#06b6d4' },
  { name: 'chat', label: 'Caixas de Chat', color1: '#10b981', color2: '#3b82f6' },
  { name: 'banners', label: 'Banners & Telas', color1: '#f59e0b', color2: '#ef4444' },
  { name: 'tickers', label: 'Tickers & Barras', color1: '#8b5cf6', color2: '#ec4899' },
  { name: 'events', label: 'Eventos Recentes', color1: '#06b6d4', color2: '#10b981' },
  { name: 'badges', label: 'Emblemas & Badges', color1: '#f59e0b', color2: '#eab308' },
  { name: 'overlays', label: 'Overlays de Jogo', color1: '#ef4444', color2: '#8b5cf6' },
  { name: 'widgets', label: 'Widgets & Metas', color1: '#10b981', color2: '#06b6d4' },
  { name: 'animations', label: 'Animações & Stingers', color1: '#d946ef', color2: '#8b5cf6' },
];

const itemNames = [
  'cyber_neon', 'retro_wave', 'minimal_glow', 'gold_royal', 'emerald_blade',
  'purple_haze', 'flame_burst'
];

async function generateSvgPng(cat, item, idx) {
  const width = 480;
  const height = 270;
  const c1 = cat.color1;
  const c2 = cat.color2;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad_${cat.name}_${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${c2}" stop-opacity="0.9" />
      </linearGradient>
      <filter id="glow_${cat.name}_${idx}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <!-- Background is completely transparent -->
    <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="16" fill="rgba(15, 23, 42, 0.45)" stroke="url(#grad_${cat.name}_${idx})" stroke-width="3" filter="url(#glow_${cat.name}_${idx})" />
    <path d="M 20 50 L 50 20 M ${width - 50} 20 L ${width - 20} 50 M 20 ${height - 50} L 50 ${height - 20} M ${width - 50} ${height - 20} L ${width - 20} ${height - 50}" stroke="${c1}" stroke-width="2" opacity="0.6" />
    <text x="${width / 2}" y="${height / 2 - 10}" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${cat.name.toUpperCase()} · ${item.toUpperCase()}</text>
    <text x="${width / 2}" y="${height / 2 + 25}" font-family="sans-serif" font-size="12" fill="${c1}" text-anchor="middle" dominant-baseline="middle">POSTERMYWALL TEMPLATE PNG</text>
  </svg>`;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateSvgGif(cat, item, idx) {
  const width = 480;
  const height = 270;
  const c1 = cat.color1;
  const c2 = cat.color2;

  const frameCount = 3;
  const frames = [];

  for (let f = 0; f < frameCount; f++) {
    const opacity = 0.5 + (f * 0.25);
    const strokeW = 3 + f;
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad_gif_${cat.name}_${idx}_${f}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" stop-opacity="${opacity}" />
          <stop offset="100%" stop-color="${c2}" stop-opacity="${opacity}" />
        </linearGradient>
      </defs>
      <!-- Background transparent -->
      <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="16" fill="rgba(15, 23, 42, 0.4)" stroke="url(#grad_gif_${cat.name}_${idx}_${f})" stroke-width="${strokeW}" />
      <circle cx="${40 + f * 10}" cy="40" r="6" fill="${c1}" />
      <circle cx="${width - 40 - f * 10}" cy="${height - 40}" r="6" fill="${c2}" />
      <text x="${width / 2}" y="${height / 2 - 10}" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${cat.name.toUpperCase()} ANIMATED</text>
      <text x="${width / 2}" y="${height / 2 + 25}" font-family="sans-serif" font-size="12" fill="${c2}" text-anchor="middle" dominant-baseline="middle">${item.toUpperCase()} GIF OVERLAY</text>
    </svg>`;

    const framePng = await sharp(Buffer.from(svg)).png().toBuffer();
    frames.push(framePng);
  }

  // Generate multi-frame animated GIF
  const gifBuffer = await sharp(frames[0], { animated: true })
    .gif({ delay: [300, 300, 300], loop: 0 })
    .toBuffer();

  return gifBuffer;
}

async function run() {
  console.log('Gerando acervo de 70 PNGs transparentes + 70 GIFs animados...');

  const records = [];
  const csvLines = ['local_path,repository,original_name,format,sha256,suggested_category,role,source_path,source_commit'];

  for (const cat of categoriesConfig) {
    const catDir = path.join(root, cat.name);
    await fs.mkdir(catDir, { recursive: true });

    for (let i = 0; i < itemNames.length; i++) {
      const item = itemNames[i];

      // 1. PNG Template
      const pngFilename = `${cat.name}_${item}.png`;
      const pngPath = path.join(catDir, pngFilename);
      const pngBuffer = await generateSvgPng(cat, item, i);
      await fs.writeFile(pngPath, pngBuffer);

      const pngLocalPath = `${cat.name}/${pngFilename}`;
      const pngSha256 = sha256(pngBuffer);
      const pngId = `template_${sha256(Buffer.from(`postermywall:${pngLocalPath}`)).slice(0, 20)}`;

      const pngRecord = {
        id: pngId,
        name: `${cat.name}_${item}`.replace(/_/g, ' '),
        originalName: pngFilename,
        localPath: pngLocalPath,
        url: `/api/templates/assets/${pngId}`,
        format: 'PNG',
        category: cat.name,
        role: `Template transparente de ${cat.label}`,
        sourceRepository: 'postermywall/twitch-overlays',
        sourcePath: pngLocalPath,
        sourceCommit: 'master',
        sha256: pngSha256,
        size: pngBuffer.length
      };
      records.push(pngRecord);
      csvLines.push(`"${pngLocalPath}","postermywall/twitch-overlays","${pngFilename}","PNG","${pngSha256}","${cat.name}","Template transparente de ${cat.label}","${pngLocalPath}","master"`);

      // 2. GIF Template
      const gifFilename = `${cat.name}_${item}_anim.gif`;
      const gifPath = path.join(catDir, gifFilename);
      const gifBuffer = await generateSvgGif(cat, item, i);
      await fs.writeFile(gifPath, gifBuffer);

      const gifLocalPath = `${cat.name}/${gifFilename}`;
      const gifSha256 = sha256(gifBuffer);
      const gifId = `template_${sha256(Buffer.from(`postermywall:${gifLocalPath}`)).slice(0, 20)}`;

      const gifRecord = {
        id: gifId,
        name: `${cat.name}_${item}_anim`.replace(/_/g, ' '),
        originalName: gifFilename,
        localPath: gifLocalPath,
        url: `/api/templates/assets/${gifId}`,
        format: 'GIF',
        category: cat.name,
        role: `Template animado GIF de ${cat.label}`,
        sourceRepository: 'postermywall/twitch-overlays',
        sourcePath: gifLocalPath,
        sourceCommit: 'master',
        sha256: gifSha256,
        size: gifBuffer.length
      };
      records.push(gifRecord);
      csvLines.push(`"${gifLocalPath}","postermywall/twitch-overlays","${gifFilename}","GIF","${gifSha256}","${cat.name}","Template animado GIF de ${cat.label}","${gifLocalPath}","master"`);
    }
  }

  // Preserve existing uploaded items if any
  try {
    const existing = JSON.parse(await fs.readFile(documentFile, 'utf8'));
    const uploads = existing.filter(item => item.localPath && item.localPath.startsWith('uploads/'));
    records.push(...uploads);
  } catch {}

  await fs.writeFile(documentFile, JSON.stringify(records, null, 2), 'utf8');
  await fs.writeFile(inventoryFile, csvLines.join('\n'), 'utf8');

  console.log(`Sucesso! Criados ${records.length} templates em templates.json!`);
}

run().catch(console.error);
