using System;
using System.Collections.Generic;

namespace IntegrationService.Core.Domain.Entities
{
    // =============================================================================
    // INI POS Database Schema - Entity Models
    // Based on: INI_Restaurant.Bak analysis & IMIDUS_Project_Analysis.md
    // Database: TPPro (SQL Server 2005 Express, compatibility level 100)
    //
    // COLUMN MAPPING NOTES:
    // - tblItem.ID -> MenuItem.ItemID (aliased in queries)
    // - tblCategory.ID -> Category.CategoryID (aliased in queries)
    // - tblCategory.CatName -> Category.CName (aliased in queries)
    // - tblSize.ID -> Size.SizeID (aliased in queries)
    //
    // SQL SERVER 2005 COMPATIBILITY CONSTRAINTS:
    // - No MERGE statements
    // - No OFFSET/FETCH (use TOP)
    // - No window functions like ROW_NUMBER() OVER
    // - No TRY_CONVERT, use CONVERT with ISNULL
    // =============================================================================

    /// <summary>
    /// Transaction Type values for tblSales.TransType
    /// </summary>
    public enum TransactionType
    {
        Refund = 0,
        CompletedSale = 1,
        OpenOrder = 2
    }

    /// <summary>
    /// Payment Type ID mapping for tblPayment.PaymentTypeID
    /// </summary>
    public enum PaymentType : byte
    {
        Cash = 1,
        Debit = 2,
        Visa = 3,
        MasterCard = 4,
        Amex = 5,
        Coupon = 6,
        Discover = 7,
        JCB = 8,
        GiftCard = 9,
        RewardPoints = 10,
        ChargeOnAccount = 11,
        AllCredit = 255
    }

    // =============================================================================
    // CORE TRANSACTION TABLES
    // =============================================================================

    /// <summary>
    /// Maps to tblSales - Main sales/ticket table
    /// This is the order header containing totals and metadata
    /// </summary>
    public class PosTicket
    {
        // Primary Key
        public int ID { get; set; }

        // Transaction Details
        public DateTime SaleDateTime { get; set; }
        public int TransType { get; set; }  // 0=Refund, 1=Completed, 2=Open
        public int? OriginalTransType { get; set; }
        public int DailyOrderNumber { get; set; }

        // Financial Totals
        public decimal SubTotal { get; set; }
        public decimal DSCAmt { get; set; }          // Discount Amount
        public decimal AlcoholDSCAmt { get; set; }   // Alcohol-specific discount
        public decimal GSTAmt { get; set; }          // Goods & Services Tax
        public decimal PSTAmt { get; set; }          // Provincial Sales Tax
        public decimal PST2Amt { get; set; }         // Additional Tax

        // Tax Rates (stored at transaction time for audit)
        public decimal? GSTRate { get; set; }
        public decimal? PSTRate { get; set; }
        public decimal? PST2Rate { get; set; }

        // Payment Tracking (aggregated by type)
        public decimal CashPaidAmt { get; set; }
        public decimal DebitPaidAmt { get; set; }
        public decimal AmexPaidAmt { get; set; }
        public decimal McPaidAmt { get; set; }       // MasterCard
        public decimal CouponPaidAmt { get; set; }

        // Tip Tracking
        public decimal CashTipPaidAmt { get; set; }
        public decimal CreditTipPaidAmt { get; set; }
        public decimal DebitTipPaidAmt { get; set; }

        // Delivery/Online
        public decimal DeliveryChargeAmt { get; set; }
        public int? OnlineOrderCompanyID { get; set; }

        // Foreign Keys
        public int? CustomerID { get; set; }
        public int? CashierID { get; set; }
        public int? TableID { get; set; }
        public int? StationID { get; set; }

        // Customer Segmentation
        public int? CustomerTypeID { get; set; }
        public int? CustomerGroupID { get; set; }

        // Order Metadata
        public int Guests { get; set; }
        public bool TakeOutOrder { get; set; }
        public bool Locked { get; set; }
        public int PaymentCount { get; set; }

