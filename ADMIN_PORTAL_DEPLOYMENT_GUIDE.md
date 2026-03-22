# IMIDUSAPP Admin Portal - Deployment & Operations Guide
## Production Deployment, Configuration, and Management

**Version:** 1.0
**Last Updated:** March 20, 2026
**Audience:** DevOps, Infrastructure, Merchant Operations
**Status:** Ready for Production Deployment

---

## 🚀 QUICK START (10 Minutes)

### Local Development

```bash
# 1. Navigate to web directory
cd /home/kali/Desktop/TOAST/src/web

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Edit .env.local with merchant credentials
# Set: JWT_SECRET, DATABASE_URL, API_URL

# 5. Start development server
npm run dev

# 6. Access admin portal
# http://localhost:3000/merchant/dashboard
# Login with merchant account
```

### Production Build

```bash
# 1. Build optimized bundle
npm run build

# 2. Start production server
npm start

# 3. Admin portal available at configured domain
# https://imidus-admin.your-domain.com
```

---

## 🏢 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended - 15 minutes)

#### Step 1: Connect GitHub Repository
```
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select "pos-integration" repository
5. Click "Import"
```

#### Step 2: Configure Environment Variables
```
In Vercel Dashboard → Settings → Environment Variables:

Name: NEXT_PUBLIC_API_URL
Value: https://api.imidus.com

Name: DATABASE_URL
Value: Server=your-sql-server;Database=INI_Restaurant;User ID=sa;Password=xxx;

Name: JWT_SECRET
Value: [Generate secure 32+ character string]
  Command: openssl rand -base64 32

Name: JWT_EXPIRATION
Value: 24h

Name: MERCHANT_ROLE
Value: merchant
```

#### Step 3: Deploy
```
1. Click "Deploy" in Vercel
2. Wait 2-3 minutes for build completion
3. View deployment at: https://imidus-admin-prod.vercel.app
4. Test login with merchant account
```

#### Step 4: Configure Custom Domain
```
1. Vercel Dashboard → Settings → Domains
2. Add domain: imidus-admin.com
3. Follow DNS configuration (CNAME record)
4. SSL certificate: Automatic (Let's Encrypt)
5. Wait 10-15 minutes for DNS propagation
```

**Vercel Deployment Complete!** ✅

---

### Option 2: Azure App Service (30 minutes)

#### Step 1: Create Infrastructure
```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name imidus-admin-rg \
  --location eastus

# Create App Service Plan (B2 = 2 cores, 3.5 GB RAM)
az appservice plan create \
  --name imidus-admin-plan \
  --resource-group imidus-admin-rg \
  --sku B2 \
  --is-linux

# Create web app
az webapp create \
  --resource-group imidus-admin-rg \
  --plan imidus-admin-plan \
  --name imidus-admin-portal \
  --runtime "node|18-lts"
```

#### Step 2: Configure Application
```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group imidus-admin-rg \
  --name imidus-admin-portal \
  --settings \
    NEXT_PUBLIC_API_URL="https://api.imidus.com" \
    DATABASE_URL="Server=your-sql-server;Database=INI_Restaurant;..." \
    JWT_SECRET="[32+ char secure string]" \
    JWT_EXPIRATION="24h" \
    MERCHANT_ROLE="merchant" \
    WEBSITE_NODE_DEFAULT_VERSION="18" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

#### Step 3: Deploy Code
```bash
# Navigate to web directory
cd /home/kali/Desktop/TOAST/src/web

# Build locally
npm run build

# Create deployment package
zip -r admin-deploy.zip .next package.json package-lock.json public

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group imidus-admin-rg \
  --name imidus-admin-portal \
  --src admin-deploy.zip

# Verify deployment
az webapp show \
  --resource-group imidus-admin-rg \
  --name imidus-admin-portal \
  --query "defaultHostName" --output tsv
```

#### Step 4: Setup HTTPS & Custom Domain
```bash
# Enable HTTPS-only
az webapp update \
  --resource-group imidus-admin-rg \
  --name imidus-admin-portal \
  --set httpsOnly=true

# Bind custom domain
az webapp config hostname add \
  --resource-group imidus-admin-rg \
  --webapp-name imidus-admin-portal \
  --hostname imidus-admin.com

# SSL certificate: Automatic with custom domain binding
```

**Azure Deployment Complete!** ✅

---

### Option 3: AWS (Docker + ECS) (45 minutes)

#### Step 1: Create ECR Repository
```bash
# Create repository
aws ecr create-repository \
  --repository-name imidus-admin \
  --region us-east-1

# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 2: Build & Push Docker Image
```dockerfile
# Dockerfile in /home/kali/Desktop/TOAST/src/web/
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./.next
COPY public ./public
COPY next.config.ts ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
```

