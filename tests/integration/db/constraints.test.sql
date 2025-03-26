-- 外部キー制約テスト
-- 注意: このテストを実行する前に、seed.sqlでテストデータを投入しておく必要があります

-- 1. 存在しない会議IDでの文字起こし作成（エラーになるべき）
-- EXPECTED_ERROR:23503
INSERT INTO transcriptions (meeting_id, content, is_direct_input) 
VALUES ('99999999-9999-9999-9999-999999999999', 'エラーになるはず', true);

-- 2. 存在しない会議IDでの要約作成（エラーになるべき）
-- EXPECTED_ERROR:23503
INSERT INTO summaries (meeting_id, content)
VALUES ('99999999-9999-9999-9999-999999999999', 'エラーになるはず');

-- 3. カスケード削除の確認
DO $$
DECLARE
    trans_count integer;
    sum_count integer;
    meeting_id uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- まず、テスト用の会議とその関連データを作成
    INSERT INTO meetings (id, user_id, title, input_type, status)
    VALUES (meeting_id, '12345678-1234-1234-1234-123456789012', 'カスケード削除テスト', 'text', 'completed');

    INSERT INTO transcriptions (meeting_id, content, is_direct_input)
    VALUES (meeting_id, 'カスケード削除テスト用の文字起こし', true);

    INSERT INTO summaries (meeting_id, content)
    VALUES (meeting_id, 'カスケード削除テスト用の要約');

    -- 関連データが作成されたことを確認
    SELECT COUNT(*) INTO trans_count FROM transcriptions WHERE meeting_id = meeting_id;
    SELECT COUNT(*) INTO sum_count FROM summaries WHERE meeting_id = meeting_id;

    IF trans_count = 0 OR sum_count = 0 THEN
        RAISE EXCEPTION 'テストデータの作成に失敗しました。transcriptions: %, summaries: %', trans_count, sum_count;
    END IF;

    -- 会議を削除
    DELETE FROM meetings WHERE id = meeting_id;

    -- 関連データが削除されたことを確認
    SELECT COUNT(*) INTO trans_count FROM transcriptions WHERE meeting_id = meeting_id;
    SELECT COUNT(*) INTO sum_count FROM summaries WHERE meeting_id = meeting_id;

    -- 削除後の確認
    IF trans_count > 0 OR sum_count > 0 THEN
        RAISE EXCEPTION 'カスケード削除が正しく動作していません。残存データ - transcriptions: %, summaries: %', 
            trans_count, sum_count;
    END IF;

    RAISE NOTICE 'カスケード削除テスト成功：全ての関連データが正しく削除されました';
END $$; 