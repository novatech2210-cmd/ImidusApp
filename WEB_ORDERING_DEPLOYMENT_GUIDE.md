# IMIDUSAPP Web Ordering Platform - Deployment Guide
## Production Deployment & Operations Manual

**Version:** 1.0
**Last Updated:** March 20, 2026
**Audience:** DevOps, Infrastructure, Technical Leads
**Status:** Ready for Production

---

## 🚀 QUICK START (5 Minutes)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/novatech642/pos-integration.git
cd /home/kali/Desktop/TOAST/src/web

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and database credentials

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:3000
```

### Production Build

```bash
# 1. Build optimized bundle
npm run build

# 2. Start production server
npm start

# 3. Server runs on port 3000
# http://localhost:3000
```

---

## 🏢 DEPLOYMENT PLATFORMS

### Option 1: Vercel (Recommended - 15 minutes)

**Best for:** Fastest deployment, automatic scaling, built for Next.js

#### Step 1: Connect GitHub
```
1. Go to https://vercel.com
2. Sign up / Login
3. Click "New Project"
4. Select "GitHub" as source
5. Authorize Vercel access
6. Select "pos-integration" repository
7. Import project
```

#### Step 2: Configure Environment
```
In Vercel Dashboard → Settings → Environment Variables:

Name: NEXT_PUBLIC_API_URL
Value: https://api.imidus.com (production API)

Name: DATABASE_URL
Value: Server=your-sql-server;Database=INI_Restaurant;User ID=sa;Password=xxx;

Name: JWT_SECRET
Value: [generate 32+ character random string]

Name: NEXT_PUBLIC_AUTHORIZE_NET_LOGIN_ID
Value: 9JQVwben66U7

Name: NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY
Value: [your client key]
```

#### Step 3: Deploy
```
1. Click "Deploy" button
2. Wait 2-3 minutes for build
3. View deployment at: https://imidus-ordering-prod.vercel.app
```

#### Step 4: Configure Custom Domain
```
1. Go to Vercel → Settings → Domains
2. Add domain: imidus-ordering.com
3. Follow DNS configuration steps
4. Wait for SSL certificate (auto-generated)
```

#### Vercel Environment Setup Complete!

**URL:** https://imidus-ordering.com
**Auto Scaling:** ✅ Enabled
**SSL Certificate:** ✅ Automatic
**CDN:** ✅ Global
**Monitoring:** ✅ Built-in

---

### Option 2: Azure App Service (30 minutes)

**Best for:** Enterprise, integration with Azure services, dedicated support

#### Step 1: Create App Service
```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name imidus-rg \
  --location eastus

# Create App Service Plan
az appservice plan create \
  --name imidus-plan \
  --resource-group imidus-rg \
  --sku B2 \
  --is-linux

# Create web app
az webapp create \
  --resource-group imidus-rg \
  --plan imidus-plan \
  --name imidus-ordering-app \
  --runtime "node|18-lts"
```

#### Step 2: Configure Application Settings
```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group imidus-rg \
  --name imidus-ordering-app \
  --settings \
    NEXT_PUBLIC_API_URL="https://api.imidus.com" \
    DATABASE_URL="Server=your-sql-server;Database=INI_Restaurant;User ID=sa;Password=xxx;" \
    JWT_SECRET="[32+ char random string]" \
    WEBSITE_NODE_DEFAULT_VERSION="18" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

#### Step 3: Deploy Code
```bash
# Build locally
npm run build

# Create deployment package
zip -r deploy.zip .next package.json package-lock.json node_modules public

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group imidus-rg \
  --name imidus-ordering-app \
  --src deploy.zip

# Verify deployment
az webapp show \
  --resource-group imidus-rg \
  --name imidus-ordering-app \
  --query "defaultHostName"
```

#### Step 4: Configure Custom Domain
```bash
# Bind custom domain
az webapp config hostname add \
  --resource-group imidus-rg \
  --webapp-name imidus-ordering-app \
  --hostname imidus-ordering.com

# Create SSL certificate
az appservice plan update \
  --resource-group imidus-rg \
  --name imidus-plan \
  --sku S1  # Premium tier for SSL

# Configure HTTPS-only
az webapp update \
  --resource-group imidus-rg \
  --name imidus-ordering-app \
  --set httpsOnly=true
```

#### Azure Deployment Complete!

**URL:** https://imidus-ordering-app.azurewebsites.net
**Management:** Azure Portal
**Scaling:** ✅ Vertical & Horizontal
**Monitoring:** ✅ Application Insights
**Backup:** ✅ Automatic

---

### Option 3: AWS (Docker + ECS) (45 minutes)

**Best for:** Full control, microservices architecture, cost optimization

#### Step 1: Create Docker Image
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy build output
COPY .next ./.next
COPY public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t imidus-ordering:1.0.0 .