```bash
# Build image
cd /home/kali/Desktop/TOAST/src/web
docker build -t imidus-admin:1.0.0 .

# Tag for ECR
docker tag imidus-admin:1.0.0 \
  123456789.dkr.ecr.us-east-1.amazonaws.com/imidus-admin:1.0.0

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/imidus-admin:1.0.0
```

#### Step 3: Create ECS Cluster & Service
```bash
# Create cluster
aws ecs create-cluster --cluster-name imidus-prod

# Register task definition
aws ecs register-task-definition \
  --family imidus-admin \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --container-definitions '[{
    "name": "imidus-admin",
    "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/imidus-admin:1.0.0",
    "portMappings": [{"containerPort": 3000}],
    "environment": [
      {"name": "NEXT_PUBLIC_API_URL", "value": "https://api.imidus.com"},
      {"name": "JWT_SECRET", "value": "xxx"}
    ]
  }]'

# Create service
aws ecs create-service \
  --cluster imidus-prod \
  --service-name imidus-admin \
  --task-definition imidus-admin:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Step 4: Setup Load Balancer & CDN
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name imidus-admin-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create CloudFront distribution
aws cloudfront create-distribution \
  --cli-input-json file://cloudfront-config.json
```

**AWS Deployment Complete!** ✅

---

## 🔧 POST-DEPLOYMENT SETUP

### Step 1: Verify Deployment

```bash
# Check application health
curl https://imidus-admin.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-03-20T..."}

# Check admin portal loads
# Visit: https://imidus-admin.com/merchant/dashboard
# Login with merchant credentials
```

### Step 2: Configure Merchant Users

```sql
-- Add merchant account to database
INSERT INTO tblUser (Username, Password, Role, RestaurantID)
VALUES ('merchant@imidus.com', 'HASHED_PASSWORD', 'merchant', 1)

-- Grant necessary permissions
INSERT INTO tblPermissions (UserID, Module, Permission)
VALUES
  (1, 'orders', 'read,write'),
  (1, 'customers', 'read'),
  (1, 'menu', 'read,write'),
  (1, 'campaigns', 'read,write')
```

### Step 3: Configure Analytics

#### Google Analytics
```javascript
// In next.config.ts or app/layout.tsx
import Script from 'next/script';

export function Analytics() {
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
          `
        }}
      />
    </>
  );
}
```

#### Sentry Error Tracking
```javascript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Step 4: Setup Monitoring & Alerts

#### Vercel Monitoring
```
Dashboard → Settings → Alerts
- [ ] Enable deployment failure notifications
- [ ] Enable performance degradation alerts
- [ ] Enable error spike alerts
- [ ] Set slack webhook for notifications
```

#### Azure Monitoring
```bash
# Create alert rule for high response time
az monitor metrics alert create \
  --resource-group imidus-admin-rg \
  --scopes /subscriptions/.../resourceGroups/imidus-admin-rg/providers/Microsoft.Web/sites/imidus-admin-portal \
  --condition "avg HttpResponseTime > 3000" \
  --name "High admin portal response time" \
  --description "Alert if response > 3 seconds" \
  --action email=admin@imidus.com
```

#### AWS CloudWatch
```bash
# Create alarm for high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name imidus-admin-cpu-high \
  --alarm-description "Alert if CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Step 5: Database Backups

```bash
# SQL Server automated backups
# Via Azure: Settings → Backup & Restore
# Via AWS RDS: Enable automated backups (7-day retention)
# Via On-Premise: Scheduled backup job in SQL Server Management Studio

# Backup schedule:
# - Daily at 2:00 AM (off-peak)
# - 30-day retention
# - Test restore weekly
```

---

## 🔐 SECURITY HARDENING

### Step 1: Enable HTTPS Only

```bash
# Vercel: Automatic ✅
# Azure:
az webapp update \
  --resource-group imidus-admin-rg \
  --name imidus-admin-portal \
  --set httpsOnly=true

