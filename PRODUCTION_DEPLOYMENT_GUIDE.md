# Production Deployment Guide - Find Your King

## Overview

This guide provides comprehensive instructions for deploying the Find Your King platform to production with enterprise-grade security, performance, and scalability.

## Prerequisites

### System Requirements
- **Node.js**: >= 20.0.0
- **PostgreSQL**: >= 16.0
- **Redis**: >= 7.0
- **Docker**: >= 24.0
- **Kubernetes**: >= 1.28 (optional)

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NEXT_PUBLIC_APP_URL=https://findyourking.app
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/findyourking
DATABASE_POOL_SIZE=100

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your_redis_password

# Authentication
NEXTAUTH_URL=https://findyourking.app
NEXTAUTH_SECRET=your_nextauth_secret_32_chars

# AI Services
HUGGINGFACE_API_KEY=your_hf_api_key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Storage (Optional)
AWS_S3_BUCKET=your_s3_bucket
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_VOICE_CONTROL=true
ENABLE_P2P=true
ENABLE_VIDEO_CALLS=true
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Build Docker Image

```bash
# Build production image
docker build -t findyourking:latest .

# Or use docker-compose
docker-compose -f docker-compose.prod.yml build
```

#### 2. Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    image: findyourking:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: findyourking
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: always

volumes:
  postgres_data:
  redis_data:
```

#### 3. Deploy

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Option 2: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: findyourking
spec:
  replicas: 3
  selector:
    matchLabels:
      app: findyourking
  template:
    metadata:
      labels:
        app: findyourking
    spec:
      containers:
      - name: findyourking
        image: findyourking:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: findyourking-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: findyourking-service
spec:
  selector:
    app: findyourking
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### 2. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace findyourking

# Apply secrets
kubectl apply -f k8s/secrets.yaml -n findyourking

# Apply deployment
kubectl apply -f k8s/deployment.yaml -n findyourking

# Check status
kubectl get pods -n findyourking
kubectl get services -n findyourking
```

### Option 3: Cloud Platform Deployment

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### AWS Amplify Deployment

```bash
# Install Amplify CLI
npm i -g @aws-amplify/cli

# Configure
amplify configure

# Initialize
amplify init

# Push
amplify push
```

## Database Setup

### 1. Run Migrations

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 2. Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_target_user_id ON matches(target_user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_location ON events USING GIST(location);
```

## SSL/TLS Configuration

### 1. Generate SSL Certificates

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d findyourking.app -d www.findyourking.app

# Or use Cloudflare SSL
# Configure in Cloudflare dashboard
```

### 2. Nginx Configuration

Create `/etc/nginx/sites-available/findyourking`:

```nginx
server {
    listen 80;
    server_name findyourking.app www.findyourking.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name findyourking.app www.findyourking.app;

    ssl_certificate /etc/letsencrypt/live/findyourking.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/findyourking.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install @sentry/nextjs

# Configure in next.config.mjs
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your existing config
}, {
  silent: true,
  org: "your-org",
  project: "findyourking",
});
```

### 2. Health Checks

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await db.execute('SELECT 1');
    
    // Check Redis connection
    // await redis.ping();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

### 3. Logging Configuration

```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

## Performance Optimization

### 1. CDN Configuration

```javascript
// next.config.mjs
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['cdn.findyourking.app'],
  },
};
```

### 2. Caching Strategy

```typescript
// src/lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(data));
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}
```

## Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API rate limiting enabled
- [ ] CORS configured properly
- [ ] CSP headers set
- [ ] XSS protection enabled
- [ ] SQL injection prevention
- [ ] Authentication secured
- [ ] Authorization implemented
- [ ] Audit logging enabled
- [ ] Backup strategy in place
- [ ] Disaster recovery plan
- [ ] Security headers configured
- [ ] Dependency vulnerabilities scanned

## Scaling Considerations

### Horizontal Scaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: findyourking-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: findyourking
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

```typescript
// Read replicas configuration
const dbConfig = {
  write: process.env.DATABASE_URL,
  read: process.env.DATABASE_READ_URL?.split(',') || [],
};
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   pg_isready -h host -p 5432
   
   # Check connection pool
   SELECT * FROM pg_stat_activity;
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Increase Node.js memory
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

3. **Performance Issues**
   ```bash
   # Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   
   # Check index usage
   SELECT * FROM pg_stat_user_indexes;
   ```

## Maintenance

### Regular Tasks

- [ ] Database backups (daily)
- [ ] Log rotation (weekly)
- [ ] Dependency updates (monthly)
- [ ] Security scans (monthly)
- [ ] Performance audits (quarterly)
- [ ] Disaster recovery tests (quarterly)

## Support

For production support:
- **Email**: support@findyourking.app
- **Documentation**: https://docs.findyourking.app
- **Status Page**: https://status.findyourking.app