/// <summary>
/// IMIDUS Technologies – Brand Constants for Backend Service
/// Used in email templates, push notification payloads, and PDF receipts.
/// Path: IntegrationService.API/Constants/ImidusConstants.cs
/// </summary>

namespace IntegrationService.API.Constants
{
    public static class ImidusConstants
    {
        // ── Company ────────────────────────────────────────────────────
        public const string CompanyName      = "Imidus Technologies Inc.";
        public const string AppDisplayName   = "IMIDUSAPP";
        public const string AppTagline       = "Order · Track · Earn";
        public const string SupportEmail     = "support@imidus.com";
        public const string PoweredBy        = "Powered by Imidus Technologies";

        // ── Brand Colours (hex, no #) ──────────────────────────────────
        public const string BrandBlue        = "#1E5AA8";
        public const string BrandGold        = "#D4AF37";
        public const string DarkBg           = "#1A1A2E";
        public const string White            = "#FFFFFF";
        public const string TextDark         = "#222222";
        public const string TextMuted        = "#888888";
        public const string StatusSuccess    = "#2E7D32";
        public const string StatusError      = "#C62828";
        public const string StatusWarning    = "#E65100";

        // ── Push Notification prefixes ──────────────────────────────────
        public const string PushTitlePrefix  = "IMIDUS | ";  // e.g. "IMIDUS | Your order is ready"

        // ── Email template widths ───────────────────────────────────────
        public const int EmailTemplateWidth  = 600;           // px — standard email width

        // ── AWS S3 logo paths (relative to bucket root) ─────────────────
        // Bucket: inirestaurant  Region: us-east-1
        public const string S3BucketName        = "inirestaurant";
        public const string S3LogoTriangle      = "/novatech/assets/logo_imidus_triangle.png";
        public const string S3LogoBlueBanner    = "/novatech/assets/imidus_logo_blue_gradient.png";
        public const string S3LogoWordmark      = "/novatech/assets/imidus_logo_pen_colored.png";
        public const string S3LogoWhite         = "/novatech/assets/imidus_logo_white.png";
        public const string S3LogoCompact       = "/novatech/assets/logo_imidus_alt.png";
        public const string S3LogoAppIcon       = "/novatech/assets/app-icon-512.png";

        // ── FCM notification channel ─────────────────────────────────────
        public const string FcmChannelId        = "imidus_notifications";
        public const string FcmChannelName      = "Imidus Notifications";
        public const string FcmNotificationColor= "#D4AF37";  // Android notification accent
        public const string FcmSmallIconName    = "ic_imidus_notify"; // res/drawable on Android
    }
}