# Tag for ECR
docker tag imidus-ordering:1.0.0 \
  123456789.dkr.ecr.us-east-1.amazonaws.com/imidus-ordering:1.0.0

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/imidus-ordering:1.0.0
```

#### Step 2: Create ECS Cluster
```bash
# Create cluster
aws ecs create-cluster --cluster-name imidus-prod

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

#### Step 3: Create ECS Service
```bash
# Create service
aws ecs create-service \
  --cluster imidus-prod \
  --service-name imidus-ordering \
  --task-definition imidus-ordering:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=imidus-ordering,containerPort=3000 \
  --network-configuration awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx]}
```

#### Step 4: Setup Load Balancer & CDN
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name imidus-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create CloudFront distribution
aws cloudfront create-distribution \
  --cli-input-json file://cloudfront-config.json
```

#### AWS Deployment Complete!

**URL:** https://imidus-ordering.com (via CloudFront)
**Scaling:** ✅ Auto-scaling (ECS)
**Load Balancing:** ✅ ALB
**CDN:** ✅ CloudFront
**Monitoring:** ✅ CloudWatch

---

## 📋 ENVIRONMENT CONFIGURATION

### Environment Variables Reference

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.imidus.com     # Backend API URL
NEXT_PUBLIC_APP_NAME=IMIDUSAPP                 # App display name

# Payment Gateway
NEXT_PUBLIC_AUTHORIZE_NET_LOGIN_ID=9JQVwben66U7
NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY=xxxxx     # Get from Authorize.net

# Database
DATABASE_URL=Server=sql-server;Database=INI_Restaurant;User ID=sa;Password=xxx;
# Format: Server={host};Database={db};User ID={user};Password={pass};

# Authentication
JWT_SECRET=generate-random-32-character-string-here-min
JWT_EXPIRATION=24h

# Payment Webhooks
PAYMENT_WEBHOOK_SECRET=webhook-secret-key

# Email Configuration (for future notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxx

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxx@sentry.io/xxxxx

# Feature Flags
ENABLE_LOYALTY_POINTS=true
ENABLE_SCHEDULED_ORDERS=false
ENABLE_MERCHANT_PORTAL=true
```

### Production vs Development

```bash
# Development (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5004
DATABASE_URL=Server=localhost;Database=INI_Restaurant;...
JWT_SECRET=dev-secret-any-string

# Staging (.env.staging)
NEXT_PUBLIC_API_URL=https://staging-api.imidus.com
DATABASE_URL=Server=staging-db;Database=INI_Restaurant;...
JWT_SECRET=staging-secret-string

# Production (.env.production)
NEXT_PUBLIC_API_URL=https://api.imidus.com
DATABASE_URL=Server=prod-db;Database=INI_Restaurant;...
JWT_SECRET=very-secure-random-string-min-32-chars
```

---

## 🔧 POST-DEPLOYMENT SETUP

### Step 1: Verify Deployment

```bash
# Check application is running
curl https://imidus-ordering.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-03-20T..."}

# Check NextJS build info
curl https://imidus-ordering.com/_next/static/__BUILD_ID__

# Monitor error logs
# Vercel: Dashboard → Deployments → Logs
# Azure: Portal → Diagnostic settings → App Insights
# AWS: CloudWatch → Logs → /ecs/imidus-ordering
```

### Step 2: Configure SSL Certificate

```bash
# Vercel: Automatic ✅
# Azure: Automatic with custom domain ✅
# AWS: Use ACM (AWS Certificate Manager)
aws acm request-certificate \
  --domain-name imidus-ordering.com \
  --domain-name "*.imidus-ordering.com" \
  --validation-method DNS
```

### Step 3: Setup Monitoring

#### Sentry (Error Tracking)
```javascript
// app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

#### Google Analytics
```javascript
// components/Analytics.tsx
import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `,
        }}
      />
    </>
  );
}
```

### Step 4: Setup Backups

```bash
# Database backup (daily at 2 AM)
# SQL Server Management Studio → Maintenance Plans
# Or use Azure automated backups

# Application backup
# Vercel: Automatic (version history)
# Azure: Enable continuous backup in settings
# AWS: Use EBS snapshots + RDS backups
```

### Step 5: Setup CDN & Caching

```bash
# Vercel: Automatic global CDN ✅

# Azure: Configure CDN
az cdn endpoint create \
  --resource-group imidus-rg \
  --profile-name imidus-cdn \
  --name imidus-ordering \
  --origin imidus-ordering-app.azurewebsites.net

# AWS: CloudFront cache policy
# - Static assets: 30 days
# - HTML: 1 hour
# - API routes: No cache
```

---

## 📊 MONITORING & ALERTS

### Key Metrics to Monitor

```
Website Performance:
- Page load time (target: < 2.5s)
- API response time (target: < 1s)
- Error rate (target: < 0.1%)
- Uptime (target: 99.9%)

Business Metrics:
- Orders per hour
- Conversion rate
- Average order value
- Cart abandonment rate

Technical Metrics:
- CPU usage (target: < 70%)
- Memory usage (target: < 80%)
- Database connections
- API rate limits
```

