-- テストユーザーデータ
DELETE FROM auth.users WHERE id IN (
  '12345678-1234-1234-1234-123456789012',
  '98765432-9876-9876-9876-987654321098'
);

-- テストユーザーの作成（パスワード認証できるように）
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES
  (
    '12345678-1234-1234-1234-123456789012',
    'test1@example.com',
    crypt('testpassword', gen_salt('bf')),  -- パスワード: testpassword
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  ),
  (
    '98765432-9876-9876-9876-987654321098',
    'test2@example.com',
    crypt('testpassword', gen_salt('bf')),  -- パスワード: testpassword
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}'
  );

-- テスト用会議データ
INSERT INTO meetings (id, user_id, title, input_type, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '12345678-1234-1234-1234-123456789012', 'テスト会議1', 'text', 'completed'),
  ('22222222-2222-2222-2222-222222222222', '98765432-9876-9876-9876-987654321098', 'テスト会議2', 'audio', 'completed');

-- テスト用文字起こしデータ
INSERT INTO transcriptions (meeting_id, content, is_direct_input) VALUES
  ('11111111-1111-1111-1111-111111111111', 'テスト会議1の文字起こし', true),
  ('22222222-2222-2222-2222-222222222222', 'テスト会議2の文字起こし', false);

-- テスト用要約データ
INSERT INTO summaries (meeting_id, content) VALUES
  ('11111111-1111-1111-1111-111111111111', 'テスト会議1の要約'),
  ('22222222-2222-2222-2222-222222222222', 'テスト会議2の要約');