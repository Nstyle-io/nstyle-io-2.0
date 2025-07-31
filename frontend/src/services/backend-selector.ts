// Backend service selector - allows switching between Firebase and Supabase
export type BackendProvider = 'firebase' | 'supabase';

export class BackendSelector {
  private static currentProvider: BackendProvider | null = null;

  static setProvider(provider: BackendProvider) {
    this.currentProvider = provider;
    localStorage.setItem('backend-provider', provider);
  }

  static getProvider(): BackendProvider {
    // Always check localStorage first, then fall back to cached value or default
    const stored = localStorage.getItem('backend-provider') as BackendProvider;
    if (stored && (stored === 'firebase' || stored === 'supabase')) {
      this.currentProvider = stored;
      return stored;
    }
    
    // If no stored value and no cached value, default to supabase
    if (!this.currentProvider) {
      this.currentProvider = 'supabase';
      localStorage.setItem('backend-provider', 'supabase');
    }
    
    return this.currentProvider;
  }

  static isFirebase(): boolean {
    return this.getProvider() === 'firebase';
  }

  static isSupabase(): boolean {
    return this.getProvider() === 'supabase';
  }
}