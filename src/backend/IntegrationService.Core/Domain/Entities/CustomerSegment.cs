using System;

namespace IntegrationService.Core.Domain.Entities
{
    public class CustomerSegment
    {
        public int CustomerID { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public decimal LifetimeValue { get; set; }
        public int VisitCount { get; set; }
        public DateTime? LastOrderDate { get; set; }
        public string? Segment { get; set; } // VIP, Loyal, Regular, At-Risk, New
        public int EarnedPoints { get; set; }
    }

    public class CustomerSegmentCounts
    {
        public int HighSpend { get; set; }
        public int Frequent { get; set; }
        public int Recent { get; set; }
        public int AtRisk { get; set; }
        public int New { get; set; }
        public int Total { get; set; }
    }
}
