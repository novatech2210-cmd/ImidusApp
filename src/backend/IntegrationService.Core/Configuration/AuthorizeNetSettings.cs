using System.ComponentModel.DataAnnotations;

namespace IntegrationService.Core.Configuration
{
    /// <summary>
    /// Configuration for Authorize.net payment processing
    /// Supports both sandbox and production environments
    /// </summary>
    public class AuthorizeNetSettings
    {
        public const string SectionName = "AuthorizeNet";

        /// <summary>
        /// Authorize.net API Login ID for merchant authentication
        /// </summary>
        [Required(ErrorMessage = "ApiLoginId is required")]
        public string ApiLoginId { get; set; } = string.Empty;

        /// <summary>
        /// Authorize.net Transaction Key for merchant authentication
        /// </summary>
        [Required(ErrorMessage = "TransactionKey is required")]
        public string TransactionKey { get; set; } = string.Empty;

        /// <summary>
        /// Public client key for Accept.js tokenization in mobile app
        /// </summary>
        [Required(ErrorMessage = "PublicClientKey is required")]
        public string PublicClientKey { get; set; } = string.Empty;

        /// <summary>
        /// Environment: "Sandbox" or "Production"
        /// </summary>
        [Required(ErrorMessage = "Environment is required")]
        [RegularExpression("^(Sandbox|Production)$", ErrorMessage = "Environment must be 'Sandbox' or 'Production'")]
        public string Environment { get; set; } = "Sandbox";

        /// <summary>
        /// Returns true if environment is configured for sandbox testing
        /// </summary>
        public bool IsSandbox => Environment == "Sandbox";
    }
}
