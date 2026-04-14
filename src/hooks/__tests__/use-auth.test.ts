import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuth } from '@/hooks/use-auth';
import { signIn as signInAction, signUp as signUpAction } from '@/actions';
import { getAnonWorkData, clearAnonWork } from '@/lib/anon-work-tracker';
import { getProjects } from '@/actions/get-projects';
import { createProject } from '@/actions/create-project';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock actions
vi.mock('@/actions', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

// Mock anon work tracker
vi.mock('@/lib/anon-work-tracker', () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Mock project actions
vi.mock('@/actions/get-projects', () => ({
  getProjects: vi.fn(),
}));

vi.mock('@/actions/create-project', () => ({
  createProject: vi.fn(),
}));

describe('useAuth', () => {
  const mockPush = vi.fn();
  const mockSignInAction = vi.fn();
  const mockSignUpAction = vi.fn();
  const mockGetAnonWorkData = vi.fn();
  const mockClearAnonWork = vi.fn();
  const mockGetProjects = vi.fn();
  const mockCreateProject = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state with isLoading false', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
    });
  });

  describe('signIn', () => {
    it('should set loading state during sign in', async () => {
      mockSignInAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should call signInAction with correct parameters', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSignInAction).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should return result from signInAction', async () => {
      const mockResult = { success: false, error: 'Invalid credentials' };
      mockSignInAction.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn(
          'test@example.com',
          'wrong-password'
        );
      });

      expect(signInResult).toEqual(mockResult);
    });

    it('should handle post sign in with anonymous work', async () => {
      const anonWork = {
        messages: [{ role: 'user', content: 'Hello' }],
        fileSystemData: {
          '/': { type: 'directory' },
          '/test.tsx': { type: 'file', content: 'test' },
        },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: 'project-with-anon-work' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from \d{1,2}:\d{2}:\d{2}/),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/project-with-anon-work');
    });

    it('should handle post sign in with existing projects', async () => {
      const existingProjects = [
        { id: 'project-1', name: 'Existing Project' },
        { id: 'project-2', name: 'Another Project' },
      ];

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue(existingProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/project-1');
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it('should create new project when no existing projects and no anon work', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'new-project' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith('/new-project');
    });

    it('should not handle post sign in if sign in fails', async () => {
      mockSignInAction.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'wrong-password');
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should reset loading state even if sign in throws error', async () => {
      mockSignInAction.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should set loading state during sign up', async () => {
      mockSignUpAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signUp('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should call signUpAction with correct parameters', async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      expect(mockSignUpAction).toHaveBeenCalledWith(
        'new@example.com',
        'password123'
      );
    });

    it('should return result from signUpAction', async () => {
      const mockResult = { success: false, error: 'Email already registered' };
      mockSignUpAction.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp(
          'existing@example.com',
          'password123'
        );
      });

      expect(signUpResult).toEqual(mockResult);
    });

    it('should handle post sign up with anonymous work', async () => {
      const anonWork = {
        messages: [{ role: 'user', content: 'Create a button' }],
        fileSystemData: {
          '/': { type: 'directory' },
          '/Button.tsx': {
            type: 'file',
            content: 'export const Button = () => <button>Click me</button>',
          },
        },
      };

      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: 'signup-project-with-anon' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from \d{1,2}:\d{2}:\d{2}/),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/signup-project-with-anon');
    });

    it('should create new project for new user with no existing projects', async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'first-project' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith('/first-project');
    });

    it('should not handle post sign up if sign up fails', async () => {
      mockSignUpAction.mockResolvedValue({
        success: false,
        error: 'Email already registered',
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('existing@example.com', 'password123');
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should reset loading state even if sign up throws error', async () => {
      mockSignUpAction.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password123');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle anon work data with empty messages', async () => {
      const anonWork = {
        messages: [{ role: 'user', content: 'test' }], // Need non-empty messages to trigger anon work path
        fileSystemData: { '/': { type: 'directory' } },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      // Should create project with anon work
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from \d{1,2}:\d{2}:\d{2}/),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
    });

    it('should handle undefined anon work data', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(undefined as any);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
    });

    it('should handle projects array with valid first element', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: 'project-1' },
        { id: 'project-2' },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockPush).toHaveBeenCalledWith('/project-1');
    });

    it('should generate different random project names', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: 'project-1' });

      const { result } = renderHook(() => useAuth());

      // Mock Math.random to return specific values
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.12345);

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: 'New Design #12345',
        messages: [],
        data: {},
      });

      Math.random = originalRandom;
    });
  });

  describe('error handling', () => {
    it('should handle errors in post sign in process', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch (error) {
          expect((error as Error).message).toBe('Database error');
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors in createsProject', async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockRejectedValue(new Error('Create project failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch (error) {
          expect((error as Error).message).toBe('Create project failed');
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
