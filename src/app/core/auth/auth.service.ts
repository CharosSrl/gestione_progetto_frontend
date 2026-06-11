import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';

/**
 * Wraps Firebase Auth. Firebase is used purely to obtain an ID token, which the
 * HTTP interceptor attaches to every REST API call as `Authorization: Bearer`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  /** Current Firebase user as a signal (undefined while resolving, null when signed out). */
  readonly currentUser = toSignal(user(this.auth));

  readonly isAuthenticated = computed(() => !!this.currentUser());

  /** True once Firebase has emitted its first auth state (auth no longer "unknown"). */
  readonly authResolved = computed(() => this.currentUser() !== undefined);

  readonly displayName = computed(() => this.currentUser()?.displayName ?? null);
  readonly email = computed(() => this.currentUser()?.email ?? null);
  readonly photoURL = computed(() => this.currentUser()?.photoURL ?? null);

  loginWithGoogle(): Promise<unknown> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this.auth, provider);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  /** Fresh Firebase ID token for the current user, or null when signed out. */
  async getToken(): Promise<string | null> {
    return (await this.auth.currentUser?.getIdToken()) ?? null;
  }
}