        // Calculated Properties
        public decimal TotalAmount => SubTotal + GSTAmt + PSTAmt + PST2Amt - DSCAmt + DeliveryChargeAmt;
        public decimal TotalTips => CashTipPaidAmt + CreditTipPaidAmt + DebitTipPaidAmt;
        public bool IsOpen => TransType == (int)TransactionType.OpenOrder;
        public bool IsCompleted => TransType == (int)TransactionType.CompletedSale;

        // Navigation Properties
        public List<PosTicketItem> Items { get; set; } = new();
        public List<PendingOrderItem> PendingItems { get; set; } = new();
        public List<PosTender> Payments { get; set; } = new();
        public PosCustomer? Customer { get; set; }
    }

    /// <summary>
    /// Maps to tblSalesDetail - COMPLETED order line items
    /// Items move here from tblPendingOrders when the order is finalized
    /// </summary>
    public class PosTicketItem
    {
        public int ID { get; set; }

        // Foreign Keys
        public int SalesID { get; set; }
        public int ItemID { get; set; }
        public int SizeID { get; set; }

        // Item Details (denormalized)
        public string ItemName { get; set; } = string.Empty;
        public string? ItemName2 { get; set; }  // Kitchen/alternate name
        public string SizeName { get; set; } = string.Empty;

        // Pricing & Quantity
        public decimal Qty { get; set; }
        public decimal Quantity { get => Qty; set => Qty = value; }  // Alias for compatibility
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmt { get; set; }
        public decimal DSCAmt { get => DiscountAmt; set => DiscountAmt = value; }  // Alias
        public decimal? DiscountPercent { get; set; }

        // Weight-based items
        public decimal? PricePerWeightUnit { get; set; }
        public decimal? MeasuredWeight { get; set; }
        public int? DecimalPlaces { get; set; }

        // Modifiers
        public string? Tastes { get; set; }  // Comma-separated taste modifiers

        // Ordering
        public int SequenceNo { get; set; }

        // Split Bill Support
        public byte PersonIndex { get; set; }

        // Status
        public bool Voided { get; set; }
        public bool OpenItem { get; set; }

        // Tax flags (for creating items - not stored in tblSalesDetail but useful for processing)
        public bool ApplyGST { get; set; } = true;
        public bool ApplyPST { get; set; } = true;
        public bool ApplyPST2 { get; set; }

        // Kitchen routing (for creating items - not stored in tblSalesDetail)
        public bool KitchenB { get; set; }
        public bool KitchenF { get; set; }
        public bool KitchenE { get; set; }
        public bool Kitchen5 { get; set; }
        public bool Kitchen6 { get; set; }

        // Calculated Property
        public decimal LineTotal => (Qty * UnitPrice) - DiscountAmt;

        // Navigation
        public MenuItem? MenuItem { get; set; }
    }

    /// <summary>
    /// Maps to tblPendingOrders - ACTIVE/IN-PROGRESS order items
    /// CRITICAL: This is where items live while the order is open (TransType=2)
    /// When order is completed, items move to tblSalesDetail
    /// </summary>
    public class PendingOrderItem
    {
        // Note: tblPendingOrders may not have an ID column - uses composite key
        public int? ID { get; set; }

        // Foreign Keys
        public int SalesID { get; set; }
        public int ItemID { get; set; }
        public int SizeID { get; set; }

        // Item Details
        public string ItemName { get; set; } = string.Empty;
        public string? ItemName2 { get; set; }
        public string SizeName { get; set; } = string.Empty;

        // Pricing & Quantity
        public decimal Qty { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? PricePerWeightUnit { get; set; }

        // Modifiers
        public string? Tastes { get; set; }
        public string? SideDishes { get; set; }

        // Tax Application Flags
        public bool ApplyGST { get; set; }
        public bool ApplyPST { get; set; }
        public bool ApplyPST2 { get; set; }

        // Discounts
        public decimal DSCAmt { get; set; }
        public decimal? DSCAmtEmployee { get; set; }
        public decimal? DSCAmtType1 { get; set; }
        public decimal? DSCAmtType2 { get; set; }
        public decimal? DayHourDiscountRate { get; set; }
        public bool ApplyNoDSC { get; set; }

        // Kitchen Routing
        public bool KitchenB { get; set; }  // Back kitchen
        public bool KitchenF { get; set; }  // Front kitchen
        public bool KitchenE { get; set; }  // Kitchen E
        public bool Bar { get; set; }

        // Split Bill
        public byte PersonIndex { get; set; }
        public bool SeparateBillPrint { get; set; }

        // Special Flags
        public bool OpenItem { get; set; }
        public bool ExtraChargeItem { get; set; }

        // Calculated Property
        public decimal LineTotal => (Qty * UnitPrice) - DSCAmt;
    }

