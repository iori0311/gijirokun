#!/bin/bash

set -e

# テスト結果ディレクトリ
mkdir -p test_results

# 色付きの出力用の関数
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# テスト関数
run_test() {
  test_file=$1
  output_file=$2
  
  yellow "Running test: $test_file"
  
  # エラーメッセージをキャプチャしつつ実行
  PGPASSWORD=postgres psql -v ON_ERROR_STOP=off -h localhost -p 54322 -U postgres -d postgres -f "$test_file" > "$output_file" 2>&1
  
  # 結果を解析
  if grep -q "EXPECTED_ERROR:" "$output_file"; then
    error_code=$(grep "EXPECTED_ERROR:" "$output_file" | tail -n1 | cut -d':' -f2)
    if grep -q "ERROR:.*$error_code" "$output_file"; then
      green "✅ Test passed with expected error: $error_code"
      echo "{\"status\": \"success\", \"type\": \"expected_error\", \"error_code\": \"$error_code\"}" > "${output_file}.json"
      return 0
    else
      red "❌ Test failed: Expected error $error_code but got different error"
      echo "{\"status\": \"failure\", \"type\": \"wrong_error\", \"expected\": \"$error_code\"}" > "${output_file}.json"
      return 1
    fi
  elif grep -q "ERROR:" "$output_file"; then
    error_message=$(grep "ERROR:" "$output_file" | head -n1)
    red "❌ Test failed with unexpected error: $error_message"
    echo "{\"status\": \"failure\", \"type\": \"unexpected_error\", \"message\": \"$error_message\"}" > "${output_file}.json"
    return 1
  else
    green "✅ Test passed successfully"
    echo "{\"status\": \"success\", \"type\": \"normal\"}" > "${output_file}.json"
    return 0
  fi
}

# データベースリセット
yellow "Resetting database..."
supabase db reset

# シードデータ投入
yellow "Loading seed data..."
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql

# テストの実行
test_status=0

run_test "tests/integration/db/crud.test.sql" "test_results/crud.txt" || test_status=1
run_test "tests/integration/db/rls.test.sql" "test_results/rls.txt" || test_status=1
run_test "tests/integration/db/constraints.test.sql" "test_results/constraints.txt" || test_status=1

# 最終結果の出力
if [ $test_status -eq 0 ]; then
  green "🎉 All tests passed!"
else
  red "❌ Some tests failed"
fi

exit $test_status 