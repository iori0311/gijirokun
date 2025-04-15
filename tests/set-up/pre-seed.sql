-- ユーザートリガーの無効化
ALTER TABLE meetings DISABLE TRIGGER USER;
ALTER TABLE transcriptions DISABLE TRIGGER USER;
ALTER TABLE summaries DISABLE TRIGGER USER;

-- 既存データのクリーンアップ（依存関係を考慮した順序で）
DELETE FROM summaries;
DELETE FROM transcriptions;
DELETE FROM meetings; 