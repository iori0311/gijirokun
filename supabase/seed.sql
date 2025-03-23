-- テストユーザーの作成
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at
) VALUES (
  '12345678-1234-1234-1234-123456789012',
  'test1@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now()
), (
  '98765432-9876-9876-9876-987654321098',
  'test2@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now()
);

-- テスト用会議データ
INSERT INTO meetings (id, user_id, title, input_type, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '12345678-1234-1234-1234-123456789012', 'テキスト入力のテスト会議', 'text', 'completed'),
  ('22222222-2222-2222-2222-222222222222', '12345678-1234-1234-1234-123456789012', '音声入力のテスト会議', 'audio', 'uploading'),
  ('33333333-3333-3333-3333-333333333333', '98765432-9876-9876-9876-987654321098', '他のユーザーの会議', 'text', 'completed');

-- テスト用文字起こしデータ
INSERT INTO transcriptions (meeting_id, content, is_direct_input)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'これはテキスト入力のテストです。', true),
  ('22222222-2222-2222-2222-222222222222', 'これは音声入力のテストです。', false);

-- テスト用要約データ
INSERT INTO summaries (meeting_id, content)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'テキスト入力テストの要約です。'),
  ('22222222-2222-2222-2222-222222222222', '音声入力テストの要約です。'); 