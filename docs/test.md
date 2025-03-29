# Gijirokun テスト戦略

## 概要

Gijirokuのテスト戦略は、複数のレベルと種類のテストを組み合わせて、アプリケーションの品質を確保します。このドキュメントでは、テストの種類、実行方法、CI/CDパイプラインでの統合方法について説明します。

## テストの種類

### 1. 単体テスト (Unit Tests)
- **目的**: 個々のコンポーネントや関数が期待通りに動作することを確認
- **ツール**: Vitest
- **場所**: `tests/unit/`

### 2. 統合テスト (Integration Tests)
- **目的**: 複数のコンポーネントが連携して動作することを確認
- **種類**:
  - **データベーステスト**: Supabaseデータベースとの連携テスト
  - **ストレージテスト**: ファイル保存機能のテスト
  - **認証テスト**: ユーザー認証機能のテスト
- **ツール**: Vitest + Supabase Local Development
- **場所**: `tests/integration/`

### 3. E2Eテスト (将来予定)
- **目的**: ユーザー視点でのエンドツーエンドの機能確認
- **ツール**: Playwright (将来的に導入予定)
- **場所**: `tests/e2e/`

## テストの実行方法

### ローカル環境での実行

```bash
# データベーステストの実行
./tests/run-db-tests.sh

# ストレージテストの実行
./tests/run-storage-tests.sh

# 特定の統合テストの実行
npm run test:storage
npm run test:db
npm run test:auth
```

### 前提条件
- Supabase CLIがインストールされていること
- Node.jsとnpmがインストールされていること

## CI/CDパイプライン

GitHub Actionsを使用して、PRごとに自動的にテストを実行します。

### テスト戦略

1. **機能ごとのテストワークフロー**
   - 各機能（データベース、ストレージ、認証など）ごとに独立したワークフローファイルを作成
   - `.github/workflows/` ディレクトリに配置
   - 例: `db-tests.yml`, `storage-tests.yml`, `auth-tests.yml`

2. **パス依存テスト実行**
   - 関連するファイルが変更された場合のみ、該当するテストを実行
   - 不要なテスト実行を避け、CI/CDパイプラインの効率化を図る

3. **テスト結果の可視化**
   - テスト結果をPRにコメントとして自動投稿
   - エラー発生時の詳細情報を提供

### ワークフロー構成例

```yaml
name: Storage Tests

on:
  pull_request:
    paths:
      - 'app/storage/**'
      - 'tests/integration/storage/**'
    branches: [ main ]

jobs:
  storage-test:
    runs-on: ubuntu-latest
    steps:
      # テスト実行ステップ
```

## テスト環境のセットアップ

各テストでは、Supabase Local Developmentを使用して、独立したテスト環境を作成します。

1. **データベースリセット**: `supabase db reset --no-seed`
2. **テストユーザー作成**: テスト用の固定ユーザーを作成
3. **テストデータ投入**: SQL実行によるテストデータの投入
4. **リソース作成**: バケットなどのリソースを作成

## 今後の展望

1. **テストカバレッジの向上**: 主要機能のテストカバレッジを80%以上を目指す
2. **E2Eテストの導入**: ユーザーシナリオベースのテスト自動化
3. **パフォーマンステスト**: 負荷テストの導入検討