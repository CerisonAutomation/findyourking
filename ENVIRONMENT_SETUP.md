# Environment Configuration Guide

## Overview

The Find Your King uses a comprehensive environment configuration system that combines the best features from
both the original Find Your King platform and FindYourKingZero. This guide explains how to set up and configure your
environment
variables for different deployment scenarios.

## Environment Files

### 1. `.env.example`

- **Purpose**: Template for all possible environment variables
- **Usage**: Reference for all available configuration options
- **Contains**: Complete list of all supported environment variables

### 2. `.env.local.example`

- **Purpose**: Development environment template
- **Usage**: Copy to `.env.local` for local development
- **Contains**: Development-specific configurations with example values

### 3. `.env.production.example`

- **Purpose**: Production environment template
- **Usage**: Copy to `.env.production` for production deployment
- **Contains**: Production-specific configurations with security best practices

## Quick Setup

### Development Environment

```bash
# Copy the development template
cp .env.local.example .env.local

# Edit with your actual values
nano .env.local
```

### Production Environment

```bash
# Copy the production template
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

## Configuration Categories

### 🔐 Supabase Configuration

**Required**: These are essential for the application to function.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**How to get these values**:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing
3. Go to Project Settings > API
4. Copy the URL and keys

### 🤖 AI & LLM Configuration

**Primary**: OpenRouter (recommended for free tier)

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

**Alternative**: OpenAI

```bash
OPENAI_API_KEY=sk-proj-...
```

**Advanced**: Additional AI services

```bash
VITE_EMERGENT_LLM_KEY=your_emergent_llm_key
VITE_PICOVOICE_ACCESS_KEY=your_picovoice_access_key
```

### 🌐 P2P & WebRTC Configuration

**Trystero Configuration**:

```bash
NEXT_PUBLIC_TRYSTERO_APP_ID=findyourking-platform-v1
NEXT_PUBLIC_TRYSTERO_STRATEGY=nostr
```

**TURN Server** (for WebRTC connectivity):

```bash
NEXT_PUBLIC_TURN_URL=turn:global.relay.metered.ca:80
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_credential
```

**WebTorrent Tracker** (optional):

```bash
WEBTORRENT_TRACKER_URL=wss://tracker.openwebtorrent.com
```

### 🗺️ Mapping & Location Services

```bash
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key
```

**How to get MapTiler key**:

1. Go to [maptiler.com](https://www.maptiler.com)
2. Sign up for free account
3. Get your API key from dashboard

### 💳 Payment Configuration (Stripe)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get Stripe keys**:

1. Go to [stripe.com](https://stripe.com)
2. Create account
3. Get keys from Dashboard > Developers > API keys

### 📧 Email & Notifications

**SendGrid**:

```bash
SENDGRID_API_KEY=SG.your_sendgrid_key
```

**Firebase Cloud Messaging**:

```bash
NEXT_PUBLIC_FCM_VAPID_KEY=your_fcm_vapid_key
```

### 📊 Analytics & Monitoring

**Sentry** (error tracking):

```bash
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Google Analytics**:

```bash
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX
```

### ⚙️ Feature Flags

Control application features dynamically:

```bash
VITE_ENABLE_AI_MATCHING=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_STORYBOOK=true
VITE_ENABLE_QUICKSHARE=true
VITE_ENABLE_VOICE_COMMANDS=true
```

### 🔧 Development Configuration

```bash
NODE_ENV=development
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
VITE_MOCK_API=false
```

### 🌍 Application Configuration

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Find Your King
```

## Security Best Practices

### 1. Never Commit Environment Files

Always add these to your `.gitignore`:

```gitignore
.env.local
.env.production
.env
```

### 2. Use Different Keys for Different Environments

- Development: Use test/development keys
- Production: Use production keys only

### 3. Rotate Keys Regularly

- Update API keys periodically
- Monitor for compromised keys
- Have a key rotation strategy

### 4. Principle of Least Privilege

- Use the minimum required permissions
- Separate read/write permissions where possible
- Use service accounts instead of personal accounts

## Environment-Specific Notes

### Development Environment

- Use localhost URLs
- Enable debug logging
- Use test API keys
- Enable mock services if needed

### Production Environment

- Use HTTPS URLs
- Disable debug logging
- Use production API keys
- Enable all security features
- Set up proper monitoring

## Troubleshooting

### Common Issues

1. **Supabase Connection Failed**
    - Check URL and keys are correct
    - Verify project is active
    - Check network connectivity

2. **AI Services Not Working**
    - Verify API keys are valid
    - Check API quota limits
    - Ensure correct model names

3. **WebRTC Connection Issues**
    - Check TURN server configuration
    - Verify firewall settings
    - Test with different networks

4. **Stripe Integration Problems**
    - Verify webhook endpoint configuration
    - Check webhook signature
    - Ensure correct currency settings

### Validation Commands

```bash
# Test environment variables
npm run env:validate

# Check required variables
npm run env:check

# Show current configuration
npm run env:show
```

## Migration from Other Projects

If you're migrating from FindYourKingZero or another project:

1. **VITE to NEXT_PUBLIC prefix**: Convert `VITE_*` variables to `NEXT_PUBLIC_*`
2. **Supabase keys**: Ensure you have both anon and service role keys
3. **Feature flags**: Review and adjust feature flags as needed
4. **API endpoints**: Update URLs to match Next.js structure

## Support

For environment configuration issues:

1. Check this documentation first
2. Review the error messages in your application
3. Check the respective service documentation (Supabase, Stripe, etc.)
4. Create an issue in the project repository

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
