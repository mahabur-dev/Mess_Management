import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import config from '../../config';

export type VerifiedGoogleIdentity = {
  uid: string;
  email: string;
  name: string;
  picture?: string;
};

@Injectable()
export class FirebaseAuthService {
  private app: App | null = null;

  private getApp() {
    if (this.app) return this.app;

    const { projectId, clientEmail, privateKey } = config.firebaseAuth;
    if (!projectId || !clientEmail || !privateKey) {
      throw new ServiceUnavailableException(
        'Google authentication is not configured',
      );
    }

    this.app =
      getApps().find((candidate) => candidate.name === 'messzen-auth') ||
      initializeApp(
        {
          credential: cert({ projectId, clientEmail, privateKey }),
          projectId,
        },
        'messzen-auth',
      );

    return this.app;
  }

  async verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    try {
      const decoded = await getAuth(this.getApp()).verifyIdToken(idToken, true);
      if (decoded.firebase?.sign_in_provider !== 'google.com') {
        throw new HttpException('Invalid Google authentication token', 401);
      }
      if (!decoded.email || decoded.email_verified !== true) {
        throw new HttpException('Google email is not verified', 401);
      }

      const email = decoded.email.trim().toLowerCase();
      const fallbackName = email.split('@')[0] || 'Messzen Member';
      const displayName = String(decoded.name || '').trim() || fallbackName;
      return {
        uid: decoded.uid,
        email,
        name: displayName.slice(0, 100),
        picture: decoded.picture,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Invalid Google authentication token', 401);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await getAuth(this.getApp()).deleteUser(uid);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';
      if (code === 'auth/user-not-found') return;
      throw error;
    }
  }
}