# AWS: ALB listener rule (HTTP → HTTPS redirect)
```

### Step 2: Configure CORS

```typescript
// lib/api.ts
const corsOptions = {
  origin: ['https://imidus-admin.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Step 3: Setup Security Headers

```typescript
// next.config.ts
headers: async () => [
  {
    source: '/:path*',
    headers: [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
      }
    ]
  }
]
```

### Step 4: Implement Rate Limiting

```bash
# Cloudflare (if using as DNS):
# Settings → Security → Rate Limiting
# - 100 requests per 10 minutes per IP
# - Apply to /merchant/* paths

# AWS WAF:
aws wafv2 create-web-acl \
  --name imidus-admin-waf \
  --scope CLOUDFRONT \
  --default-action Block={} \
  --rules file://rate-limit-rules.json
```

---

## 📊 MONITORING & MAINTENANCE

### Key Metrics to Track

```
Performance:
- Page load time (target: < 2.5s)
- API response time (target: < 1s)
- Error rate (target: < 0.1%)
- Uptime (target: 99.9%)

Business:
- Active merchant sessions
- Orders processed per hour
- Campaigns sent per day
- Customer segments updated

Technical:
- Database query time
- CPU usage (< 70%)
- Memory usage (< 80%)
- Disk space (> 20% free)
```

### Maintenance Schedule

```
Daily:
- [ ] Check error logs (Sentry)
- [ ] Monitor uptime
- [ ] Review slow queries

Weekly:
- [ ] Review performance metrics
- [ ] Check backup success
- [ ] Verify HTTPS certificates
- [ ] Test database recovery

Monthly:
- [ ] Security audit
- [ ] Dependency updates
- [ ] Performance optimization
- [ ] Capacity planning
```

---

## 🔄 UPDATES & ROLLBACK

### Deploying Updates

```bash
# 1. Test locally
npm run dev

# 2. Build locally
npm run build

# 3. Commit and push
git add .
git commit -m "feat: add feature"
git push origin main

# Vercel: Automatic deployment on push ✅

# 4. Monitor deployment
# Vercel: https://vercel.com/deployments
# Azure: Portal → Deployment Center
# AWS: CloudWatch → Deployments
```

### Rollback Procedure

```bash
# Vercel: Dashboard → Deployments → Select previous → Redeploy

# Azure: Deployment slots
az webapp swap \
  --resource-group imidus-admin-rg \
  --name imidus-admin-portal \
  --slot staging

# AWS: ECS previous task definition
aws ecs update-service \
  --cluster imidus-prod \
  --service imidus-admin \
  --task-definition imidus-admin:2  # Previous version
```

---

## 🚨 TROUBLESHOOTING

### Issue: Portal Won't Load
```
1. Check deployment status
   - Vercel: View logs in Dashboard
   - Azure: Check Application Insights
   - AWS: Check CloudWatch logs

2. Verify environment variables
   - Check NEXT_PUBLIC_API_URL
   - Check JWT_SECRET
   - Check DATABASE_URL

3. Check database connection
   - Test connection string
   - Verify SQL Server is running
   - Check firewall rules

4. Clear cache and cookies
   - Browser: Ctrl+Shift+Delete
   - CDN: Invalidate cache
```

### Issue: Login Failed
```
1. Verify merchant account exists in database
   - Check tblUser table

2. Check JWT_SECRET value
   - Ensure it's consistent across all instances
   - Length minimum 32 characters

3. Verify token expiration
   - Check JWT_EXPIRATION setting
   - Ensure time sync on servers

4. Check authentication API
   - Test backend /api/auth endpoint
   - Verify CORS headers
```

### Issue: Slow Performance
```
1. Check database performance
   - Run query analysis
   - Check missing indexes
   - Monitor connection pool

2. Check API response times
   - Use Performance tab in DevTools
   - Monitor backend logs
   - Check network latency

3. Optimize frontend
   - Clear browser cache
   - Check bundle size
   - Analyze code splitting

4. Scale infrastructure
   - Increase server CPU/RAM
   - Add caching layer (Redis)
   - Implement CDN for static assets
```

---

## 📞 SUPPORT & OPERATIONS

### Emergency Contacts

```
Technical Lead:       Chris (novatech2210@gmail.com)
Database Admin:       [Database team]
Infrastructure:       [Cloud team]
On-Call Rotation:     [Rotation schedule]
Customer Support:     [Support email]
```

### Incident Response Plan

**Portal is Down:**
1. Check status page
2. View application logs
3. Check database connectivity
4. Restart service (if needed)
5. Execute rollback if necessary

**High Error Rate:**
1. Check Sentry error tracking
2. Monitor database queries
3. Check API response times
4. Scale if needed

**Performance Degradation:**
1. Check database slow query log
2. Monitor memory usage
3. Check CDN cache hit rate
4. Review recent deployments

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Application is running and healthy
- [ ] SSL certificate is valid
- [ ] Custom domain is configured
- [ ] Monitoring is active
- [ ] Alerts are configured
- [ ] Backups are scheduled
- [ ] CDN is configured (if used)
- [ ] Performance is acceptable
- [ ] Security headers are set
- [ ] Database is connected
- [ ] Merchant accounts created
- [ ] Analytics are tracking
- [ ] Team is trained
- [ ] Documentation is updated
- [ ] Rollback plan documented

---

## 📚 ADDITIONAL RESOURCES

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Azure App Service Guide](https://docs.microsoft.com/en-us/azure/app-service/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)

---

**Version:** 1.0
**Last Updated:** March 20, 2026
**Status:** Production Ready

**Deployment successful!** 🚀
