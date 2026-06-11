# Firebase Setup for Angular

## 1. Install Firebase Tools

```bash
npm install -g firebase-tools
firebase login
```

## 2. Install AngularFire

```bash
ng add @angular/fire
# Select: Firestore, Authentication, Hosting (choose what you need)
```

`ng add` auto-configures `app.config.ts` and creates `firebase.json`.

Or manually:
```bash
npm install @angular/fire firebase
```

## 3. Firebase Config (`environment.ts`)

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

> ⚠️ Never commit real API keys. Use environment variables in CI. Firebase API keys for web are public by nature but restrict them in the Firebase console (HTTP referrers, APIs).

## 4. App Config (`app.config.ts`)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
```

## 5. Firebase Auth Service (replaces or extends AuthService)

If using Firebase Auth instead of custom JWT:

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Firebase user as a signal
  readonly currentUser = toSignal(user(this.auth));
  readonly isAuthenticated = computed(() => !!this.currentUser());

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    return signOut(this.auth);
  }

  async getToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? null;
  }
}
```

If using Firebase Auth, the `jwtInterceptor` should call `getToken()` as async:
```typescript
// For Firebase ID tokens, use withFetch + async interceptor pattern
```

## 6. Firestore Usage

```typescript
import { inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private firestore = inject(Firestore);

  getProducts() {
    const ref = collection(this.firestore, 'products');
    return toSignal(collectionData(ref, { idField: 'id' }), { initialValue: [] });
  }
}
```

## 7. Firestore Security Rules (in Firebase console or `firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Public read, authenticated write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 8. Firebase Hosting (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist/<project-name>/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

## 9. Cloud Functions (optional)

```bash
firebase init functions
# Choose TypeScript
cd functions && npm install
```

```typescript
// functions/src/index.ts
import { onRequest } from 'firebase-functions/v2/https';

export const helloWorld = onRequest((req, res) => {
  res.json({ message: 'Hello from Firebase Function!' });
});
```

Deploy:
```bash
firebase deploy --only functions
```

## 10. Emulators for Local Dev

```bash
firebase emulators:start
# Auth:      localhost:9099
# Firestore: localhost:8080
# Hosting:   localhost:5000
# Functions: localhost:5001
```

In `app.config.ts` for dev:
```typescript
import { connectAuthEmulator, getAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore } from '@angular/fire/firestore';

// Inside providers, after provideAuth/provideFirestore:
// (use a factory or APP_INITIALIZER if needed)
if (!environment.production) {
  connectAuthEmulator(getAuth(), 'http://localhost:9099');
  connectFirestoreEmulator(getFirestore(), 'localhost', 8080);
}
```

## 11. Deploy to Firebase Hosting

```bash
ng build --configuration production
firebase deploy --only hosting
```

## 12. `.gitignore` additions

```
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log
functions/lib/
```
