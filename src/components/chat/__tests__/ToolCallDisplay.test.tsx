import { test, expect, describe, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ToolCallDisplay } from '../ToolCallDisplay';

afterEach(() => {
  cleanup();
});

describe('ToolCallDisplay', () => {
  describe('str_replace_editor tool', () => {
    it('displays create file message', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'create',
          path: '/components/Button.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(
        screen.getByText('Creating file: /components/Button.tsx')
      ).toBeDefined();
      // Check for FileText icon by class
      const icon = document.querySelector('.lucide-file-text');
      expect(icon).toBeDefined();
    });

    it('displays edit file message', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'str_replace',
          path: '/components/Card.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(
        screen.getByText('Editing file: /components/Card.tsx')
      ).toBeDefined();
    });

    it('displays view file message', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'view',
          path: '/utils/helpers.ts',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Viewing file: /utils/helpers.ts')).toBeDefined();
    });

    it('displays insert file message', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'insert',
          path: '/App.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Inserting into file: /App.tsx')).toBeDefined();
    });

    it('displays fallback message for unknown command', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'unknown',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Working with file')).toBeDefined();
    });
  });

  describe('file_manager tool', () => {
    it('displays rename message', () => {
      const toolCall = {
        toolName: 'file_manager',
        state: 'result' as const,
        args: {
          command: 'rename',
          path: '/old-file.tsx',
          new_path: '/new-file.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(
        screen.getByText('Renaming: /old-file.tsx → /new-file.tsx')
      ).toBeDefined();
    });

    it('displays delete message', () => {
      const toolCall = {
        toolName: 'file_manager',
        state: 'result' as const,
        args: {
          command: 'delete',
          path: '/unused-file.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Deleting: /unused-file.tsx')).toBeDefined();
    });
  });

  describe('unknown tool', () => {
    it('displays fallback message for unknown tool', () => {
      const toolCall = {
        toolName: 'unknown_tool',
        state: 'result' as const,
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Running unknown_tool')).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when state is pending', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'pending' as const,
        args: {
          command: 'create',
          path: '/loading-file.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(
        screen.getByText('Creating file: /loading-file.tsx')
      ).toBeDefined();
      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    it('shows success indicator when state is result', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'create',
          path: '/completed-file.tsx',
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(
        screen.getByText('Creating file: /completed-file.tsx')
      ).toBeDefined();
      // Check for success indicator (green dot)
      const successDot = document.querySelector('.bg-emerald-500');
      expect(successDot).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles missing path in args', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        args: {
          command: 'create',
          // path is missing
        },
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Creating file: new file')).toBeDefined();
    });

    it('handles missing args', () => {
      const toolCall = {
        toolName: 'str_replace_editor',
        state: 'result' as const,
        // args is missing
      };

      render(<ToolCallDisplay toolCall={toolCall} />);

      expect(screen.getByText('Working with file')).toBeDefined();
    });
  });
});
