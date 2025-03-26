-- Create tables for gijirokun
-- テーブル作成のマイグレーション

-- meetings テーブル
create table meetings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  audio_url text,
  input_type text check (input_type in ('audio', 'text')) not null,
  status text check (
    status in (
      'created',
      'uploading',
      'converting',
      'transcribing',
      'summarizing',
      'completed',
      'error'
    )
  ) not null default 'created',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- transcriptions テーブル
create table transcriptions (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references meetings(id) on delete cascade,
  content text not null,
  is_direct_input boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- summaries テーブル
create table summaries (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references meetings(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
); 