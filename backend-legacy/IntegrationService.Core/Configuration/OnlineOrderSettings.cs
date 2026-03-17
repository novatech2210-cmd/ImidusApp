using System.ComponentModel.DataAnnotations;

namespace IntegrationService.Core.Configuration
{
    /// <summary>
    /// Configuration for online order POS integration
    /// Defines dedicated identifiers for filtering and reporting online orders
    /// </summary>
    public class OnlineOrderSettings
    {
        public const string SectionName = "OnlineOrderSettings";

        /// <summary>
        /// Dedicated cashier ID for all online orders (e.g., 999 = "ONLINE")
        /// Used to identify and filter online orders in POS reports
        /// </summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "OnlineCashierId must be greater than 0")]
        public int OnlineCashierId { get; set; }

        /// <summary>
        /// Fixed station ID for online orders (e.g., 999 for filtering in POS reports)
        /// Separates online orders from physical POS terminals
        /// </summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "OnlineStationId must be greater than 0")]
        public int OnlineStationId { get; set; }

        /// <summary>
        /// Fixed table ID for online orders (typically 0 for "no table")
        /// Online orders are takeout/delivery, not dine-in
        /// </summary>
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "OnlineTableId must be 0 or greater")]
        public int OnlineTableId { get; set; }

        /// <summary>
        /// Online order company ID for tblOnlineOrderCompany registration
        /// Links orders to specific online ordering platform (internal system)
        /// </summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "OnlineCompanyId must be greater than 0")]
        public int OnlineCompanyId { get; set; }

        /// <summary>
        /// Test mode cashier ID (e.g., 998) for filtering test orders
        /// Optional - used to separate test orders from production
        /// </summary>
        [Range(1, int.MaxValue, ErrorMessage = "TestCashierId must be greater than 0")]
        public int? TestCashierId { get; set; }
    }
}
