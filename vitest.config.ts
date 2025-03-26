import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'
import fs from 'fs'

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
    globalSetup: './tests/set-up/global-setup.ts'
  }
}) 