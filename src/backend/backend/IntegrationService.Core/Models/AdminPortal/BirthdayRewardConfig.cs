namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// Birthday reward configuration (SSOT: IntegrationService overlay table)
    /// </summary>
    public class BirthdayRewardConfig
    {
        public int Id { get; set; }
        public bool IsEnabled { get; set; } = true;
        public int DaysBeforeBirthday { get; set; } = 0;
        public int RewardPoints { get; set; } = 50;
        public string RewardDescription { get; set; } = "Birthday Bonus";
        public decimal? BonusMultiplier { get; set; }
        public string NotificationTitle { get; set; } = "Happy Birthday from IMIDUS!";
        public string NotificationBody { get; set; } = "We've added bonus points to your account. Enjoy your special day!";
        public DateTime? LastProcessedDate { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
