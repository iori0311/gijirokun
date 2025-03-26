#!/bin/bash

set -e

# 色付きの出力用の関数
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# Supabaseの状態確認
yellow "Checking Supabase services..."
supabase status

# 停止しているサービスがあれば再起動
if supabase status | grep -q "Stopped services"; then
  yellow "Some services are stopped. Restarting Supabase..."
  supabase stop
  supabase start
fi

# テストの実行
yellow "Running storage tests..."
npm run test:storage

# 終了コードの保存
test_status=$?

# 結果の表示
if [ $test_status -eq 0 ]; then
  green "🎉 All storage tests passed!"
else
  red "❌ Some storage tests failed"
fi

exit $test_status 