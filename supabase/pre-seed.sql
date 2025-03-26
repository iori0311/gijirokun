-- トリガーの無効化
ALTER TABLE meetings DISABLE TRIGGER ALL;
ALTER TABLE transcriptions DISABLE TRIGGER ALL;
ALTER TABLE summaries DISABLE TRIGGER ALL;

-- 既存データのクリーンアップ（依存関係を考慮した順序で）
DELETE FROM summaries;
DELETE FROM transcriptions;
DELETE FROM meetings; 