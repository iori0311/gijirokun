// デバッグログ削除

// 1. vi.mock calls MUST be at the top
vi.mock('@supabase/auth-helpers-nextjs', () => {
  // モック実装にデフォルト返り値を設定
  const mockAuthImplementation = {
    // デフォルトで成功 ({ error: null }) を返すように設定
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }), 
    signInWithOAuth:    vi.fn().mockResolvedValue({ error: null }),
    signUp:             vi.fn().mockResolvedValue({ error: null }),
    signOut:            vi.fn().mockResolvedValue({ error: null }),
  };
  return {
    createClientComponentClient: vi.fn(() => ({ auth: mockAuthImplementation })), 
  };
});
vi.mock('next/navigation', () => {
  // redirect のモックは返り値不要なのでそのままでOK
  return {
    redirect: vi.fn(),
  };
});

// 2. Import test utilities and modules AFTER mocks
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { login, loginWithGoogle, register, logout } from '../../src/app/_lib/auth'; 
import { AuthApiError } from '@supabase/supabase-js';
// モック参照取得のためインポート
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

// 3. Mock reference variables
let mockSignInWithPassword: Mock;
let mockSignInWithOAuth: Mock;
let mockSignUp: Mock;
let mockSignOut: Mock;
let mockRedirect: Mock;

// 4. window.location mock setup (beforeEach needs window)
const originalLocation = window.location

// 5. beforeEach setup
beforeEach(() => { 
  // モック化された関数を呼び出して参照を取得 (クリアより先に！)
  const mockSupabaseInstance = createClientComponentClient(); 
  mockSignInWithPassword = vi.mocked(mockSupabaseInstance.auth.signInWithPassword);
  mockSignInWithOAuth = vi.mocked(mockSupabaseInstance.auth.signInWithOAuth);
  mockSignUp = vi.mocked(mockSupabaseInstance.auth.signUp);
  mockSignOut = vi.mocked(mockSupabaseInstance.auth.signOut);

  // モック化された redirect 関数への参照を取得 (クリアより先に！)
  mockRedirect = vi.mocked(redirect);

  // 参照取得後にクリア
  vi.clearAllMocks();
  // ここではモックのデフォルトの返り値は設定しない。
  // 各テストケースで mockResolvedValue/mockRejectedValue を使う。

  // --- window.location モック ---
  // @ts-expect-error: window.location is read-only
  delete window.location
  window.location = { ...originalLocation, origin: 'http://localhost:3000' }
})

