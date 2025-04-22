# 開発実装フロー

## 1. 開発方針

- **MVPファースト**: まずは最小限の機能で動くものを作る
- **段階的実装**: 機能を小さく区切って段階的に実装
- **継続的なテスト**: 各機能実装後のテストを徹底

## 2. 環境構築フェーズ

### 2.1 バックエンド環境

1. **Supabase プロジェクト作成**
   - プロジェクト名: gijirokun
   - リージョン: Tokyo (ap-northeast-1)
   - 無料プラン選択

2. **認証設定**
   - Google Provider 設定
   - リダイレクトURL設定

3. **データベーステーブル作成**
   ```sql
   -- ユーザーテーブル
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     display_name TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- 議事録テーブル
   CREATE TABLE meetings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id) NOT NULL,
     title TEXT NOT NULL,
     audio_url TEXT,
     input_type TEXT NOT NULL,
     status TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- 文字起こしテーブル
   CREATE TABLE transcriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     meeting_id UUID REFERENCES meetings(id) NOT NULL,
     content TEXT NOT NULL,
     is_direct_input BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- 要約テーブル
   CREATE TABLE summaries (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     meeting_id UUID REFERENCES meetings(id) NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **RLS ポリシー設定**
   ```sql
   -- ユーザーテーブル
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "ユーザーは自分のデータのみ参照可能" ON users
     FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "ユーザーは自分のデータのみ更新可能" ON users
     FOR UPDATE USING (auth.uid() = id);
   
   -- 議事録テーブル
   ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "ユーザーは自分の議事録のみ参照可能" ON meetings
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "ユーザーは自分の議事録のみ作成可能" ON meetings
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "ユーザーは自分の議事録のみ更新可能" ON meetings
     FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "ユーザーは自分の議事録のみ削除可能" ON meetings
     FOR DELETE USING (auth.uid() = user_id);
   
   -- 文字起こしテーブル
   ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "transcriptions_select_policy" ON transcriptions
     FOR SELECT USING (
       auth.uid() IN (
         SELECT user_id FROM meetings WHERE id = meeting_id
       )
     );
   
   -- 要約テーブル
   ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "summaries_select_policy" ON summaries
     FOR SELECT USING (
       auth.uid() IN (
         SELECT user_id FROM meetings WHERE id = meeting_id
       )
     );
   ```

5. **Storage バケット設定**
   - `audio`: 音声ファイル保存用
   - RLSポリシー設定

### 2.2 フロントエンド環境

1. **Next.js プロジェクト作成**
   ```bash
   npx create-next-app@latest gijirokun --typescript --eslint --tailwind --app --src-dir
   cd gijirokun
   ```

2. **依存パッケージインストール**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install react-hook-form zod @hookform/resolvers
   npm install tailwindcss @tailwindcss/forms daisyui
   ```

3. **環境変数設定**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 3. 機能実装フェーズ（優先順位順）

### 3.1 認証機能（第1優先）

1. **認証コンポーネント実装**
   - ログインページ
   - GoogleログインUI
   - ログアウト機能

2. **認証ミドルウェア実装**
   - 認証状態保持
   - 保護ルート設定

### 3.2 音声・テキスト入力機能（第2優先）

1. **入力UI実装**
   - 音声アップロードコンポーネント
   - テキスト入力フォーム
   - 処理状態表示

2. **Edge Functions実装**
   - 音声変換処理
   - AssemblyAI API連携

### 3.3 議事録一覧・詳細機能（第3優先）

1. **一覧ページ実装**
   - 議事録カード表示
   - ソート・フィルター機能
   - ページネーション

2. **詳細ページ実装**
   - 文字起こし・要約表示
   - 音声再生機能
   - 編集・削除機能

### 3.4 要約生成機能（第4優先）

1. **Gemini API連携**
   - Edge Function実装
   - プロンプト設定
   - エラーハンドリング

2. **要約表示UI**
   - 要約タブ実装
   - コピー機能
   - エクスポート機能

## 4. テスト・最適化フェーズ

1. **テスト実装**
   - ユニットテスト
   - インテグレーションテスト
   - E2Eテスト

2. **パフォーマンス最適化**
   - コード分割
   - キャッシュ戦略

3. **UX改善**
   - ローディング状態
   - エラーハンドリング
   - フィードバック機能

## 5. デプロイフェーズ

1. **Vercelデプロイ**
   - GitHubレポジトリ連携
   - 環境変数設定
   - ドメイン設定

2. **継続的デプロイ設定**
   - デプロイプレビュー
   - ブランチデプロイ
   - デプロイアラート

## 6. マイルストーン

1. **M1: 基盤構築** (1週目)
   - Supabase・Next.js環境構築
   - 認証機能実装

2. **M2: コア機能** (2-3週目)
   - 音声・テキスト入力機能
   - 一覧・詳細表示機能

3. **M3: 高度機能** (4週目)
   - 要約生成機能
   - UX改善

4. **M4: 完成・公開** (5週目)
   - テスト・最適化
   - デプロイ・公開 