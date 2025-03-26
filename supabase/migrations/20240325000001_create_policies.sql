-- Create RLS policies for gijirokun
-- RLSポリシー設定のマイグレーション

-- テーブルのRLS有効化
alter table meetings enable row level security;
alter table transcriptions enable row level security;
alter table summaries enable row level security;

-- meetings テーブルのポリシー
create policy "Users can read own meetings"
  on meetings for select
  using (auth.uid() = user_id);

create policy "Users can insert own meetings"
  on meetings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meetings"
  on meetings for update
  using (auth.uid() = user_id);

create policy "Users can delete own meetings"
  on meetings for delete
  using (auth.uid() = user_id);

-- transcriptions テーブルのポリシー
create policy "Users can manage own meeting transcriptions"
  on transcriptions for all
  using (
    exists (
      select 1 from meetings
      where meetings.id = transcriptions.meeting_id
      and meetings.user_id = auth.uid()
    )
  );

-- summaries テーブルのポリシー
create policy "Users can manage own meeting summaries"
  on summaries for all
  using (
    exists (
      select 1 from meetings
      where meetings.id = summaries.meeting_id
      and meetings.user_id = auth.uid()
    )
  ); 