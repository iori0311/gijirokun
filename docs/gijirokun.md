# 議事録自動作成サーバレスWebアプリ 要件定義ドキュメント

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

- Supabaseの無料枠を最大限活用
- TypeScriptによる型安全な開発
- セキュリティ（RLS、認証付きアクセス制御）
- パフォーマンス（SSGの活用、UIの応答性）
- リアルタイム更新によるUXの向上

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

