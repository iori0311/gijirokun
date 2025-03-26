import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { expect, test, describe, beforeEach, afterEach, afterAll } from 'vitest'
import { teardown } from '../../set-up/teardown'

describe('Storage Bucket Tests', () => {
  let supabase: SupabaseClient
  let userId: string | undefined

  beforeEach(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_ANON_KEY ?? ''
    );

    // デフォルトで認証済み状態にする
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test1@example.com',
      password: 'testpassword'
    });
    
    userId = data.user?.id;
  })

  // テスト後にログアウト
  afterEach(async () => {
    await supabase.auth.signOut()
  })

  // 全てのテスト後にクリーンアップ
  afterAll(async () => {
    await teardown()
  }, 60000) // タイムアウトを60秒に設定

  // ユーザー認証のテスト
  test('未認証ユーザーはアップロードできない', async () => {
    await supabase.auth.signOut();
    
    const testFile = new File(['test-audio'], 'test.mp3', {
      type: 'audio/mpeg'
    })

    const { error } = await supabase.storage
      .from('audio-files')
      .upload('unauthorized/test.mp3', testFile
    )

    expect(error).toBeDefined()
    expect(error?.message).toContain('new row violates row-level security policy')
  })

  // 認証済みのユーザでテスト
  test('認証済みユーザーは自分のフォルダのアップロードができる', async () => {
    // 現在のユーザーを確認
    const { data: { user } } = await supabase.auth.getUser()
    expect(user?.id).toBe(userId)

    const testFile = new File(['test audio'], 'test.mp3', {
      type: 'audio/mpeg'
    })

    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(`${userId}/test.mp3`, testFile)

    expect(error).toBeNull()
    expect(data).toBeDefined()

    // 後片付け
    await supabase.storage
      .from('audio-files')
      .remove([`${userId}/test.mp3`]);
  })

  test('50MB以上のファイルはアップロードできない', async () => {
    // 51MBのダミーファイル作成
    const largeFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.mp3', { 
      type: 'audio/mpeg' 
    })
    
    const { error } = await supabase.storage
      .from('audio-files')
      .upload(`${userId}/test/large.mp3`, largeFile)
    
    expect(error).toBeDefined()
    expect(error?.message).toContain('The object exceeded the maximum allowed size')
  })

  test('許可していない拡張子のファイルはアップロードできない', async () => {
    const invalidFile = new File(['test content'], 'test.txt', { 
      type: 'text/plain' 
    })
    
    const { error } = await supabase.storage
      .from('audio-files')
      .upload(`${userId}/test/test.txt`, invalidFile)
    
    expect(error).toBeDefined()
    expect(error?.message).toContain('mime type text/plain is not supported')
  })

  test('認証済みユーザーは自分のファイルを取得できる', async () => {
    const testFile = new File(['test audio'], 'test.mp3', { 
      type: 'audio/mpeg' 
    })
    await supabase.storage
      .from('audio-files')
      .upload(`${userId}/test.mp3`, testFile)

    const { data: files, error } = await supabase.storage
      .from('audio-files')
      .list(userId ?? '')

    expect(error).toBeNull()
    expect(files).toBeDefined()
    expect(files?.length).toBeGreaterThan(0)
    expect(files?.[0].name).toBe('test.mp3')

    // 後片付け
    await supabase.storage
      .from('audio-files')
      .remove([`${userId}/test.mp3`]);
  })

  test('他のユーザーのファイルにはアクセスできない', async () => {
    // test1でログイン中に、test2のファイルにアクセス
    const { error, data } = await supabase.storage
      .from('audio-files')
      .list('98765432-9876-9876-9876-987654321098')  // test2のID

    console.log('Response error:', error)
    console.log('Response data:', data)

    // アクセス権限がない場合は空のリストが返される
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  test('ユーザーは自分のファイルを削除できる', async () => {
    // テスト用ファイルをアップロード
    const testFile = new File(['test audio'], 'test.mp3', { 
      type: 'audio/mpeg' 
    })
    await supabase.storage
      .from('audio-files')
      .upload(`${userId}/test.mp3`, testFile)

    // ファイルを削除
    const { error: deleteError } = await supabase.storage
      .from('audio-files')
      .remove([`${userId}/test.mp3`])

    expect(deleteError).toBeNull()

    // 削除後はリストに表示されないことを確認
    const { data: files } = await supabase.storage
      .from('audio-files')
      .list(userId ?? '')

    expect(files).toEqual([])
  })

  test('同名ファイルは上書きできない（デフォルト動作）', async () => {
    // 最初のファイルをアップロード
    const testFile1 = new File(['content 1'], 'same_name.mp3', { 
      type: 'audio/mpeg' 
    });
    
    const upload1 = await supabase.storage
      .from('audio-files')
      .upload(`${userId}/same_name.mp3`, testFile1);
    
    expect(upload1.error).toBeNull();
    
    // 同名の別内容ファイルをアップロード（デフォルトではエラーになるはず）
    const testFile2 = new File(['content 2'], 'same_name.mp3', { 
      type: 'audio/mpeg' 
    });
    
    const upload2 = await supabase.storage
      .from('audio-files')
      .upload(`${userId}/same_name.mp3`, testFile2);
    
    // エラーが返ってくることを確認
    expect(upload2.error).toBeDefined();
    expect(upload2.error?.message).toContain('The resource already exists');
    
    // 後片付け
    await supabase.storage
      .from('audio-files')
      .remove([`${userId}/same_name.mp3`]);
  });
});