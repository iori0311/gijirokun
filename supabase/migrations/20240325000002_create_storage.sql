-- Create Storage
insert into storage.buckets(id, name, public)
values ('audio-files', 'audio-files', false);

-- Enable RLS
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

-- Create Storage Policies
create policy "Authenticated users can view buckets"
    on storage.buckets for select
    using ( auth.role() = 'authenticated' );

create policy "Authenticated users can upload their own audio files"
    on storage.objects for INSERT
    with check (
        bucket_id = 'audio-files'
        and (storage.foldername(name))[1] = auth.uid()::text
        and (
            storage.extension(name) = 'mp3'::text OR
            storage.extension(name) = 'm4a'::text OR
            storage.extension(name) = 'wav'::text
        )
    );

create policy "Authenticated users can read their own audio files"
    on storage.objects for SELECT
    using (
        bucket_id = 'audio-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Authenticated users can update their own audio files"
    on storage.objects for UPDATE
    with check (
        bucket_id = 'audio-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Authenticated users can delete their own audio files"
    on storage.objects for DELETE
    using (
        bucket_id = 'audio-files'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

