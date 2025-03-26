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
yellow "Debug: Environment variables"
env | grep -E "SUPABASE|TEST"

# Supabaseの状態確認
yellow "Checking Supabase services..."
supabase status

# 停止しているサービスがあれば再起動
if supabase status | grep -q "Stopped services"; then
  yellow "Some services are stopped. Restarting Supabase..."
  supabase stop
  supabase start
fi

# データベースの起動確認
yellow "Waiting for database to be ready..."
max_attempts=30
attempt=0
while ! supabase status | grep -q "Database online"; do
  if [ $attempt -eq $max_attempts ]; then
    red "Database failed to start after $max_attempts attempts"
    exit 1
  fi
  yellow "Waiting for database... (attempt $((attempt + 1))/$max_attempts)"
  sleep 2
  ((attempt++))
done

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