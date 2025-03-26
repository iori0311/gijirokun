# Supabaseテスト Tips

## テストでのファイル操作

### Fileオブジェクトの作成

テストでファイルをシミュレートするには、ブラウザのFileオブジェクトを使用できます。これは特にSupabaseのストレージ機能をテストする際に便利です。

```typescript
// テキスト内容を持つファイルの作成
const textFile = new File(
  ['ファイルの内容をここに書く'],  // ファイルの中身（配列形式）
  'example.txt',                 // ファイル名
  { type: 'text/plain' }         // メタデータ（MIMEタイプなど）
);

// 音声ファイルのモック
const audioFile = new File(
  ['テスト用音声データ'],        // 実際のバイナリではなくテスト用のテキスト
  'audio.mp3',                  // ファイル名
  { type: 'audio/mpeg' }        // 音声ファイルとして認識されるMIMEタイプ
);

// 大きなファイルのモック（例：51MB）
const largeFile = new File(
  [new ArrayBuffer(51 * 1024 * 1024)],  // 指定サイズのバッファを作成
  'large.mp3',
  { type: 'audio/mpeg' }
);
```

### アップロードとダウンロードの検証

ファイルの上書きやコンテンツ検証をするテスト例：

```typescript
// ファイルをアップロード
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('path/to/file.txt', file);

// ファイルをダウンロード
const { data, error } = await supabase.storage
  .from('bucket-name')
  .download('path/to/file.txt');

// ダウンロードしたデータの内容を検証
if (data) {
  // Blobデータをテキストとして読み込む
  const reader = new FileReader();
  const contentPromise = new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(data);
  });
  
  const content = await contentPromise;
  expect(content).toBe('期待される内容');
}
```

## テストのセットアップとクリーンアップ

### beforeEach / afterEach の活用

各テストケースの独立性を保つために、`beforeEach`と`afterEach`フックを使用すると効果的です：

```typescript
let supabase: SupabaseClient;
let userId: string | undefined;

beforeEach(async () => {
  // 各テスト前に新しいクライアントを作成
  supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );

  // デフォルトで認証済み状態にする
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword'
  });
  
  userId = data.user?.id;
});

afterEach(async () => {
  // 各テスト後にログアウト
  await supabase.auth.signOut();
});
```

## テストデータの作成と削除

### 一時テストデータの扱い

テスト内で作成したデータは、テスト後にきれいに削除することがベストプラクティスです：

```typescript
test('something with file', async () => {
  // テストデータを作成
  await supabase.storage
    .from('bucket-name')
    .upload(`${userId}/test.mp3`, testFile);
  
  // テストロジック...
  
  // 後片付け - テストデータを削除
  await supabase.storage
    .from('bucket-name')
    .remove([`${userId}/test.mp3`]);
});
```

### テスト環境の後片付け

テスト環境全体のセットアップと後片付けには、以下のようなフックを利用できます：

```typescript
// テストスイート全体の前に1回だけ実行
beforeAll(async () => {
  // 例：テスト用のバケットを作成
  await setupTestBucket();
});

// テストスイート全体の後に1回だけ実行
afterAll(async () => {
  // 例：すべてのテストデータをクリーンアップ
  await cleanUpAllTestFiles();
  // または特定のパスの全ファイルを削除
  await supabase.storage
    .from('audio-files')
    .emptyBucket();  // 注意: 運用環境では使わないこと
});
```

#### トライ・フィナリーパターン

テスト中にエラーが発生しても確実に後片付けを行うために、try-finallyパターンも有効です：

```typescript
test('複雑なテストケース', async () => {
  let filePath = `${userId}/test_file.mp3`;
  
  try {
    // テストデータをアップロード
    await supabase.storage
      .from('audio-files')
      .upload(filePath, testFile);
      
    // テストロジック...
    // エラーが発生する可能性のあるコード
  } finally {
    // 例外が発生しても必ず実行される
    // テストデータのクリーンアップ
    await supabase.storage
      .from('audio-files')
      .remove([filePath]);
  }
});
```

### テストデータベースのリセット

Supabaseのデータベースを完全にリセットする場合（主にCI/CD環境）：

```bash
# データベースのリセット（シードデータは残す）
supabase db reset

# データベースのリセット（シードデータなし）
supabase db reset --no-seed

# その後テスト用のシードデータを投入
psql -f test-seed.sql
```

これをテスト実行前のセットアップスクリプトで実行することで、常にクリーンな状態からテストを開始できます。

## その他のテストシナリオアイデア

- 同名ファイルの上書き挙動検証
- ファイルサイズ制限のテスト
- 許可されていないファイル形式のバリデーション
- ユーザー間のアクセス制限検証
- パス内のサブフォルダ構造のテスト 