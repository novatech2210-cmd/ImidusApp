namespace IntegrationService.Core.Models
{
    public class AuthorizeNetSettings
    {
        public const string SectionName = "AuthorizeNet";
        public bool IsSandbox { get; set; }
        public string ApiLoginId { get; set; } = string.Empty;
        public string TransactionKey { get; set; } = string.Empty;
        public string PublicClientKey { get; set; } = string.Empty;
    }
}
