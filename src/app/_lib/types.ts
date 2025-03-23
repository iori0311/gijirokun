/**
 * ファイル種別を表す型
 */
export type FileType = 'audio' | 'text';

/**
 * ファイル処理状態を表す型
 */
export type ProcessingStatus = 
  | 'pending'       // 処理待ち
  | 'converting'    // MP3変換中
  | 'transcribing'  // 文字起こし中
  | 'summarizing'   // 要約中
  | 'completed'     // 完了
  | 'error'         // エラー発生
;

/**
 * ユーザーモデル
 */
export interface User {
  id: string;            // ユーザーID (Cognito ID)
  email: string;         // メールアドレス
  name?: string;         // 表示名
  createdAt: string;     // 作成日時
  updatedAt: string;     // 更新日時
  preferences?: {        // ユーザー設定
    language?: string;   // 言語設定 (ja, en, etc.)
    theme?: 'light' | 'dark' | 'system'; // テーマ設定
    summarizationPrompt?: string; // 要約時の独自プロンプト
  };
}

/**
 * 認証関連の型
 */
export interface AuthState {
  isAuthenticated: boolean;    // 認証済みかどうか
  isLoading: boolean;          // 認証情報読み込み中かどうか
  user: User | null;           // ユーザー情報
}

/**
 * 議事録エントリのベースモデル
 */
export interface RecordingBase {
  id: string;                  // ユニークID
  userId: string;              // 所有ユーザーID
  title: string;               // タイトル
  description?: string;        // 説明（オプション）
  status: ProcessingStatus;    // 処理状態
  fileType: FileType;          // ファイル種別
  createdAt: string;           // 作成日時
  updatedAt: string;           // 更新日時
  tags?: string[];             // タグ（オプション）
}

/**
 * 音声ファイルから作成された議事録
 */
export interface AudioRecording extends RecordingBase {
  fileType: 'audio';
  originalFileKey: string;     // オリジナルファイルのS3キー
  originalFileName: string;    // オリジナルのファイル名
  mp3FileKey?: string;         // 変換後MP3のS3キー
  duration?: number;           // 音声の長さ（秒）
  transcriptionKey?: string;   // 文字起こしテキストのS3キー
  summaryKey?: string;         // 要約テキストのS3キー
  speakerCount?: number;       // 話者の数（オプション）
}

/**
 * テキストファイルから作成された議事録
 */
export interface TextRecording extends RecordingBase {
  fileType: 'text';
  originalFileKey: string;     // オリジナルテキストファイルのS3キー
  originalFileName: string;    // オリジナルのファイル名
  summaryKey?: string;         // 要約テキストのS3キー
}

/**
 * 議事録の共通型（音声またはテキスト）
 */
export type Recording = AudioRecording | TextRecording;

/**
 * S3アップロード用の署名付きURL情報
 */
export interface SignedUrlResponse {
  signedUrl: string;
  key: string;
  fileId: string;              // クライアント側でファイルIDを追跡するため
}

/**
 * ファイルアップロード時のメタデータ
 */
export interface FileUploadMetadata {
  title: string;
  description?: string;
  tags?: string[];
  fileType: FileType;
}

/**
 * AssemblyAIへのリクエストモデル
 */
export interface TranscriptionRequest {
  audio_url: string;           // 音声ファイルのURL
  language_code?: string;      // 言語コード（デフォルト: 'ja'）
  webhook_url?: string;        // コールバックURL
  metadata?: Record<string, string>; // カスタムメタデータ
}

/**
 * AssemblyAIからのレスポンスモデル
 */
export interface TranscriptionResponse {
  id: string;                  // トランスクリプションID
  status: string;              // ステータス
  text?: string;               // 文字起こしテキスト
  error?: string;              // エラーメッセージ
}

/**
 * Geminiへのリクエストモデル
 */
export interface SummaryRequest {
  text: string;                // 要約対象テキスト
  max_length?: number;         // 最大文字数
  language?: string;           // 出力言語（デフォルト: 'ja'）
}

/**
 * Geminiからのレスポンスモデル
 */
export interface SummaryResponse {
  summary: string;             // 要約テキスト
  error?: string;              // エラーメッセージ
} 