// 6. describe/it blocks
describe('Auth Library (_lib/auth.ts)', () => {

  // --- login ---
  describe('login', () => {
    it('ログイン成功時、エラーなしで完了すること', async () => {
      // ★テストケース内でモックの返り値を設定
      mockSignInWithPassword.mockResolvedValue({ error: null }); 
      const result = await login('test@example.com', 'password');
      expect(result.error).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
    })

    it('Supabaseエラー発生時、AuthError形式でエラーを返すこと', async () => {
      const supabaseError = new AuthApiError('Invalid login credentials', 400, '400');
      // ★テストケース内でモックの返り値を設定
      mockSignInWithPassword.mockResolvedValue({ error: supabaseError }); 
      const result = await login('test@example.com', 'wrongpassword');
      expect(result.error).toEqual({
        message: 'Invalid login credentials',
        code: '400',
        type: 'auth_api_error',
      })
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
    })

     it('予期せぬエラー発生時、AuthError形式でエラーを返すこと', async () => {
      const genericError = new Error('Network error');
      // ★テストケース内でモックの返り値を設定
      mockSignInWithPassword.mockRejectedValue(genericError); 
      const result = await login('test@example.com', 'password');
      expect(result.error).toEqual({
        message: 'Network error',
        type: 'unknown_error',
      });
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
    });
  })

  // --- loginWithGoogle ---
  describe('loginWithGoogle', () => {
    it('Googleログイン開始時、エラーなしで完了し、正しいオプションでsignInWithOAuthが呼ばれること', async () => {
      // ★テストケース内でモックの返り値を設定
      mockSignInWithOAuth.mockResolvedValue({ error: null });
      const result = await loginWithGoogle()
      expect(result.error).toBeNull()
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
      expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1)
    })

    it('Supabaseエラー発生時、AuthError形式でエラーを返すこと', async () => {
        const supabaseError = new AuthApiError('OAuth provider error', 500, '500');
        // ★テストケース内でモックの返り値を設定
        mockSignInWithOAuth.mockResolvedValue({ error: supabaseError });
        const result = await loginWithGoogle()
        expect(result.error).toEqual({
          message: 'OAuth provider error',
          code: '500',
          type: 'auth_api_error',
        })
        expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1)
      })

      it('予期せぬエラー発生時、AuthError形式でエラーを返すこと', async () => {
        const genericError = new Error('Configuration error');
        // ★テストケース内でモックの返り値を設定
        mockSignInWithOAuth.mockRejectedValue(genericError);
        const result = await loginWithGoogle();
        expect(result.error).toEqual({
          message: 'Configuration error',
          type: 'unknown_error',
        });
        expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
      });
  })

  // --- register ---
  describe('register', () => {
    it('登録成功時、エラーなしで完了し、正しいオプションでsignUpが呼ばれること', async () => {
      // ★テストケース内でモックの返り値を設定
      mockSignUp.mockResolvedValue({ error: null });
      const result = await register('new@example.com', 'newpassword')
      expect(result.error).toBeNull()
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      })
      expect(mockSignUp).toHaveBeenCalledTimes(1)
    })

    it('Supabaseエラー発生時、AuthError形式でエラーを返すこと', async () => {
      const supabaseError = new AuthApiError('User already registered', 422, '422');
      // ★テストケース内でモックの返り値を設定
      mockSignUp.mockResolvedValue({ error: supabaseError });
      const result = await register('test@example.com', 'password')
      expect(result.error).toEqual({
        message: 'User already registered',
        code: '422',
        type: 'auth_api_error',
      })
      expect(mockSignUp).toHaveBeenCalledTimes(1)
    })

     it('予期せぬエラー発生時、AuthError形式でエラーを返すこと', async () => {
      const genericError = new Error('Server unavailable');
      // ★テストケース内でモックの返り値を設定
      mockSignUp.mockRejectedValue(genericError);
      const result = await register('another@example.com', 'password123');
      expect(result.error).toEqual({
        message: 'Server unavailable',
        type: 'unknown_error',
      });
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });
  })

  // --- logout ---
  describe('logout', () => {
    it('ログアウト成功時、エラーなしで完了し、signOutとredirectが呼ばれること', async () => {
      // ★テストケース内でモックの返り値を設定 (重要: undefined を返さないように)
      mockSignOut.mockResolvedValue({ error: null }); 
      const result = await logout();
      expect(result.error).toBeNull();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/');
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    })

    it('Supabaseエラー発生時、AuthError形式でエラーを返し、redirectが呼ばれること', async () => {
      const supabaseError = new AuthApiError('User session not found', 401, '401');
      // ★テストケース内でモックの返り値を設定
      mockSignOut.mockResolvedValue({ error: supabaseError }); 
      const result = await logout(); // logout はエラーを throw しなくなった
      // ★アサーション変更: 返り値のエラーをチェック
      expect(result.error).toEqual({
          message: 'User session not found',
          code: '401',
          type: 'auth_api_error',
      });
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      // ★ finally で redirect が呼ばれることを確認
      expect(mockRedirect).toHaveBeenCalledWith('/');
      expect(mockRedirect).toHaveBeenCalledTimes(1);
    })

    it('予期せぬエラー発生時、AuthError形式のエラーを返し、redirectが呼ばれること', async () => {
        const genericError = new Error('Unexpected error');
        // ★テストケース内でモックの返り値を設定
        mockSignOut.mockRejectedValue(genericError);

        const result = await logout(); // logout はエラーを throw しなくなった
        // ★アサーション変更: 返り値のエラーをチェック
        expect(result.error).toEqual({
            message: 'Unexpected error',
            type: 'unknown_error',
        });

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockRedirect).toHaveBeenCalledWith('/');
        expect(mockRedirect).toHaveBeenCalledTimes(1); 
    });
  })
})
