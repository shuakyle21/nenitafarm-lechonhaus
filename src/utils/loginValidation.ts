export function getLoginErrorMessage(
  type: 'NO_DATA' | 'RPC_ERROR' | 'UNKNOWN',
  error?: any
): string {
  if (type === 'NO_DATA') {
    return 'Invalid username or password';
  }

  if (type === 'RPC_ERROR' && error) {
    const message = error?.message || '';

    if (
      error instanceof TypeError ||
      message.toLowerCase().includes('fetch') ||
      message.toLowerCase().includes('network')
    ) {
      return 'Connection error. Please check your internet and try again.';
    }

    if (error?.code === 'PGRST301' || message.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
  }

  return 'An error occurred during login. Please try again.';
}
