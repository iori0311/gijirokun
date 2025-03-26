#!/bin/bash

set -e

# 色付きの出力用の関数
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# Supabaseの状態確認
yellow "Supabaseサービスの状態を確認中..."
supabase status

# 停止しているサービスがあれば再起動
if supabase status | grep -q "Stopped services"; then
    yellow "一部のサービスが停止しています。再起動を試みます..."
    supabase stop || true
    sleep 2
    supabase start
    sleep 5  # 起動を待つ
fi

# データベース接続の確認
yellow "データベース接続を確認中..."
if ! supabase status | grep -q "DB URL: .*54322/postgres"; then
    red "データベース接続が見つかりません"
    supabase status
    exit 1
fi

# ストレージテストの実行
yellow "ストレージテストを実行中..."
TEST_SUPABASE_URL="$TEST_SUPABASE_URL" TEST_SUPABASE_ANON_KEY="$TEST_SUPABASE_ANON_KEY" npm run test:storage

# 終了コードの保存
test_status=$?

# 結果の表示
if [ $test_status -eq 0 ]; then
    green "🎉 全てのストレージテストが成功しました！"
else
    red "❌ 一部のストレージテストが失敗しました"
fi

exit $test_status 