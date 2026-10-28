import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'native', 'custom-tab-bar')
const targets = [
  join(root, 'dist', 'build', 'mp-weixin'),
  join(root, 'dist', 'dev', 'mp-weixin'),
]

for (const dist of targets) {
  const tabBarTo = join(dist, 'custom-tab-bar')
  mkdirSync(dirname(tabBarTo), { recursive: true })
  rmSync(tabBarTo, { recursive: true, force: true })
  if (existsSync(from)) {
    cpSync(from, tabBarTo, { recursive: true })
  }
  // 关闭热重载，避免开发者工具报 appLaunch with non-empty page stack
  writeFileSync(
    join(dist, 'project.private.config.json'),
    `${JSON.stringify(
      {
        libVersion: '3.5.5',
        projectname: 'our-pact',
        setting: {
          urlCheck: false,
          compileHotReLoad: false,
          skylineRenderEnable: false,
        },
      },
      null,
      2,
    )}\n`,
  )
  const configPath = join(dist, 'project.config.json')
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'))
      config.setting = {
        ...(config.setting || {}),
        urlCheck: false,
        compileHotReLoad: false,
      }
      if (!config.libVersion) {
        config.libVersion = '3.5.5'
      }
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
    } catch {
      // 忽略配置修补失败
    }
  }
}

console.log('custom-tab-bar copied; hot reload disabled')
