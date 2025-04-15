// tests/set-up/teardown.ts
import { execSync } from "child_process";

export async function teardown() {
    console.log('Cleaning up test environment')
    try {
        // DBリセット
        execSync('supabase db reset --no-seed', { stdio: 'inherit'});
        
        // ローカルのSupabaseから動的にキーを取得
        const SUPABASE_URL = 'http://127.0.0.1:54321';
        const SUPABASE_SERVICE_KEY = execSync('supabase status | grep "service_role key:" | cut -d ":" -f2- | xargs', { encoding: 'utf-8' }).trim();
        
        execSync(`curl -X DELETE "${SUPABASE_URL}/storage/v1/bucket/audio-files" \
            -H "apikey: ${SUPABASE_SERVICE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"`, 
            { stdio: 'inherit' }
        );
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

export default teardown;