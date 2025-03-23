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
  errors=()
  error_count=0
  while IFS= read -r line; do
    if [[ $line =~ ^--[[:space:]]*EXPECTED_ERROR:([0-9]+) ]]; then
      expected_error="${BASH_REMATCH[1]}"
      # エラーメッセージを探す（error_countを使って対応するエラーを取得）
      error_line=$(grep -n "ERROR:" "$output_file" | sed -n "$((error_count+1))p" | cut -d':' -f2-)
      if [[ $error_line == *"foreign key constraint"* && $expected_error == "23503" ]]; then
        errors+=("{\"status\": \"success\", \"type\": \"expected_error\", \"error_code\": \"$expected_error\"}")
      else
        errors+=("{\"status\": \"failure\", \"type\": \"wrong_error\", \"expected\": \"$expected_error\", \"actual\": \"$error_line\"}")
      fi
      ((error_count++))
    fi
  done < "$test_file"

  if [ ${#errors[@]} -eq 0 ]; then
    if grep -q "ERROR:" "$output_file"; then
      error_message=$(grep "ERROR:" "$output_file" | head -n1)
      red "❌ Test failed with unexpected error: $error_message"
      echo "{\"status\": \"failure\", \"type\": \"unexpected_error\", \"message\": \"$error_message\"}" > "${output_file}.json"
      return 1
    else
      green "✅ Test passed successfully"
      echo "{\"status\": \"success\", \"type\": \"normal\"}" > "${output_file}.json"
      return 0
    fi
  else
    # 複数のエラー結果をJSONの配列として保存
    echo "{\"results\": [${errors[*]}]}" > "${output_file}.json"
    if grep -q "\"status\": \"failure\"" "${output_file}.json"; then
      red "❌ Some expected errors did not match"
      return 1
    else
      green "✅ All expected errors matched"
      return 0
    fi
  fi
}

# データベースリセット
yellow "Resetting database..."
supabase db reset

# テストデータの準備
yellow "Preparing test data..."
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f supabase/pre-seed.sql
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f supabase/test-seed.sql
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f supabase/post-seed.sql

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