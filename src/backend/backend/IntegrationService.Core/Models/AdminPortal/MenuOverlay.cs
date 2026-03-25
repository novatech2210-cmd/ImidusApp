namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// Menu overlay configuration (SSOT: IntegrationService overlay table)
    /// Allows enabling/disabling items without modifying POS schema
    /// </summary>
    public class MenuOverlay
    {
        public int Id { get; set; }
        public int ItemID { get; set; }
        public int SizeID { get; set; }
        public bool IsEnabled { get; set; } = true;
        public string? DisplayName { get; set; }
        public string? DisplayDescription { get; set; }
        public int? DisplayOrder { get; set; }
        public string? CategoryOverride { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
