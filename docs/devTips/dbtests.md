# データベーステストのガイド

## 概要
このドキュメントでは、Gijirokun プロジェクトにおけるデータベーステストの実装方法と、関連するベストプラクティスについて説明します。

## テスト構成

### 1. テストの種類
- **CRUD テスト**: 基本的なデータ操作の検証
- **RLS テスト**: Row Level Security ポリシーの検証
- **制約テスト**: 外部キー制約とカスケード削除の検証

### 2. ファイル構成
```
tests/
├── integration/
│   └── db/
│       ├── crud.test.sql
│       ├── rls.test.sql
│       └── constraints.test.sql
├── format-results.js
└── run-db-tests.sh

supabase/
├── pre-seed.sql    # トリガー無効化とクリーンアップ
├── test-seed.sql   # テスト用データ
├── seed.sql        # 開発用データ
└── post-seed.sql   # トリガー再有効化
```

## テスト実行フロー

1. **データベースのリセット**
   ```bash
   supabase db reset
   ```

2. **テストデータの準備**
   ```bash
   # トリガーの無効化とクリーンアップ
   psql -f supabase/pre-seed.sql
   
   # テストデータの投入
   psql -f supabase/test-seed.sql
   
   # トリガーの再有効化
   psql -f supabase/post-seed.sql
   ```

3. **テストの実行**
   - 各SQLテストファイルを実行
   - 結果をJSONとして保存
   - マークダウン形式にフォーマット
   - GitHub PRにコメントとして投稿

## CI/CD 統合
GitHub Actionsを使用して、以下のタイミングでテストを自動実行：
- PRの作成時
- PRへのプッシュ時

## 参考文献
1. [Local development with schema migrations](https://supabase.com/docs/guides/local-development/overview)
2. [Database Migrations Guide](https://supabase.com/docs/guides/deployment/database-migrations)
3. [CLI Reference - DB Reset](https://supabase.com/docs/reference/cli/supabase-db-reset)
4. [Hacker Newsでのディスカッション](https://news.ycombinator.com/item?id=37072464)
5. [Supabase Reset Migrations Guide](https://www.restack.io/docs/supabase-knowledge-supabase-reset-migrations-guide)

## ベストプラクティス

### 1. テストデータの分離
- 開発用とテスト用のシードデータを分離
- テストは独立した`test-seed.sql`を使用

### 2. クリーンな状態の保証
- テスト実行前にデータベースをリセット
- トリガーの一時的な無効化でデータ投入を安全に

### 3. エラーハンドリング
- 期待されるエラーの明示的なテスト
- エラーコードの検証
- テスト結果の詳細なレポート

### 4. CI/CD との統合
- 自動テスト実行
- 結果の可視化
- PRへのフィードバック

## トラブルシューティング

### よくある問題と解決策
1. **重複キーエラー**
   - 原因: データベースリセットが不完全
   - 解決: pre-seed.sqlでの完全なクリーンアップ

2. **外部キー制約エラー**
   - 原因: データ投入順序の問題
   - 解決: 依存関係を考慮したシード順序の調整

3. **システムトリガーの権限エラー**
   - 原因: 外部キー制約のシステムトリガーに対する操作
   - 解決: このエラーは無視して問題なし（制約の整合性は保たれる）
   - メッセージ例: `ERROR: permission denied: "RI_ConstraintTrigger_..." is a system trigger`

4. **エラーコードの検出問題**
   - 原因: PostgreSQLのエラーメッセージフォーマットの違い
   - 解決: エラーメッセージのパターンマッチングを使用
   - 例: 外部キー制約エラー（23503）は`foreign key constraint`文字列で検出

### テストスクリプトのデバッグ
1. **エラー出力の確認**
   - `test_results/`ディレクトリ内の`.txt`ファイルでエラーの詳細を確認
   - JSONファイルで構造化されたテスト結果を確認

2. **ローカル環境での動作確認**
   - Supabase CLIはローカルテストではシークレット不要
   - `supabase start`で完全なローカル環境が構築される
   - デフォルト認証情報: `postgres:postgres@localhost:54322/postgres`

3. **複数のエラーテストの取り扱い**
   - 原因: 同一のテストファイル内で複数のエラーを期待する場合の結果取得
   - 解決: 
     - エラー結果を配列として保存
     - `EXPECTED_ERROR:`コメントとエラー出力を順序に基づいてマッチング
     - JSONレスポンスを`{"results": [{"status": "success", ...}, ...]}` 形式で構造化
   - 実装例:
     ```sql
     -- EXPECTED_ERROR:23503
     INSERT INTO transcriptions (...) VALUES (...);
     
     -- EXPECTED_ERROR:23503
     INSERT INTO summaries (...) VALUES (...);
     ``` 