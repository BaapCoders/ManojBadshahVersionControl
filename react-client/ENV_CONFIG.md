# Environment Configuration Guide

## Overview

This Adobe Express Add-on uses **build-time environment variables** injected via webpack's DefinePlugin. This approach is recommended for Adobe Express Add-ons as they don't support runtime environment variables like traditional Node.js applications.

## Setup

### 1. Create your `.env` file

Copy the example file and customize it:

```bash
cp .env.example .env
```

### 2. Configure your environment variables

Edit `.env` with your settings:

```bash
# Backend API URL (Node.js server)
REACT_APP_API_URL=http://localhost:8080

# Python Server URL (for AI asset generation)
REACT_APP_PYTHON_SERVER_URL=http://127.0.0.1:8000

# App metadata
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=true
```

### 3. Build and run

```bash
npm run build
npm run start
```

The environment variables will be injected at build time.

## How It Works

### 1. **Webpack Configuration** (`webpack.config.js`)

The webpack config reads the `.env` file and injects variables using `DefinePlugin`:

```javascript
const webpack = require("webpack");
const fs = require("fs");

// Load .env file
function loadEnvVariables() {
  // ... parsing logic
}

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify({
        API_URL: envVars.API_URL,
        PYTHON_SERVER_URL: envVars.PYTHON_SERVER_URL,
        // ...
      })
    })
  ]
};
```

### 2. **Configuration Module** (`src/config/env.ts`)

Provides type-safe access to environment variables:

```typescript
// Access the webpack-injected __ENV__ global
declare const __ENV__: EnvironmentConfig;

export const config = {
  API_URL: __ENV__.API_URL || 'http://localhost:8080',
  PYTHON_SERVER_URL: __ENV__.PYTHON_SERVER_URL || 'http://127.0.0.1:8000',
  // ...
};

// Named exports for convenience
export const API_URL = config.API_URL;
export const PYTHON_SERVER_URL = config.PYTHON_SERVER_URL;
```

### 3. **Usage in Components**

Import and use the configuration:

```typescript
import { API_URL } from '../config/env';

const response = await fetch(`${API_URL}/api/briefs`);
```

## Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REACT_APP_API_URL` | Backend Node.js API URL | `http://localhost:8080` | `https://api.example.com` |
| `REACT_APP_PYTHON_SERVER_URL` | Python AI server URL | `http://127.0.0.1:8000` | `http://localhost:8000` |
| `REACT_APP_VERSION` | App version | `1.0.0` | `1.2.0` |
| `REACT_APP_DEBUG` | Enable debug logging | `true` | `false` |

## Production Configuration

For production builds:

1. Create a `.env.production` file:

```bash
# Production Backend
REACT_APP_API_URL=https://api.yourdomain.com

# Production Python Server
REACT_APP_PYTHON_SERVER_URL=https://ai.yourdomain.com

# Production settings
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=false
```

2. Update `webpack.config.js` to use different env files based on mode:

```javascript
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env';
```

3. Set NODE_ENV when building:

```bash
NODE_ENV=production npm run build
```

## Updated Files

### Files Modified

1. **`webpack.config.js`** - Added DefinePlugin for environment injection
2. **`src/pages/InboxPage.tsx`** - Uses `API_URL` from config
3. **`src/features/assetService.ts`** - Uses `PYTHON_SERVER_URL` from config
4. **`src/features/localizationService.ts`** - Uses `PYTHON_SERVER_URL` from config
5. **`src/features/versionService.ts`** - Uses `API_URL` from config

### Files Created

1. **`src/config/env.ts`** - Centralized environment configuration
2. **`.env.example`** - Example environment file
3. **`.env`** - Your local environment (git-ignored)
4. **`.gitignore`** - Ignores .env files

## Why Build-Time Variables?

Adobe Express Add-ons run in a sandboxed iframe environment where:

- ❌ No access to Node.js `process.env`
- ❌ No server-side rendering
- ❌ Runtime environment variables don't work

✅ **Solution**: Build-time injection via webpack DefinePlugin

The variables are replaced at build time, becoming part of the compiled JavaScript bundle.

## Troubleshooting

### Variables not updating?

1. **Rebuild the project**: Changes to `.env` require a rebuild
   ```bash
   npm run build
   ```

2. **Check webpack config**: Ensure DefinePlugin is properly configured

3. **Clear dist folder**: Sometimes cached builds cause issues
   ```bash
   npm run clean
   npm run build
   ```

### Getting undefined values?

1. **Check variable naming**: Must start with `REACT_APP_`
2. **Check .env syntax**: No spaces around `=`
   ```bash
   # ✅ Correct
   REACT_APP_API_URL=http://localhost:8080
   
   # ❌ Wrong
   REACT_APP_API_URL = http://localhost:8080
   ```

### TypeScript errors?

Add type definitions for `__ENV__` in your `global.d.ts`:

```typescript
declare const __ENV__: {
  API_URL: string;
  PYTHON_SERVER_URL: string;
  VERSION: string;
  DEBUG: boolean;
};
```

## Best Practices

1. ✅ **Never commit `.env`** - It's in `.gitignore`
2. ✅ **Always provide `.env.example`** - For team members
3. ✅ **Use meaningful defaults** - Fallbacks in `env.ts`
4. ✅ **Prefix with `REACT_APP_`** - Convention for clarity
5. ✅ **Document all variables** - In `.env.example` and this README
6. ✅ **Use TypeScript** - Type-safe configuration access

## Related Documentation

- [Adobe Express Add-on Development](https://developer.adobe.com/express/add-ons/docs/)
- [Webpack DefinePlugin](https://webpack.js.org/plugins/define-plugin/)
- [Adobe Add-on CLI](https://developer.adobe.com/express/add-ons/docs/guides/getting_started/local_development/dev_tooling/)

## Migration from Hardcoded URLs

Before:
```typescript
const response = await fetch('http://localhost:8080/api/briefs');
```

After:
```typescript
import { API_URL } from '../config/env';
const response = await fetch(`${API_URL}/api/briefs`);
```

## Security Notes

- ⚠️ Build-time variables are **visible in the client bundle**
- ⚠️ Don't store secrets or API keys in frontend environment variables
- ⚠️ Use backend proxies for sensitive API calls
- ✅ Store secrets in backend environment variables only

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [Adobe Express Add-on docs](https://developer.adobe.com/express/add-ons/docs/)
3. Check webpack build logs for errors
