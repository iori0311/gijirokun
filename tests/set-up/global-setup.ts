import { execSync } from "child_process";
import { createClient } from '@supabase/supabase-js'

export async function setup() {
    console.log('Setting up test environment')
    try {
        // DBリセット、マイグレーション
        execSync('supabase db reset --no-seed', { stdio: 'inherit'});

        // ローカルのSupabaseから動的にキーを取得
        const SUPABASE_URL = 'http://127.0.0.1:54321';
        const SUPABASE_SERVICE_KEY = execSync('supabase status | grep "service_role key:" | cut -d ":" -f2- | xargs', { encoding: 'utf-8' }).trim();

        // service_roleクライアントの作成
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // テストユーザーの作成
        const { error: error1 } = await supabase.auth.admin.createUser({
            email: 'test1@example.com',
            password: 'testpassword',
            user_metadata: {},
            email_confirm: true,
            id: '12345678-1234-1234-1234-123456789012'
        });

        if (error1) {
            throw new Error(`Failed to create test user 1: ${error1.message}`);
        }

        const { error: error2 } = await supabase.auth.admin.createUser({
            email: 'test2@example.com',
            password: 'testpassword',
            user_metadata: {},
            email_confirm: true,
            id: '98765432-9876-9876-9876-987654321098'
        });

        if (error2) {
            throw new Error(`Failed to create test user 2: ${error2.message}`);
        }

        // テストデータの投入（会議、文字起こし、要約）
        execSync('PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f tests/set-up/test-seed.sql', { stdio: 'inherit'})

        // ストレージバケットの作成
        execSync(`curl -X POST "${SUPABASE_URL}/storage/v1/bucket" \
            -H "apikey: ${SUPABASE_SERVICE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"name": "audio-files", "public": false, "file_size_limit": 52428800}'`,  // 50MB制限
            { stdio: 'inherit' }
        );
    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    }
}

export default setup;