# 議事録自動作成サーバレスWebアプリ Gijirokun 要件定義ドキュメント

## 1. プロジェクト概要

- **目的:**  
  会議や打合せの議事録を自動で生成し、クラウドに保存・閲覧可能なWebアプリケーションを構築する。  
- **利用想定:**  
  主に個人利用を想定し、低コストかつ簡易に運用可能なサーバレスアーキテクチャで実装する。  
- **主要機能:**  
  - 音声ファイル（.m4a, .mp3等）のアップロード  
  - アップロードされた音声ファイルをMP3形式に統一するコンバート処理  
  - AssemblyAI API を利用した Speech to Text による文字起こし  
  - Google Gemini APIを利用したテキスト要約生成  
  - 原文（文字起こし）と要約の閲覧機能  
  - ユーザー認証 (Supabase Auth を利用)

## 2. システムアーキテクチャ

### フロントエンド
- フレームワーク: React / Next.js（App Router、TypeScript）
- SSRとSSGの併用、最新の公式ベストプラクティスに基づいた設計
- ユーザーインターフェースでのファイルアップロード、要約/全文表示、ログイン機能を提供
- Supabase Client SDKを利用した認証・データ操作

### バックエンド
- Supabase Platform
  - Auth：ユーザー認証・セッション管理
  - Storage：音声ファイル・文字起こしデータの保存
  - Database：PostgreSQLによる議事録メタ情報の管理
  - Edge Functions：音声変換処理、API連携（FFmpeg、Gemini API）
  - Row Level Security：データアクセス制御
- リアルタイムサブスクリプション機能による処理状態の即時反映

### 外部API
- AssemblyAI API: 音声 -> テキスト の処理を担当
- Google Gemini API：テキスト → 要約 の処理を担当

## 3. 機能要件

- ユーザーは認証後、音声ファイルをアップロード
- 音声ファイルはEdge FunctionでMP3に変換後、AssemblyAIに渡して文字起こし
- Geminiで要約も実施
- テキストデータのアップロード・要約も可能
- 全文・要約データはSupabase Storage/Databaseに保存され、UIで閲覧可能

## 4. 非機能要件

### 4.1 パフォーマンス要件
- ページロード時間：First Contentful Paint 1.5秒以内
- 音声ファイルアップロード：50MB以下のファイルに対応
- 文字起こし処理：5分以内に完了（30分の音声ファイルの場合）
- API レスポンスタイム：95%のリクエストで2秒以内
- SSG/ISRの活用による高速なページ表示

### 4.2 セキュリティ要件
- Supabase RLSによるデータアクセス制御
- 音声ファイルの暗号化保存
- JWT認証によるAPIアクセス制御
- 環境変数による機密情報の管理
- CSRFトークンによる保護
- HTTPSの強制

### 4.3 可用性要件
- サービス稼働率：99.9%
- バックアップ：日次でデータベースバックアップ
- 障害復旧時間：RTO 4時間以内
- エッジロケーションの活用による低レイテンシー

### 4.4 運用保守要件
- ログ収集・監視
  - アプリケーションログ
  - アクセスログ
  - エラーログ
  - パフォーマンスメトリクス
- アラート通知
  - エラー率閾値超過時
  - レスポンスタイム悪化時
  - ストレージ使用量閾値超過時
- コスト管理
  - API使用量の監視
  - ストレージ使用量の監視
  - 無料枠の利用状況モニタリング

### 4.5 拡張性要件
- マイクロサービスアーキテクチャの採用
- 疎結合な設計によるサービス間の独立性確保
- APIバージョニング対応
- 将来的なRAG実装を考慮したデータ構造

### 4.6 ユーザビリティ要件
- レスポンシブデザイン対応（モバイルファースト）
- 処理状態のリアルタイム表示
- 直感的なUI/UX
- アクセシビリティ対応（WCAG 2.1準拠）
- 多言語対応を考慮した設計

### 4.7 コンプライアンス要件
- 個人情報保護法への対応
- プライバシーポリシーの整備
- 利用規約の整備
- オープンソースライセンスの管理

### 4.8 開発環境要件
- TypeScriptによる型安全な開発
- ESLint/Prettierによるコード品質管理
- Jestによるユニットテスト
- Playwrightによるe2eテスト
- CIによる自動テスト・デプロイ
- GitHubフローによる開発プロセス

## 5. 将来の拡張（RAG）

- レスポンシブ対応し、スマートフォンからのアクセスでも使いやすいUIにする。
- PostgreSQLのpgvector拡張を利用した類似検索（RAG）の実装
- Supabase Database Functions/Webhooksを活用した自動処理の拡張

## 6. システム処理フロー

1. 認証（Supabase Auth）
2. 音声アップロード（Supabase Storage）
3. Edge Functionで変換＆Gemini呼び出し
4. 結果保存（Storage/Database）
5. リアルタイム更新でUI反映

## 7. 注意点・課題

- Gemini API の料金管理
- Supabase無料枠の利用状況モニタリング
- Edge Functions実行時間と処理サイズ制限の考慮
- RLSポリシーの適切な設定
- ストレージ使用量の最適化

