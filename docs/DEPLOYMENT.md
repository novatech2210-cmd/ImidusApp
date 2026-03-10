# IMIDUS POS Integration - Deployment Guide

## Versioning Strategy

This document outlines the versioning strategy for the IMIDUS POS integration system across all three platforms: Backend (.NET), Web (Next.js), and Mobile (React Native).

### Semantic Versioning

All platforms follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes in API or database schema
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes and patches

### Version Sources

#### Backend (.NET)

- Version extracted from: `.github/workflows/backend-build.yml`
- Uses Git tag as source of truth: `v1.0.0`, `v1.1.0`, etc.
- Version format: `v{MAJOR}.{MINOR}.{PATCH}`
- Deployment artifact: MSI installer at `s3://inirestaurant/novatech/backend/{version}/ImidusIntegrationService.msi`

#### Web (Next.js)

- Version source: `src/web/package.json` (version field)
- Follows package.json conventions
- On release tags, uses Git tag as override
- Deployment artifact: Hosted on production web server

#### Mobile (React Native - iOS & Android)

- Version source: `src/mobile/ImidusCustomerApp/package.json` (version field)
- Both iOS and Android share same version
- On release tags, uses Git tag as override
- Android artifact: APK at `s3://inirestaurant/novatech/mobile/android/{version}/app-release.apk`
- iOS artifact: IPA at `s3://inirestaurant/novatech/mobile/ios/{version}/ImidusCustomerApp.ipa`

### Deployment Manifest

Each build creates a deployment manifest (`version.json`) at the S3 artifact location containing:

```json
{
  "platform": "android|ios|backend",
  "app_version": "v1.0.0",
  "build_date": "2026-03-07T10:50:58Z",
  "commit": "abc123def456...",
  "commit_short": "abc123de",
  "branch": "main|feature/branch",
  "build_number": "42",
  "build_id": "12345678",
  "testflight_status": "not_applicable|submitted|approved"
}
```

### Release Process

1. **Update Versions**

   ```bash
   # Mobile
   cd src/mobile/ImidusCustomerApp
   npm version minor  # or patch/major
   cd ../..

   # Backend (manual in .csproj if needed)
   # Web (manual in package.json)
   ```

2. **Create Git Tag**

   ```bash
   git tag -a v1.0.1 -m "Release version 1.0.1"
   git push origin v1.0.1
   ```

3. **Trigger Builds**
   - GitHub Actions automatically triggers on tags matching `v*`
   - Workflows extract version from tag
   - All artifacts uploaded to S3 with consistent versioning

4. **Verify Deployment**
   ```bash
   aws s3 ls s3://inirestaurant/novatech/mobile/android/v1.0.1/
   aws s3 ls s3://inirestaurant/novatech/mobile/ios/v1.0.1/
   aws s3 ls s3://inirestaurant/novatech/backend/v1.0.1/
   ```

### S3 Artifact Structure

```
s3://inirestaurant/novatech/
├── mobile/
│   ├── android/
│   │   └── v{version}/
│   │       ├── app-release.apk
│   │       └── version.json
│   └── ios/
│       └── v{version}/
│           ├── ImidusCustomerApp.ipa
│           ├── ImidusCustomerApp.dSYM.zip
│           └── version.json
└── backend/
    └── v{version}/
        ├── ImidusIntegrationService.msi
        ├── version.txt
        ├── deployment.json
        └── api/
            ├── IntegrationService.API.dll
            └── ...
```

### Cross-Platform Version Mapping

When deploying, all three platforms should use matching version tags for coordinated releases:

```json
{
  "release_version": "v1.0.1",
  "platforms": {
    "backend": {
      "version": "v1.0.1",
      "artifact": "s3://inirestaurant/novatech/backend/v1.0.1/ImidusIntegrationService.msi"
    },
    "web": {
      "version": "v1.0.1",
      "artifact": "https://app.imiduspos.com"
    },
    "mobile": {
      "android": {
        "version": "v1.0.1",
        "artifact": "s3://inirestaurant/novatech/mobile/android/v1.0.1/app-release.apk",
        "play_store_link": "https://play.google.com/store/apps/details?id=com.imidus.customer"
      },
      "ios": {
        "version": "v1.0.1",
        "artifact": "s3://inirestaurant/novatech/mobile/ios/v1.0.1/ImidusCustomerApp.ipa",
        "app_store_link": "https://apps.apple.com/app/imidus-customer"
      }
    }
  },
  "release_date": "2026-03-07T10:50:58Z",
  "notes": "Minor update with bug fixes"
}
```

### GitHub Actions Environment Variables

The following environment variables are set in CI/CD workflows:

| Variable     | Value           | Purpose                         |
| ------------ | --------------- | ------------------------------- |
| `S3_BUCKET`  | `inirestaurant` | S3 bucket for artifacts         |
| `S3_PREFIX`  | `novatech`      | S3 prefix for project artifacts |
| `AWS_REGION` | `us-east-1`     | AWS region for S3 access        |

### GitHub Secrets Required

To enable automated deployments, configure these secrets in the GitHub repository settings:

| Secret                             | Purpose                           |
| ---------------------------------- | --------------------------------- |
| `AWS_ACCESS_KEY_ID`                | AWS IAM credentials for S3 upload |
| `AWS_SECRET_ACCESS_KEY`            | AWS IAM credentials for S3 upload |
| `ANDROID_KEYSTORE_BASE64`          | Encoded Android release keystore  |
| `KEYSTORE_PASSWORD`                | Android keystore password         |
| `KEY_PASSWORD`                     | Android key password              |
| `KEY_ALIAS`                        | Android key alias                 |
| `IOS_P12_CERTIFICATE_BASE64`       | Encoded iOS signing certificate   |
| `IOS_P12_PASSWORD`                 | iOS certificate password          |
| `IOS_KEYCHAIN_PASSWORD`            | iOS keychain password             |
| `IOS_PROVISIONING_PROFILE_BASE64`  | Encoded iOS provisioning profile  |
| `APP_STORE_CONNECT_API_KEY_ID`     | App Store Connect API key ID      |
| `APP_STORE_CONNECT_API_ISSUER_ID`  | App Store Connect issuer ID       |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Encoded App Store Connect API key |

### Rollback Procedure

If a release has critical issues:

1. **Identify the broken version** (e.g., v1.0.1)
2. **Revert to previous tag**
   ```bash
   git tag -d v1.0.1
   git push origin :refs/tags/v1.0.1
   ```
3. **Deploy previous working version** (e.g., v1.0.0)
4. **Create new patch tag** for fixed version (e.g., v1.0.2)

### Production Deployment Checklist

Before deploying to production:

- [ ] All three platforms tested together in staging
- [ ] E2E order flow verified on web, mobile (Android), mobile (iOS)
- [ ] Payment processing tested with sandbox credentials
- [ ] Loyalty points system validated
- [ ] Push notifications verified
- [ ] Database migration (if any) validated
- [ ] Client acceptance document signed
- [ ] Version numbers synchronized across platforms
- [ ] Artifacts verified in S3 before deployment

---

**Last Updated:** 2026-03-07  
**Version:** 1.0  
**Author:** Novatech Build Team