    /// <summary>
    /// Maps to tblPayment - Payment tenders
    /// </summary>
    public class PosTender
    {
        public int ID { get; set; }

        // Foreign Key
        public int SalesID { get; set; }

        // Payment Details
        public byte PaymentTypeID { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal TipAmount { get; set; }

        // Credit Card Fields (encrypted via dbo.EncryptString)
        public string? CardNumber { get; set; }      // ENCRYPTED
        public string? CardExpiryDate { get; set; }
        public string? AuthorizationNo { get; set; }
        public string? BatchNo { get; set; }
        public string? CardReceipt { get; set; }
        public string? TrackData { get; set; }

        // Card Display Info (unencrypted, for receipt display)
        public string? CardType { get; set; }        // Visa, MasterCard, Amex, Discover
        public string? Last4Digits { get; set; }     // Last 4 digits for display

        // Sequence & Revision
        public int SequenceNo { get; set; }
        public int? ItemNo { get; set; }
        public int? RevisionNo { get; set; }

        // Station Info
        public string? StationName { get; set; }

        // Status
        public bool Voided { get; set; }
        public bool TipAdjusted { get; set; }

        // Timestamps
        public DateTime? PaidDateTime { get; set; }
        public DateTime CreatedDate { get => PaidDateTime ?? DateTime.Now; set => PaidDateTime = value; }  // Alias

        // Helper Properties
        public PaymentType PaymentTypeEnum => (PaymentType)PaymentTypeID;
        public bool IsCreditCard => PaymentTypeID >= 3 && PaymentTypeID <= 8;
    }

    // =============================================================================
    // MENU / INVENTORY TABLES
    // =============================================================================

    /// <summary>
    /// Maps to dbo.tblItem - Menu items
    /// Column mapping: tblItem.ID -> ItemID (via SQL alias)
    /// </summary>
    public class MenuItem
    {
        /// <summary>Primary key. DB column is 'ID', aliased as ItemID in queries.</summary>
        public short ItemID { get; set; }

        // Names
        public string IName { get; set; } = string.Empty;
        public string? IName2 { get; set; }  // Kitchen/alternate name

        // Description & Images
        public string? ItemDescription { get; set; }
        public string? ImageFilePath { get; set; }
        public byte[]? ItemImage { get; set; }
        public string? ItemImageFileType { get; set; }

        // Categorization
        public byte CategoryID { get; set; }
        public string? BarCode { get; set; }

        // Status & Availability
        public bool Status { get; set; }      // 1=Active
        public bool OnlineItem { get; set; }  // Available online

        // Item Type Flags
        public bool Alcohol { get; set; }
        public bool NonAlcohol { get; set; }
        public bool ScaleItem { get; set; }   // Sold by weight
        public bool OpenItem { get; set; }    // Price entry required
        public bool HourlyChargedItem { get; set; }
        public bool SideDish { get; set; }
        public bool GroupItem { get; set; }
        public bool RewardItem { get; set; }
        public bool Taste { get; set; }       // Has taste modifiers

        // Tax Flags
        public bool ApplyGST { get; set; }
        public bool ApplyPST { get; set; }
        public bool ApplyPST2 { get; set; }

        // Kitchen Routing
        public bool KitchenB { get; set; }
        public bool KitchenF { get; set; }
        public bool KitchenE { get; set; }
        public bool Kitchen5 { get; set; }
        public bool Kitchen6 { get; set; }
        public bool Bar { get; set; }

        // Inventory
        public bool ManageInv { get; set; }

        // Display Order - Removed: PrintOrder does not exist in tblItem
        // public int PrintOrder { get; set; }

        // Navigation
        public Category? Category { get; set; }
        public List<AvailableSize> AvailableSizes { get; set; } = new();
    }

