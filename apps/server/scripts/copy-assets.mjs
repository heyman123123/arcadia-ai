/**
 * Build-time asset copy
 *
 * 干一件事:把 src/ 里需要随产物一起发布到 dist/ 的非 TS 资源拷过去。
 * 目前只有 SQL migration 文件(`infrastructure/db/migrations/*.sql`)。
 *
 * 不在 tsc 配置里管是因为 tsc 默认不复制非 .ts 资产,
 * 引入额外 plugin(cpx / copy-webpack-plugin)只为几行 SQL 不值。
 *
 * 跑法:`pnpm build` 里的 postbuild 自动调;也可手动:
 *   node scripts/copy-assets.mjs
 */

import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..'); // apps/server

const assets = [
  { from: 'src/infrastructure/db/migrations', to: 'dist/infrastructure/db/migrations' },
];

let copied = 0;
for (const { from, to } of assets) {
  const fromAbs = path.join(root, from);
  if (!existsSync(fromAbs)) {
    console.warn(`[copy-assets] skip ${from} (not found)`);
    continue;
  }
  cpSync(fromAbs, path.join(root, to), { recursive: true });
  console.log(`[copy-assets] ${from} → ${to}`);
  copied += 1;
}

if (copied === 0) {
  console.warn('[copy-assets] no assets copied (none of the source dirs exist yet)');
}
