-- 外部キー制約違反のテスト
-- EXPECTED_ERROR:23503
INSERT INTO transcriptions (meeting_id, content, is_direct_input) 
VALUES ('99999999-9999-9999-9999-999999999999', 'このテストはエラーになるはず', true); 