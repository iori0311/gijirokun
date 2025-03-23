-- 外部キー制約テスト
-- 注意: このテストを実行する前に、seed.sqlでテストデータを投入しておく必要があります

-- 1. 存在しない会議IDでの文字起こし作成（エラーになるべき）
INSERT INTO transcriptions (meeting_id, content, is_direct_input) 
VALUES ('99999999-9999-9999-9999-999999999999', 'エラーになるはず', true);

-- 2. 存在しない会議IDでの要約作成（エラーになるべき）
INSERT INTO summaries (meeting_id, content)
VALUES ('99999999-9999-9999-9999-999999999999', 'エラーになるはず');

-- 3. カスケード削除の確認
-- まず、テスト用の会議とその関連データを作成
INSERT INTO meetings (id, user_id, title, input_type, status)
VALUES ('55555555-5555-5555-5555-555555555555', '12345678-1234-1234-1234-123456789012', 'カスケード削除テスト', 'text', 'completed');

INSERT INTO transcriptions (meeting_id, content, is_direct_input)
VALUES ('55555555-5555-5555-5555-555555555555', 'カスケード削除テスト用の文字起こし', true);

INSERT INTO summaries (meeting_id, content)
VALUES ('55555555-5555-5555-5555-555555555555', 'カスケード削除テスト用の要約');

-- 会議を削除（関連する文字起こしと要約も削除されるはず）
DELETE FROM meetings WHERE id = '55555555-5555-5555-5555-555555555555';

-- 関連データが削除されたことを確認
SELECT * FROM transcriptions WHERE meeting_id = '55555555-5555-5555-5555-555555555555';
SELECT * FROM summaries WHERE meeting_id = '55555555-5555-5555-5555-555555555555'; 