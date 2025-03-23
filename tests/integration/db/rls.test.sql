-- RLSポリシーテスト
-- 注意: このテストを実行する前に、seed.sqlでテストデータを投入しておく必要があります

-- 未認証状態のテスト
SET LOCAL ROLE anon;
-- 未認証では何も見えないはず
SELECT * FROM meetings;

-- test1@example.comとしてログイン
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '12345678-1234-1234-1234-123456789012';

-- 1. 自分の会議へのアクセス（許可されるべき）
-- 自分の会議一覧を取得できることを確認
SELECT * FROM meetings WHERE user_id = '12345678-1234-1234-1234-123456789012';

-- 自分の会議の文字起こしを取得できることを確認
SELECT * FROM transcriptions 
WHERE meeting_id IN (
    SELECT id FROM meetings WHERE user_id = '12345678-1234-1234-1234-123456789012'
);

-- test2@example.comとしてログイン
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '98765432-9876-9876-9876-987654321098';

-- 2. 他人の会議へのアクセス（拒否されるべき）
-- 他人の会議の取得を試みる（空の結果セットになるはず）
SELECT * FROM meetings WHERE user_id = '12345678-1234-1234-1234-123456789012';

-- 他人の会議の更新を試みる（エラーまたは0行の更新）
UPDATE meetings 
SET title = '更新できないはず' 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 他人の会議の削除を試みる（エラーまたは0行の削除）
DELETE FROM meetings 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 3. 文字起こしと要約のRLSテスト
-- 他人の会議に関連する文字起こしの取得を試みる（空の結果セットになるはず）
SELECT * FROM transcriptions 
WHERE meeting_id = '11111111-1111-1111-1111-111111111111';

-- 他人の会議に関連する要約の取得を試みる（空の結果セットになるはず）
SELECT * FROM summaries 
WHERE meeting_id = '11111111-1111-1111-1111-111111111111';

-- 認証コンテキストをリセット
RESET ROLE; 