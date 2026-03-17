using System.IO;
using System.Threading.Tasks;
using IntegrationService.API.Constants;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace IntegrationService.API.Services
{
    public interface IEmailService
    {
        Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal total);
        Task SendLoyaltyUpdateAsync(string toEmail, string customerName, int points, string tier);
    }

    public class EmailService : IEmailService
    {
        private readonly ISendGridClient _sendGridClient;
        private readonly IConfiguration _configuration;
        private readonly string _templatePath;

        public EmailService(ISendGridClient sendGridClient, IConfiguration configuration)
        {
            _sendGridClient = sendGridClient;
            _configuration = configuration;
            _templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Templates", "Email", "BaseEmailTemplate.html");
        }

        public async Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal total)
        {
            var template = await File.ReadAllTextAsync(_templatePath);
            
            // Build logo URLs from S3
            var logos = GetLogoUrls();

            var content = $@"
                <h1>Order Confirmation</h1>
                <p>Hi {customerName},</p>
                <p>Thank you for your order. We're preparing your delicious meal.</p>
                
                <div class='order-details'>
                    <p><strong>Order Number:</strong> <span class='mono'>{orderNumber}</span></p>
                    <p><strong>Total:</strong> ${total:F2}</p>
                </div>
                
                <p>We'll notify you when your order is ready.</p>
                
                <a href='{{TRACK_URL}}' class='button'>Track Your Order</a>
            ";

            var htmlContent = template
                .Replace("{{EMAIL_SUBJECT}}", "Order Confirmation")
                .Replace("{{GREETING}}", customerName)
                .Replace("{{EMAIL_INTRO_TEXT}}", "Thank you for your order. We're preparing your delicious meal.")
                .Replace("{{BLOCK_TITLE}}", "Order Details")
                .Replace("{{BLOCK_CONTENT}}", $"<p><strong>Order #:</strong> <span class='mono'>{orderNumber}</span></p><p><strong>Total:</strong> ${total:F2}</p>")
                .Replace("{{CTA_URL}}", "{{TRACK_URL}}")
                .Replace("{{CTA_LABEL}}", "Track Your Order")
                .Replace("{{LOYALTY_POINTS}}", "{{LOYALTY_POINTS}}")
                .Replace("{{LOGO_BLUE_BANNER_URL}}", logos.BlueBanner)
                .Replace("{{LOGO_TRIANGLE_URL}}", logos.Triangle)
                .Replace("{{LOGO_COMPACT_URL}}", logos.Compact)
                .Replace("{{YEAR}}", DateTime.Now.Year.ToString())
                .Replace("{{UNSUBSCRIBE_URL}}", "{{UNSUBSCRIBE_URL}}");

            await SendEmailAsync(toEmail, "Order Confirmation", htmlContent);
        }

        public async Task SendLoyaltyUpdateAsync(string toEmail, string customerName, int points, string tier)
        {
            var template = await File.ReadAllTextAsync(_templatePath);
            
            // Build logo URLs from S3
            var logos = GetLogoUrls();

            var content = $@"
                <h1>Loyalty Points Update</h1>
                <p>Hi {customerName},</p>
                <p>Great news! Your loyalty points have been updated.</p>
                
                <div class='loyalty-badge'>
                    <div class='loyalty-points'>{points}</div>
                    <p><strong>{tier} Member</strong></p>
                </div>
                
                <p>Keep enjoying delicious meals and earning more rewards!</p>
                
                <a href='{{LOYALTY_URL}}' class='button'>View Rewards</a>
            ";

            var htmlContent = template
                .Replace("{{EMAIL_SUBJECT}}", "Loyalty Points Update")
                .Replace("{{GREETING}}", customerName)
                .Replace("{{EMAIL_INTRO_TEXT}}", "Great news! Your loyalty points have been updated.")
                .Replace("{{BLOCK_TITLE}}", "Your Rewards")
                .Replace("{{BLOCK_CONTENT}}", $"<p><strong>Points:</strong> {points}</p><p><strong>Tier:</strong> {tier}</p>")
                .Replace("{{CTA_URL}}", "{{LOYALTY_URL}}")
                .Replace("{{CTA_LABEL}}", "View Rewards")
                .Replace("{{LOYALTY_POINTS}}", points.ToString())
                .Replace("{{LOGO_BLUE_BANNER_URL}}", logos.BlueBanner)
                .Replace("{{LOGO_TRIANGLE_URL}}", logos.Triangle)
                .Replace("{{LOGO_COMPACT_URL}}", logos.Compact)
                .Replace("{{YEAR}}", DateTime.Now.Year.ToString())
                .Replace("{{UNSUBSCRIBE_URL}}", "{{UNSUBSCRIBE_URL}}");

            await SendEmailAsync(toEmail, "Loyalty Points Update", htmlContent);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
        {
            var from = new EmailAddress(ImidusConstants.EmailFromAddress, ImidusConstants.EmailFromName);
            var to = new EmailAddress(toEmail);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, null, htmlContent);

            var response = await _sendGridClient.SendEmailAsync(msg);
            
            // Log response if needed
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Body.ReadAsStringAsync();
                // Log error
            }
        }

        private LogoUrls GetLogoUrls()
        {
            var s3BaseUrl = _configuration["AWS:S3:BaseUrl"] ?? $"https://{ImidusConstants.S3BucketName}.s3.amazonaws.com";
            
            return new LogoUrls
            {
                BlueBanner = $"{s3BaseUrl}{ImidusConstants.S3LogoBlueBanner}",
                White = $"{s3BaseUrl}{ImidusConstants.S3LogoWhite}",
                Triangle = $"{s3BaseUrl}{ImidusConstants.S3LogoTriangle}",
                Compact = $"{s3BaseUrl}{ImidusConstants.S3LogoCompact}",
                Wordmark = $"{s3BaseUrl}{ImidusConstants.S3LogoWordmark}"
            };
        }

        private class LogoUrls
        {
            public string BlueBanner { get; set; } = "";
            public string White { get; set; } = "";
            public string Triangle { get; set; } = "";
            public string Compact { get; set; } = "";
            public string Wordmark { get; set; } = "";
        }
    }
}
