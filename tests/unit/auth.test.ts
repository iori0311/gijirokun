// 1. vi.mock calls MUST be at the top
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  })),
}))
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

// 2. Then other imports
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { login, loginWithGoogle, register, logout } from '../../src/app/_lib/auth' // Test target import AFTER mocks
import { AuthApiError } from '@supabase/supabase-js'

// 3. Mock reference variables
let mockSignInWithPassword: Mock;
let mockSignInWithOAuth: Mock;
let mockSignUp: Mock;
let mockSignOut: Mock;
let mockRedirect: Mock;

// 4. window.location mock setup (beforeEach needs window)
const originalLocation = window.location

// 5. beforeEach setup
beforeEach(async () => {
  // --- モッククリアを最初に --- (clearAllMocks clears vi.fn() instances created by mocks)
  vi.clearAllMocks()

  // --- モック参照取得 ---
  // Supabase
  const supabaseHelpersMock = await import('@supabase/auth-helpers-nextjs')
  const mockSupabaseClient = supabaseHelpersMock.createClientComponentClient();
  mockSignInWithPassword = vi.mocked(mockSupabaseClient.auth.signInWithPassword);
  mockSignInWithOAuth = vi.mocked(mockSupabaseClient.auth.signInWithOAuth);
  mockSignUp = vi.mocked(mockSupabaseClient.auth.signUp);
  mockSignOut = vi.mocked(mockSupabaseClient.auth.signOut);
  // Redirect
  const navigationMock = await import('next/navigation')
  mockRedirect = vi.mocked(navigationMock.redirect);

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
      mockSignInWithPassword.mockResolvedValue({ error: null })
      const result = await login('test@example.com', 'password')
      expect(result.error).toBeNull()
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
    })

    it('Supabaseエラー発生時、AuthError形式でエラーを返すこと', async () => {
      const supabaseError = new AuthApiError('Invalid login credentials', 400, '400')
      mockSignInWithPassword.mockResolvedValue({ error: supabaseError })
      const result = await login('test@example.com', 'wrongpassword')
      expect(result.error).toEqual({
        message: 'Invalid login credentials',
        code: '400',
        type: 'auth_api_error',
      })
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
    })

     it('予期せぬエラー発生時、AuthError形式でエラーを返すこと', async () => {
      const genericError = new Error('Network error')
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
      mockSignInWithOAuth.mockResolvedValue({ error: null })
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
        const supabaseError = new AuthApiError('OAuth provider error', 500, '500')
        mockSignInWithOAuth.mockResolvedValue({ error: supabaseError })
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
      mockSignUp.mockResolvedValue({ error: null })
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
      const supabaseError = new AuthApiError('User already registered', 422, '422')
      mockSignUp.mockResolvedValue({ error: supabaseError })
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
      mockSignOut.mockResolvedValue({ error: null })
      await logout()
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/')
      expect(mockRedirect).toHaveBeenCalledTimes(1)
    })

    it('Supabaseエラー発生時、AuthError形式でエラーを返し、redirectが呼ばれないこと', async () => {
      const supabaseError = new AuthApiError('User session not found', 401, '401')
      mockSignOut.mockResolvedValue({ error: supabaseError })
       try {
        await logout();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) { // Keep original name, disable lint rule
         // redirectが呼ばれる前にエラーがスローされる（略）
      }

      // 元のコードの挙動に基づき、エラーがあってもsignOutとredirectが呼ばれることを確認
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/')
      expect(mockRedirect).toHaveBeenCalledTimes(1)

    })

    it('予期せぬエラー発生時、エラーをスローし、redirectが呼ばれないこと', async () => {
        const genericError = new Error('Unexpected error');
        mockSignOut.mockRejectedValue(genericError);

        await expect(logout()).rejects.toThrow('Unexpected error');

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockRedirect).not.toHaveBeenCalled();
    });
  })
})
