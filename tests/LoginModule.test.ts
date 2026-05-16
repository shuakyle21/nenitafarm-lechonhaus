import { describe, it, expect } from 'vitest';
import { getLoginErrorMessage } from '../src/components/LoginModule';

describe('LoginModule - Error Messages', () => {
  describe('getLoginErrorMessage', () => {
    it('returns "Invalid username or password" when no data is returned', () => {
      expect(getLoginErrorMessage('NO_DATA')).toBe('Invalid username or password');
    });

    it('returns a network-specific message for fetch/connection errors', () => {
      const error = new Error('Failed to fetch');
      expect(getLoginErrorMessage('RPC_ERROR', error)).toBe(
        'Connection error. Please check your internet and try again.'
      );
    });

    it('returns a network-specific message for TypeError (network)', () => {
      const error = new TypeError('NetworkError when attempting to fetch resource');
      expect(getLoginErrorMessage('RPC_ERROR', error)).toBe(
        'Connection error. Please check your internet and try again.'
      );
    });

    it('returns a timeout message for timeout errors', () => {
      const error = new Error('Timeout');
      (error as any).code = 'PGRST301';
      expect(getLoginErrorMessage('RPC_ERROR', error)).toBe(
        'Request timed out. Please try again.'
      );
    });

    it('returns a generic message for unknown Supabase RPC errors', () => {
      const error = new Error('Something weird happened');
      expect(getLoginErrorMessage('RPC_ERROR', error)).toBe(
        'An error occurred during login. Please try again.'
      );
    });

    it('returns a generic message when error type is unknown', () => {
      expect(getLoginErrorMessage('UNKNOWN')).toBe(
        'An error occurred during login. Please try again.'
      );
    });
  });
});
