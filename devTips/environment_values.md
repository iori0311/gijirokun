# 環境変数の継承の仕組み

## 基本的な動作

環境変数は、プロセスの階層構造に従って親プロセスから子プロセスへと自動的に継承されます。

例えば、以下のようなコマンド実行時：

```bash
SUPABASE_URL=${{ secrets.TEST_SUPABASE_URL }} SUPABASE_ANON_KEY=${{ secrets.TEST_SUPABASE_ANON_KEY }} ./tests/run-storage-tests.sh
```

環境変数は以下のように伝播します：

```
親プロセス（シェル）
SUPABASE_URL=xxx SUPABASE_ANON_KEY=yyy ./tests/run-storage-tests.sh
↓
run-storage-tests.sh（子プロセス）
↓
npm run test:storage（孫プロセス）
↓
Node.js実行環境（ひ孫プロセス）
```

## Node.jsでの環境変数の参照

Node.jsのプロセスでは、`process.env`オブジェクトを通じて環境変数にアクセスできます：

```typescript
// tests/integration/storage/storage.test.ts
const supabase = createClient(
  process.env.SUPABASE_URL ?? '',     // シェルから継承された環境変数
  process.env.SUPABASE_ANON_KEY ?? '' // シェルから継承された環境変数
);
```

## 重要なポイント

- 環境変数は親プロセスから子プロセスへ自動的に継承される
- 一度設定された環境変数は、その後に実行される全てのコマンドで利用可能
- 子プロセスで環境変数を変更しても、親プロセスには影響しない
- Node.jsの`process.env`は、プロセス起動時点での環境変数を参照できる

## 実践的な使用例

1. テスト実行時の環境変数設定：
```bash
# シェルスクリプトで環境変数を設定しながらテストを実行
SUPABASE_URL=xxx SUPABASE_ANON_KEY=yyy ./tests/run-storage-tests.sh
```

2. GitHub Actionsでの環境変数設定：
```yaml
# .github/workflows/test.yml
env:
  SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
```

このような環境変数の継承の仕組みにより、アプリケーションの設定を柔軟に管理することができます。 