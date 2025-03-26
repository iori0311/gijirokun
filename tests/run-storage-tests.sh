#!/bin/bash

set -e

# 色付きの出力用の関数
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# デバッグ情報の表示
yellow "Debug: Current working directory and files"
pwd
find . -name "*.test.ts" -type f
yellow "Debug: Test file location check"
if [ -f "./tests/integration/storage/storage.test.ts" ]; then
    yellow "Test file exists at expected path"
else
    red "Test file not found at expected path"
    exit 1
fi

yellow "Debug: Environment variables"
env | grep -E "SUPABASE|TEST"

# Supabaseの状態確認
yellow "Checking Supabase services..."
supabase status

# 停止しているサービスがあれば再起動
if supabase status | grep -q "Stopped services"; then
    yellow "Some services are stopped. Attempting restart..."
    supabase stop || true  # stopが失敗しても続行
    sleep 2
    supabase start
    sleep 5  # 起動を待つ
fi

# データベース接続の確認（実際の出力に合わせて修正）
yellow "Checking database connection..."
if supabase status | grep -q "DB URL: .*54322/postgres"; then
    yellow "Database connection confirmed"
else
    red "Database connection not found"
    supabase status  # 詳細な状態を表示
    exit 1
fi

# テストファイルの場所を考慮してテストを実行
yellow "Running storage tests with verbose output..."
cd /home/runner/work/gijirokun/gijirokun  # 明示的にディレクトリを指定
DEBUG=vite:* VITEST_LOG_LEVEL=debug npm run test:storage

# 終了コードの保存
test_status=$?

# 結果の表示
if [ $test_status -eq 0 ]; then
    green "🎉 All storage tests passed!"
else
    red "❌ Some storage tests failed"
    yellow "Debug: Final status check"
    supabase status
fi

exit $test_status 