# Netlify Setup for Angular

## 1. Install Netlify CLI

```bash
npm install -g netlify-cli
netlify login
```

## 2. `netlify.toml` (place in project root)

```toml
[build]
  command = "ng build --configuration production"
  publish = "dist/<project-name>/browser"

# SPA redirect — Angular handles routing client-side
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"

# Optional: Netlify Functions (serverless)
[functions]
  directory = "netlify/functions"
```

> ⚠️ Replace `<project-name>` with the actual project name from `angular.json` → `projects.<name>.architect.build.options.outputPath`.

## 3. Environment Variables

Set in Netlify dashboard → Site settings → Environment variables:

```
NG_APP_API_URL=https://your-api.example.com/api
```

Then in `environment.production.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: process.env['NG_APP_API_URL'] ?? '',
};
```

For Angular 16+ you can use `NG_APP_` prefix for auto-injection with `@angular/build`:

```typescript
// environment.production.ts
declare const process: { env: Record<string, string> };
```

## 4. Netlify Functions (Serverless — optional)

```bash
mkdir -p netlify/functions
```

```typescript
// netlify/functions/hello.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Netlify Function' }),
  };
};
```

Accessible at `/.netlify/functions/hello` in dev and production.

Install types:
```bash
npm install -D @netlify/functions
```

## 5. Local Dev with Netlify

```bash
netlify dev
# Serves Angular on :8888, proxies functions automatically
```

## 6. Deploy

```bash
# Link to existing site
netlify link

# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## 7. Security Headers (add to `netlify.toml`)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    Permissions-Policy = "geolocation=(), microphone=()"
```

## 8. `.gitignore` additions

```
.netlify/
netlify/functions/*.js
netlify/functions/*.map
```