    /// <summary>
    /// Maps to tblAvailableSize - Item sizes and prices
    /// CRITICAL: This is where pricing and stock are stored
    /// </summary>
    public class AvailableSize
    {
        // Composite Primary Key
        public short ItemID { get; set; }
        public short SizeID { get; set; }

        // Pricing Tiers
        public decimal UnitPrice { get; set; }
        public decimal? UnitPrice2 { get; set; }
        public decimal? UnitPrice3 { get; set; }

        // Inventory
        public int? OnHandQty { get; set; }  // NULL = unlimited

        // Discount Rules
        public bool ApplyNoDSC { get; set; }

        // Navigation
        public MenuItem? MenuItem { get; set; }
        public Size? Size { get; set; }

        // Helpers
        public bool InStock => OnHandQty == null || OnHandQty >= 0;  // 0 means in stock for POS (not tracked)
    }

    /// <summary>
    /// Maps to dbo.tblSize - Size definitions
    /// Column mapping: tblSize.ID -> SizeID (via SQL alias)
    /// </summary>
    public class Size
    {
        /// <summary>Primary key. DB column is 'ID', aliased as SizeID in queries.</summary>
        public short SizeID { get; set; }
        public string SizeName { get; set; } = string.Empty;
        public string? ShortName { get; set; }
        public byte DisplayOrder { get; set; }
    }

    /// <summary>
    /// Maps to dbo.tblCategory - Menu categories
    /// Column mappings:
    /// - tblCategory.ID -> CategoryID (via SQL alias)
    /// - tblCategory.CatName -> CName (via SQL alias)
    /// </summary>
    public class Category
    {
        /// <summary>Primary key. DB column is 'ID', aliased as CategoryID in queries.</summary>
        public byte CategoryID { get; set; }
        /// <summary>Category name. DB column is 'CatName', aliased as CName in queries.</summary>
        public string CName { get; set; } = string.Empty;
        public int PrintOrder { get; set; }
        public bool Status { get; set; }
        public string? CategoryImageFilePath { get; set; }

        public List<MenuItem> Items { get; set; } = new();
    }

    /// <summary>
    /// Maps to tblDayHourDiscount - Automated time-based discounts
    /// </summary>
    public class DayHourDiscount
    {
        public int ID { get; set; }
        public int ItemID { get; set; }
        public int SizeID { get; set; }
        public int DayOfWeek { get; set; }  // 0=Sunday, 6=Saturday
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public decimal? DiscountPrice { get; set; }
        public decimal? DiscountRate { get; set; }
        public bool IsActive { get; set; }
    }

    // =============================================================================
    // CUSTOMER & LOYALTY TABLES
    // =============================================================================

    /// <summary>
    /// Maps to tblCustomer - Customer database
    /// </summary>
    public class PosCustomer
    {
        public int ID { get; set; }

        // Name
        public string? FName { get; set; }
        public string? LName { get; set; }

        // Contact (NOTE: Email does not exist in POS tblCustomer - stored in IntegrationService overlay)
        public string? Phone { get; set; }
        // Email is stored in IntegrationService.User or CustomerAuth table
        public string? Email { get; set; }
        public string? Address { get; set; }

        // Identifiers
        public string? CustomerNum { get; set; }

        // Loyalty
        public int EarnedPoints { get; set; }
        public bool PointsManaged { get; set; }

        // Demographics (Gender is bit in POS: 0=Female, 1=Male)
        public bool? Gender { get; set; }
        public DateTime? DateEntered { get; set; }
        public DateTime? LastVisit { get; set; }

        // POS specific fields
        public decimal? CardValue { get; set; }
        public decimal? Savings { get; set; }
        public decimal? CreditBalance { get; set; }
        public string? CustomerNote { get; set; }

        // Segmentation (for RFM analysis)
        public int? CustomerTypeID { get; set; }
        public int? CustomerGroupID { get; set; }

        // Helpers
        public string FullName => $"{FName} {LName}".Trim();
    }