### Setup Alerts

```bash
# Vercel: Dashboard → Settings → Alerts
# - Deployment failures
# - Performance degradation
# - Error spike

# Azure: Alert Rules
az monitor metrics alert create \
  --resource-group imidus-rg \
  --scopes /subscriptions/.../resourceGroups/imidus-rg/providers/Microsoft.Web/sites/imidus-ordering-app \
  --condition "avg HttpResponseTime > 3000" \
  --name "High response time"

# AWS: CloudWatch Alarms
aws cloudwatch put-metric-alarm \
  --alarm-name imidus-cpu-high \
  --alarm-description "Alert if CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔄 UPDATES & ROLLBACK

### Deploying Updates

```bash
# 1. Test locally
npm run dev

# 2. Commit and push to GitHub
git add .
git commit -m "feat: add feature name"
git push origin main

# Vercel: Automatic deployment on push ✅

# 3. Monitor deployment
# Vercel: https://vercel.com/deployments
# Azure: Portal → Deployment Center
# AWS: CloudWatch → Deployments
```

### Rollback Procedure

```bash
# Vercel: Dashboard → Deployments → Select previous → Redeploy

# Azure: Deployment slots
az webapp swap \
  --resource-group imidus-rg \
  --name imidus-ordering-app \
  --slot staging

# AWS: ECS previous task definition
aws ecs update-service \
  --cluster imidus-prod \
  --service imidus-ordering \
  --task-definition imidus-ordering:2  # Previous version
```

---

## 🛡️ SECURITY HARDENING

### Step 1: Enable HTTPS Only

```bash
# Vercel: Automatic ✅

# Azure:
az webapp update \
  --resource-group imidus-rg \
  --name imidus-ordering-app \
  --set httpsOnly=true

# AWS: ALB listener rules (HTTP → HTTPS redirect)
```

### Step 2: Configure CORS

```typescript
// lib/api.ts
const corsOptions = {
  origin: ['https://imidus-ordering.com', 'https://www.imidus-ordering.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Step 3: Setup Rate Limiting

```bash
# Cloudflare (if using as DNS)
# - DDoS protection: Enabled
# - Rate limiting: 10 req/s per IP
# - WAF rules: OWASP Top 10

# Azure Rate Limiting
az api management api operation policy create \
  --api-id imidus-api \
  --operation-id getMenu \
  --policy-name rate-limit
```

### Step 4: Enable Security Headers

```typescript
// next.config.ts
headers: async () => [
  {
    source: '/:path*',
    headers: [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net"
      }
    ]
  }
]
```

---

## 🚨 TROUBLESHOOTING

### Issue: Application won't start
```bash
# Check logs
# Vercel: Dashboard → Deployments → Logs
# Azure: Portal → App Service logs
# AWS: CloudWatch Logs

# Common fixes:
1. Verify all environment variables are set
2. Check database connection string
3. Ensure backend API is running
4. Clear .next build cache
```

### Issue: High response times
```bash
# Check database performance
# SQL Server Management Studio → Query Performance

# Check API response times
# Backend logs / Application Insights

# Optimize:
1. Add database indexes
2. Cache frequently accessed data
3. Optimize images
4. Enable gzip compression
```

### Issue: Deployment fails
```bash
# Check build logs
npm run build

# Common causes:
1. TypeScript errors: npx tsc --noEmit
2. Missing dependencies: npm install
3. Environment variables: Check .env.local
4. Node version mismatch: Use node 18+
```

---

## 📞 SUPPORT & RUNBOOKS

### Emergency Contacts
```
DevOps Lead:        Chris (novatech2210@gmail.com)
Database Admin:     [Database team contact]
Infrastructure:     [Cloud team contact]
24/7 On-call:       [On-call rotation schedule]
```

### Incident Response

**Website Down:**
1. Check status dashboard
2. View application logs
3. Check database connectivity
4. Restart application service
5. If not resolved: Rollback last deployment

**High Error Rate:**
1. Check error logs (Sentry)
2. Monitor database queries
3. Check API response times
4. Scale application if needed

**Database Issues:**
1. Check database connections
2. Monitor query performance
3. Check disk space
4. Restart database service if needed

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Application is running and healthy
- [ ] SSL certificate is valid
- [ ] Custom domain is configured
- [ ] Monitoring is active
- [ ] Alerts are configured
- [ ] Backups are scheduled
- [ ] CDN is serving content
- [ ] Performance is acceptable
- [ ] Security headers are set
- [ ] Database is connected
- [ ] Payment processing works
- [ ] Email notifications work (future)
- [ ] Analytics are tracking
- [ ] Team is trained
- [ ] Documentation is updated

---

## 📚 ADDITIONAL RESOURCES

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Platform Guide](https://vercel.com/docs)
- [Azure App Service Guide](https://docs.microsoft.com/en-us/azure/app-service/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)

---

**Version:** 1.0
**Last Updated:** March 20, 2026
**Status:** Production Ready

**Deployment successful!** 🚀
