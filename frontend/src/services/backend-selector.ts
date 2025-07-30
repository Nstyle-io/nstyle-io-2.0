// Backend service selector - allows switching between Firebase and Supabase
export type BackendProvider = 'firebase' | 'supabase';

export class BackendSelector {
  private static currentProvider: BackendProvider = 'supabase';

  static setProvider(provider: BackendProvider) {
    this.currentProvider = provider;
    localStorage.setItem('backend-provider', provider);
  }

  static getProvider(): BackendProvider {
    const stored = localStorage.getItem('backend-provider') as BackendProvider;
    return stored || this.currentProvider;
  }

  static isFirebase(): boolean {
    return this.getProvider() === 'firebase';
  }

  static isSupabase(): boolean {
    return this.getProvider() === 'supabase';
  }
}