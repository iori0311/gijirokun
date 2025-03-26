import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

// テスト環境の環境変数を読み込む
dotenv.config({ path: '.env.test' })

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    globalSetup: './tests/set-up/global-setup.ts'
  }
}) 