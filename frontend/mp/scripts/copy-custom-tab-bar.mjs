import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'native', 'custom-tab-bar')
const targets = [
  join(root, 'dist', 'build', 'mp-weixin', 'custom-tab-bar'),
  join(root, 'dist', 'dev', 'mp-weixin', 'custom-tab-bar'),
]

for (const to of targets) {
  mkdirSync(dirname(to), { recursive: true })
  rmSync(to, { recursive: true, force: true })
  cpSync(from, to, { recursive: true })
}

console.log('custom-tab-bar copied')
