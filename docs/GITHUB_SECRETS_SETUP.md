# GitHub Secrets Setup for iOS CI/CD

## Overview

This guide explains how to configure GitHub secrets for automated iOS builds.

**Repository**: https://github.com/novatech642/pos-integration

---

## Required Secrets

### Apple Developer Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `APPLE_ID` | Apple Developer email | ✅ |
| `APPLE_ID_PASSWORD` | Apple ID password | ✅ |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | ✅ |
| `FASTLANE_TEAM_ID` | Apple Developer Team ID | ✅ |
| `FASTLANE_ITC_TEAM_ID` | App Store Connect Team ID | Optional |

### Code Signing Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `IOS_BUILD_CERTIFICATE_BASE64` | Distribution certificate (.p12, base64) | ✅ |
| `IOS_CERTIFICATE_PASSWORD` | Certificate export password | ✅ |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store profile (base64) | ✅ |
| `IOS_KEYCHAIN_PASSWORD` | CI keychain password | ✅ |

### AWS Secrets (for S3 upload)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | ✅ |

### Optional Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SLACK_WEBHOOK` | Slack notification URL | Optional |
| `MATCH_GIT_URL` | Git repo for Match certificates | Optional |
| `MATCH_PASSWORD` | Match encryption password | Optional |

---

## Step-by-Step Setup

### 1. Get Apple Developer Team ID

1. Go to https://developer.apple.com/account/#/membership
2. Copy "Team ID" (10 characters, e.g., `ABCD1234XY`)
3. Add to GitHub as `FASTLANE_TEAM_ID`

### 2. Generate App-Specific Password

1. Go to https://appleid.apple.com/account/manage
2. Sign in with Apple ID
3. "Sign-In and Security" → "App-Specific Passwords"
4. Click "+" to generate
5. Name: "GitHub Actions iOS Build"
6. Copy the password (format: `xxxx-xxxx-xxxx-xxxx`)
7. Add to GitHub as `APPLE_APP_SPECIFIC_PASSWORD`

### 3. Export Distribution Certificate

**On macOS:**

```bash
# Open Keychain Access
open /Applications/Utilities/Keychain\ Access.app

# Find "Apple Distribution: Your Name (TEAM_ID)"
# Right-click → Export
# Save as: distribution.p12
# Set a password (save this!)
```

**Encode to Base64:**

```bash
# Encode certificate
base64 -i distribution.p12 | tr -d '\n' > certificate_base64.txt

# View content
cat certificate_base64.txt

# Copy to clipboard (macOS)
cat certificate_base64.txt | pbcopy
```

Add to GitHub:
- `IOS_BUILD_CERTIFICATE_BASE64` = content of certificate_base64.txt
- `IOS_CERTIFICATE_PASSWORD` = password you set during export

### 4. Download Provisioning Profile

1. Go to https://developer.apple.com/account/resources/profiles/list
2. Find "ImidusCustomerApp App Store" profile
3. Download `.mobileprovision` file

**Encode to Base64:**

```bash
# Encode profile
base64 -i profile.mobileprovision | tr -d '\n' > profile_base64.txt

# Copy to clipboard (macOS)
cat profile_base64.txt | pbcopy
```

Add to GitHub as `IOS_PROVISIONING_PROFILE_BASE64`

### 5. Set Keychain Password

Generate a strong random password:

```bash
# Generate random password
openssl rand -base64 32
```

Add to GitHub as `IOS_KEYCHAIN_PASSWORD`

### 6. AWS Credentials

**Create IAM User:**

1. Go to AWS IAM Console
2. Users → Add User
3. Name: `github-actions-ios`
4. Programmatic access: ✅
5. Attach policy: `AmazonS3FullAccess` (or custom policy)
6. Create user
7. Download credentials

Add to GitHub:
- `AWS_ACCESS_KEY_ID` = Access Key ID
- `AWS_SECRET_ACCESS_KEY` = Secret Access Key

---

## Adding Secrets to GitHub

### Via Web UI

1. Go to repository: https://github.com/novatech642/pos-integration
2. Settings → Secrets and variables → Actions
3. "New repository secret"
4. Enter name and value
5. Click "Add secret"

### Via GitHub CLI

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Add secrets
gh secret set FASTLANE_TEAM_ID --body "ABCD1234XY"
gh secret set APPLE_ID --body "developer@example.com"
gh secret set APPLE_APP_SPECIFIC_PASSWORD --body "xxxx-xxxx-xxxx-xxxx"

# Add from file
gh secret set IOS_BUILD_CERTIFICATE_BASE64 < certificate_base64.txt
gh secret set IOS_PROVISIONING_PROFILE_BASE64 < profile_base64.txt
```

---

## Verification Script

Run this script to verify all secrets are set:

```bash
#!/bin/bash
# verify-secrets.sh

REPO="novatech642/pos-integration"

echo "🔐 Checking GitHub Secrets for $REPO"
echo "======================================"

REQUIRED_SECRETS=(
    "APPLE_ID"
    "APPLE_APP_SPECIFIC_PASSWORD"
    "FASTLANE_TEAM_ID"
    "IOS_BUILD_CERTIFICATE_BASE64"
    "IOS_CERTIFICATE_PASSWORD"
    "IOS_PROVISIONING_PROFILE_BASE64"
    "IOS_KEYCHAIN_PASSWORD"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if gh secret list -R "$REPO" | grep -q "$secret"; then
        echo "✅ $secret"
    else
        echo "❌ $secret (missing)"
    fi
done
```

---

## Security Best Practices

### Do's

- ✅ Use app-specific passwords (not main Apple ID password)
- ✅ Rotate secrets periodically
- ✅ Use environment-specific secrets (staging/production)
- ✅ Limit IAM permissions to minimum required
- ✅ Enable 2FA on Apple ID

### Don'ts

- ❌ Never commit secrets to repository
- ❌ Never share secrets in plain text
- ❌ Don't use same password for multiple secrets
- ❌ Don't grant full admin access to service accounts

---

## Troubleshooting

### "Authentication failed"

```
error: Unable to authenticate with App Store Connect
```

**Fix**: Regenerate app-specific password and update secret

### "No signing certificate found"

```
error: No signing certificate "iOS Distribution" found
```

**Fix**: Re-export certificate from Keychain and update base64 secret

### "Provisioning profile doesn't match"

```
error: Provisioning profile "..." doesn't include signing certificate
```

**Fix**: Regenerate provisioning profile to include new certificate

### "Secret too large"

```
error: Secret value is too large
```

**Fix**: Ensure certificate is exported as minimal .p12 (no private key chain)

---

## Quick Reference

### Complete Secrets List

```
APPLE_ID=developer@example.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
FASTLANE_TEAM_ID=ABCD1234XY
IOS_BUILD_CERTIFICATE_BASE64=MIIKxA...
IOS_CERTIFICATE_PASSWORD=your-certificate-password
IOS_PROVISIONING_PROFILE_BASE64=MIIF...
IOS_KEYCHAIN_PASSWORD=random-strong-password
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
```

### Encoding Commands

```bash
# Certificate to base64
base64 -i certificate.p12 | tr -d '\n'

# Profile to base64
base64 -i profile.mobileprovision | tr -d '\n'

# Generate random password
openssl rand -base64 32
```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-09