    /// <summary>
    /// Maps to tblPointsDetail - Loyalty point transactions
    /// </summary>
    public class PointsDetail
    {
        public int ID { get; set; }
        public int SalesID { get; set; }
        public int CustomerID { get; set; }
        public int PointUsed { get; set; }
        public int PointSaved { get; set; }
        public DateTime TransactionDate { get; set; }
    }

    /// <summary>
    /// Maps to tblPrepaidCards - Gift cards
    /// </summary>
    public class PrepaidCard
    {
        public int ID { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public int? CustomerID { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool IsActive { get; set; }
    }

    // =============================================================================
    // ONLINE ORDER TABLES
    // =============================================================================

    /// <summary>
    /// Maps to tblOnlineOrderCompany - Third-party platforms
    /// </summary>
    public class OnlineOrderCompany
    {
        public int ID { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public decimal? CommissionRate { get; set; }
    }

    /// <summary>
    /// Maps to tblOnlineOrders - Online order records
    /// </summary>
    public class OnlineOrder
    {
        public int ID { get; set; }
        public int OnlineOrderCompanyID { get; set; }
        public string? ExternalOrderId { get; set; }
        public DateTime OrderDateTime { get; set; }
        public decimal TotalAmount { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? DeliveryAddress { get; set; }
        public string? Status { get; set; }
        public int? SalesID { get; set; }

        public OnlineOrderCompany? Company { get; set; }
    }

    /// <summary>
    /// Maps to tblSalesOfOnlineOrders - Links sales to online orders
    /// </summary>
    public class SalesOfOnlineOrder
    {
        public int SalesID { get; set; }
        public int OnlineOrderCompanyID { get; set; }
        public string? OnlineOrderNumber { get; set; }
        public string? OnlineOrderCustomerName { get; set; }
        public bool DineInOrder { get; set; }
        public decimal? ReservedTipAmt { get; set; }
        public decimal? DeliveryChargeAmt { get; set; }
    }

    // =============================================================================
    // TABLE / STATION TABLES
    // =============================================================================

    /// <summary>
    /// Maps to tblTable - Table/order tracking
    /// </summary>
    public class PosTable
    {
        public int ID { get; set; }
        public string TableName { get; set; } = string.Empty;

        // Order Type
        public bool TakeOut { get; set; }
        public bool Delivery { get; set; }
        public bool Online { get; set; }

        // Status
        public bool Opened { get; set; }
        public bool BillPrinted { get; set; }
        public bool StayOn { get; set; }

        // Order Info
        public int DailyOrdNum { get; set; }
        public int BellNumber { get; set; }

        // Station/Platform
        public int StationID { get; set; }
        public int? OnlineOrderCompanyID { get; set; }

        // Security
        public bool AccessPermissionRequired { get; set; }

        // Pricing
        public byte AppliedUnitPriceType { get; set; }
    }

    // =============================================================================
    // HELPER / DTO CLASSES
    // =============================================================================

    /// <summary>
    /// Tax rates configuration from tblMisc
    /// </summary>
    public class TaxRates
    {
        public decimal GST { get; set; }
        public decimal PST { get; set; }
        public decimal PST2 { get; set; }
    }

    /// <summary>
    /// Order creation request DTO
    /// </summary>
    public class CreateOrderRequest
    {
        public int? CustomerID { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new();
        public string? PaymentAuthCode { get; set; }
        public string? PaymentBatchNo { get; set; }
        public decimal TipAmount { get; set; }
        public byte PaymentTypeID { get; set; } = (byte)PaymentType.Visa;
        public bool IsTakeout { get; set; } = true;
        public int? OnlineOrderCompanyID { get; set; }
        public string? OnlineOrderNumber { get; set; }
        public string? CustomerName { get; set; }
        public decimal DeliveryCharge { get; set; }
    }

    /// <summary>
    /// Order item request DTO
    /// </summary>
    public class OrderItemRequest
    {
        public int MenuItemId { get; set; }
        public int SizeId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Tastes { get; set; }
        public string? SideDishes { get; set; }
    }

    /// <summary>
    /// Order creation result DTO
    /// </summary>
    public class OrderResult
    {
        public bool Success { get; set; }
        public int SalesID { get; set; }
        public int DailyOrderNumber { get; set; }
        public string? TicketNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
