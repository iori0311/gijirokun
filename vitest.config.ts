import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// テスト環境の環境変数を読み込む（ファイルが存在する場合のみ）
if (fs.existsSync('.env.test')) {
  dotenv.config({ path: '.env.test' })
}

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/integration/storage/**/*.test.ts',
      '**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: ['node_modules', '.next', 'dist'],
    globals: true,
    root: '.',  // プロジェクトルートを明示的に指定
    resolveSnapshotPath: (testPath, snapExtension) => {
      return path.join(
        path.dirname(testPath),
        '__snapshots__',
        path.basename(testPath) + snapExtension
      )
    }
  }
}) 