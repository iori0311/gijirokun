# システムアーキテクチャ設計書

## 1. 全体構成図

```mermaid
graph TB
    subgraph Client["クライアント"]
        UI[Next.js UI]
        SDK[Supabase Client SDK]
    end

    subgraph Supabase["Supabase Platform"]
        Auth[Auth]
        Storage[Storage]
        DB[(PostgreSQL)]
        Edge[Edge Functions]
        RLS[Row Level Security]
    end

    subgraph ExternalAPI["外部API"]
        Assembly[AssemblyAI]
        Gemini[Google Gemini]
    end

    UI --> SDK
    SDK --> Auth
    SDK --> Storage
    SDK --> DB
    
    Storage --> Edge
    Edge --> Assembly
    Edge --> Gemini
    Edge --> DB

    DB --> RLS
    Storage --> RLS
    
    classDef platform fill:#ddd,stroke:#fff,stroke-width:4px,color:#000;
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef external fill:#bbf,stroke:#333,stroke-width:2px;
    
    class Supabase platform;
    class Client client;
    class ExternalAPI external;
```

## 2. コンポーネント詳細

### 2.1 フロントエンド層

```mermaid
graph LR
    subgraph Frontend["フロントエンド"]
        Pages[Pages]
        Components[Components]
        Hooks[Custom Hooks]
        Store[State Management]
    end

    subgraph SDK["Supabase SDK"]
        Auth[Auth Client]
        Storage[Storage Client]
        DB[Database Client]
        RT[Realtime Client]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> Store
    Store --> SDK
    
    classDef frontend fill:#f9f,stroke:#333,stroke-width:2px;
    classDef sdk fill:#ddd,stroke:#fff,stroke-width:4px,color:#000;
    
    class Frontend frontend;
    class SDK sdk;
```

### 2.2 バックエンド層

```mermaid
graph TB
    subgraph Input["入力"]
        Audio[音声ファイル]
        Text[テキスト入力]
    end

    subgraph Storage["Storage"]
        AudioStore[音声ストレージ]
    end

    subgraph Database["PostgreSQL"]
        Users[ユーザー]
        Meetings[議事録メタ情報]
        Trans[文字起こし]
        Sum[要約]
    end

    subgraph EdgeFunctions["Edge Functions"]
        Convert[音声変換]
        Transcribe[文字起こし]
        Summarize[要約生成]
    end

    Audio --> AudioStore
    AudioStore --> Convert
    Convert --> Transcribe
    Text --> Trans
    
    Transcribe --> Trans
    Trans --> Summarize
    Summarize --> Sum
    
    classDef input fill:#faa,stroke:#333,stroke-width:2px;
    classDef storage fill:#aaf,stroke:#333,stroke-width:2px;
    classDef db fill:#afa,stroke:#333,stroke-width:2px;
    classDef edge fill:#faf,stroke:#333,stroke-width:2px;
    
    class Input input;
    class Storage storage;
    class Database db;
    class EdgeFunctions edge;
```

## 3. データモデル

### 3.1 テーブル構造

```mermaid
erDiagram
    auth_users ||--o{ users : "拡張"
    users ||--o{ meetings : "作成"
    meetings ||--o{ transcriptions : "持つ"
    meetings ||--o{ summaries : "持つ"
    
    auth_users {
        uuid id PK "ユーザー固有のID"
        string email "メールアドレス"
        string phone "電話番号（オプション）"
        jsonb raw_app_meta_data "アプリメタデータ"
        jsonb raw_user_meta_data "ユーザーメタデータ"
        bool email_confirmed "メール確認済みフラグ"
        bool phone_confirmed "電話確認済みフラグ"
        bool is_anonymous "匿名ユーザーフラグ"
        timestamp confirmation_sent_at "確認メール送信日時"
        timestamp confirmed_at "メール確認日時"
        timestamp last_sign_in_at "最終ログイン日時"
        string role "ユーザーロール"
        timestamp created_at "作成日時"
        timestamp updated_at "更新日時"
        bool banned_until "アカウントバン期限"
    }
    
    users {
        uuid id PK "auth.users.idと同じ"
        string display_name "表示名"
        timestamp created_at "作成日時"
    }
    
    meetings {
        uuid id PK "議事録ID"
        uuid user_id FK "作成者ID"
        string title "タイトル"
        string audio_url "音声ファイルURL（オプション）"
        string input_type "入力タイプ（audio/text）"
        string status "処理状態"
        timestamp created_at "作成日時"
    }
    
    transcriptions {
        uuid id PK "文字起こしID"
        uuid meeting_id FK "議事録ID"
        text content "文字起こし内容"
        bool is_direct_input "直接入力フラグ"
        timestamp created_at "作成日時"
    }
    
    summaries {
        uuid id PK "要約ID"
        uuid meeting_id FK "議事録ID"
        text content "要約内容"
        timestamp created_at "作成日時"
    }
```

### 3.2 認証スキーマ解説

Supabaseでは`auth.users`スキーマに認証情報が自動で管理されます：

