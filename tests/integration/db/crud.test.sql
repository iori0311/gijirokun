-- CRUD操作テスト
-- 注意: このテストを実行する前に、seed.sqlでテストデータを投入しておく必要があります

-- Create テスト
-- 新しい会議を作成できることを確認
INSERT INTO meetings (id, user_id, title, input_type, status)
VALUES ('44444444-4444-4444-4444-444444444444', '12345678-1234-1234-1234-123456789012', 'CREATEテスト会議', 'text', 'created');

-- 作成した会議を確認
SELECT * FROM meetings WHERE id = '44444444-4444-4444-4444-444444444444';

-- Read テスト
-- 会議に関連する文字起こしと要約も取得できることを確認
SELECT m.title, t.content as transcription, s.content as summary
FROM meetings m
LEFT JOIN transcriptions t ON m.id = t.meeting_id
LEFT JOIN summaries s ON m.id = s.meeting_id
WHERE m.user_id = '12345678-1234-1234-1234-123456789012';

-- Update テスト
-- 会議のタイトルと状態を更新
UPDATE meetings 
SET title = '更新後のタイトル', status = 'completed'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- 更新結果を確認
SELECT * FROM meetings WHERE id = '44444444-4444-4444-4444-444444444444';

-- Delete テスト
-- 会議を削除し、関連する文字起こしと要約も削除されることを確認（カスケード削除）
DELETE FROM meetings WHERE id = '44444444-4444-4444-4444-444444444444';

-- 削除後に該当の会議が存在しないことを確認
SELECT * FROM meetings WHERE id = '44444444-4444-4444-4444-444444444444';