#### 3.2.1 重要なカラム解説

1. **基本情報**
   - `id`: ユーザー固有のUUID（全テーブルの紐付けに使用）
   - `email`: ログイン用メールアドレス
   - `role`: デフォルトは'authenticated'

2. **メタデータ**
   - `raw_app_meta_data`: アプリケーション管理データ（プロバイダ情報など）
   - `raw_user_meta_data`: ユーザー関連データ（Googleプロフィール情報など）

3. **認証状態**
   - `email_confirmed`: メール確認済みかどうか
   - `last_sign_in_at`: 最終ログイン日時
   - `confirmed_at`: メール確認完了日時

#### 3.2.2 メタデータの例

```json
// raw_app_meta_data の例
{
  "provider": "google",
  "providers": ["google"],
  "role": "authenticated"
}

// raw_user_meta_data の例（Googleログイン時）
{
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "email": "user@gmail.com",
  "email_verified": true,
  "full_name": "山田太郎",
  "iss": "https://accounts.google.com",
  "name": "山田太郎",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

これらのデータは自動的に管理され、アプリケーションからは参照のみ可能です。

## 4. 処理フロー

### 4.1 音声文字起こしフロー

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant Storage as Supabase Storage
    participant Edge as Edge Functions
    participant AssemblyAI
    participant Gemini
    participant DB as PostgreSQL
    
    User->>UI: 音声ファイルアップロード
    UI->>Storage: ファイル保存
    Storage->>Edge: トリガー実行
    Edge->>Edge: MP3変換
    Edge->>AssemblyAI: 文字起こし要求
    AssemblyAI-->>Edge: テキスト返却
    Edge->>Gemini: 要約要求
    Gemini-->>Edge: 要約返却
    Edge->>DB: 結果保存
    DB-->>UI: リアルタイム更新
    UI-->>User: 結果表示
```

### 4.2 テキスト直接入力フロー

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js UI
    participant DB as PostgreSQL
    participant Edge as Edge Functions
    participant Gemini
    
    User->>UI: テキスト入力
    UI->>DB: テキスト保存
    Note over DB: transcriptions.is_direct_input = true
    DB->>Edge: トリガー実行
    Edge->>Gemini: 要約要求
    Gemini-->>Edge: 要約返却
    Edge->>DB: 要約保存
    DB-->>UI: リアルタイム更新
    UI-->>User: 結果表示
```

## 5. セキュリティ設計

### 5.1 認証方式

```mermaid
graph TD
    subgraph Auth["認証フロー"]
        Google["Googleログイン"]
        Magic["マジックリンク認証"]
        Token["JWTトークン"]
        Session["セッション管理"]
    end

    User((ユーザー))
    
    User --> Google
    User --> Magic
    
    Google --> Token
    Magic --> Token
    Token --> Session
    
    classDef auth fill:#f9f,stroke:#333,stroke-width:2px;
    class Auth auth;
```

#### 5.1.1 認証方式詳細

1. **Googleログイン**
   - メイン認証方式として提供
   - ワンクリックでのアカウント作成・ログイン
   - プロフィール情報（表示名、アバター）の自動取得

2. **マジックリンク認証**
   - セカンダリ認証方式として提供
   - パスワードレスでの認証
   - メールアドレスのみでログイン可能
   - 有効期限付きの認証リンクをメールで送信

#### 5.1.2 認証フロー

1. **Googleログインフロー**
   ```mermaid
   sequenceDiagram
       actor User
       participant UI
       participant Supabase
       participant Google
       
       User->>UI: Googleログインボタンクリック
       UI->>Supabase: signInWithOAuth(google)
       Supabase->>Google: リダイレクト
       Google-->>User: 認証ダイアログ
       User->>Google: 認証情報入力
       Google-->>Supabase: 認証情報
       Supabase-->>UI: JWTトークン
       UI-->>User: ログイン完了
   ```

2. **マジックリンクフロー**
   ```mermaid
   sequenceDiagram
       actor User
       participant UI
       participant Supabase
       participant Email
       
       User->>UI: メールアドレス入力
       UI->>Supabase: signInWithOtp(email)
       Supabase->>Email: マジックリンク送信
       Email-->>User: 認証メール
       User->>UI: リンククリック
       UI->>Supabase: トークン検証
       Supabase-->>UI: JWTトークン
       UI-->>User: ログイン完了
   ```

### 5.2 RLSポリシー

```sql
-- meetings テーブルのRLSポリシー例
CREATE POLICY "ユーザーは自分の議事録のみ参照可能" ON meetings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の議事録のみ作成可能" ON meetings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

## 6. 監視設計

- Supabase Dashboardでの監視項目
  - ストレージ使用量
  - データベース接続数
  - Edge Functions実行回数
  - 認証アクティビティ
  - APIリクエスト数

## 7. デプロイメント

- Vercel: フロントエンド（Next.js）
- Supabase: バックエンド全般
  - Database
  - Storage
  - Edge Functions
  - Authentication 