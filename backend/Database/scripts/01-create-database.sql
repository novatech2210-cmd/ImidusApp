-- INI POS Database Schema (TPPro)
-- Based on IMIDUS_Project_Analysis.md
-- Compatible with SQL Server 2005 Express and later

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TPPro')
BEGIN
    CREATE DATABASE TPPro;
END
GO

USE TPPro;
GO

-- =============================================================================
-- LOOKUP TABLES
-- =============================================================================

-- Size definitions (Regular, Large, etc.)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSize')
CREATE TABLE tblSize (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SizeName NVARCHAR(50) NOT NULL
);

-- Category definitions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCategory')
CREATE TABLE tblCategory (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CatName NVARCHAR(100) NOT NULL,
    PrintOrder INT DEFAULT 0,
    CategoryImageFilePath NVARCHAR(255) NULL
);

-- Payment type definitions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPaymentType')
CREATE TABLE tblPaymentType (
    ID INT PRIMARY KEY,
    PaymentTypeName NVARCHAR(50) NOT NULL
);

-- Customer types
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCustomerType')
CREATE TABLE tblCustomerType (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(50) NOT NULL
);

-- Customer groups
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCustomerGroup')
CREATE TABLE tblCustomerGroup (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    GroupName NVARCHAR(50) NOT NULL
);

-- Online order companies (Uber Eats, Skip, etc.)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOnlineOrderCompany')
CREATE TABLE tblOnlineOrderCompany (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1
);

-- =============================================================================
-- MENU ITEMS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblItem')
CREATE TABLE tblItem (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    IName NVARCHAR(100) NOT NULL,
    IName2 NVARCHAR(100) NULL,
    CategoryID INT NULL,
    BarCode NVARCHAR(50) NULL,

    -- Tax flags
    ApplyGST BIT DEFAULT 1,
    ApplyPST BIT DEFAULT 1,
    ApplyPST2 BIT DEFAULT 0,

    -- Item type flags
    OpenItem BIT DEFAULT 0,
    Alcohol BIT DEFAULT 0,
    Taste BIT DEFAULT 0,
    ScaleItem BIT DEFAULT 0,
    RewardItem BIT DEFAULT 1,
    OnlineItem BIT DEFAULT 1,
    SideDish BIT DEFAULT 0,
    HourlyChargedItem BIT DEFAULT 0,
    GroupItem BIT DEFAULT 0,
    ManageInv BIT DEFAULT 0,

    -- Kitchen routing
    KitchenB BIT DEFAULT 0,  -- Back kitchen
    KitchenF BIT DEFAULT 0,  -- Front
    KitchenE BIT DEFAULT 0,  -- Extra
    Bar BIT DEFAULT 0,

    Status INT DEFAULT 1,  -- 1=Active, 0=Inactive
    ImageFilePath NVARCHAR(255) NULL,
    ItemDescription NVARCHAR(MAX) NULL,
    ItemImage VARBINARY(MAX) NULL,
    ItemImageFileType NVARCHAR(10) NULL,

    CONSTRAINT FK_tblItem_Category FOREIGN KEY (CategoryID) REFERENCES tblCategory(ID)
);

-- Item sizes and prices
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblAvailableSize')
CREATE TABLE tblAvailableSize (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    ItemID INT NOT NULL,
    SizeID INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    UnitPrice2 DECIMAL(10,2) NULL,
    UnitPrice3 DECIMAL(10,2) NULL,
    OnHandQty INT NULL,  -- NULL = unlimited
    ApplyNoDSC BIT DEFAULT 0,  -- No discount

    CONSTRAINT FK_tblAvailableSize_Item FOREIGN KEY (ItemID) REFERENCES tblItem(ID),
    CONSTRAINT FK_tblAvailableSize_Size FOREIGN KEY (SizeID) REFERENCES tblSize(ID)
);

-- =============================================================================
-- CUSTOMERS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCustomer')
CREATE TABLE tblCustomer (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerNum NVARCHAR(50) NULL,
    FName NVARCHAR(50) NULL,
    LName NVARCHAR(50) NULL,
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(255) NULL,
    City NVARCHAR(50) NULL,
    PostalCode NVARCHAR(20) NULL,
    BirthMonth INT NULL,
    BirthDay INT NULL,
    EarnedPoints INT DEFAULT 0,
    CustomerTypeID INT NULL,
    CustomerGroupID INT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_tblCustomer_Type FOREIGN KEY (CustomerTypeID) REFERENCES tblCustomerType(ID),
    CONSTRAINT FK_tblCustomer_Group FOREIGN KEY (CustomerGroupID) REFERENCES tblCustomerGroup(ID)
);

-- =============================================================================
-- SALES/ORDERS
-- =============================================================================

-- Main sales/ticket table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSales')
CREATE TABLE tblSales (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SaleDateTime DATETIME NOT NULL DEFAULT GETDATE(),

    -- Transaction type: 0=Refund, 1=CompletedSale, 2=OpenOrder
    TransType INT NOT NULL DEFAULT 2,
    OriginalTransType INT NULL,

    DailyOrderNumber INT NULL,

    -- Totals
    SubTotal DECIMAL(10,2) DEFAULT 0,
    DSCAmt DECIMAL(10,2) DEFAULT 0,  -- Discount amount
    AlcoholDSCAmt DECIMAL(10,2) DEFAULT 0,

    -- Tax amounts
    GSTAmt DECIMAL(10,2) DEFAULT 0,
    PSTAmt DECIMAL(10,2) DEFAULT 0,
    PST2Amt DECIMAL(10,2) DEFAULT 0,

    -- Tax rates (snapshot at time of sale)
    GSTRate DECIMAL(5,4) DEFAULT 0,
    PSTRate DECIMAL(5,4) DEFAULT 0,
    PST2Rate DECIMAL(5,4) DEFAULT 0,

    -- References
    CashierID INT DEFAULT 1,
    CustomerID INT NULL,
    TableID INT NULL,
    StationID INT DEFAULT 1,

    Guests INT DEFAULT 1,
    TakeOutOrder BIT DEFAULT 0,

    -- Payment tracking by type
    CashPaidAmt DECIMAL(10,2) DEFAULT 0,
    DebitPaidAmt DECIMAL(10,2) DEFAULT 0,
    VisaPaidAmt DECIMAL(10,2) DEFAULT 0,
    McPaidAmt DECIMAL(10,2) DEFAULT 0,
    AmexPaidAmt DECIMAL(10,2) DEFAULT 0,
    CouponPaidAmt DECIMAL(10,2) DEFAULT 0,
    PrepaidCardPaidAmt DECIMAL(10,2) DEFAULT 0,

    -- Tips
    CashTipPaidAmt DECIMAL(10,2) DEFAULT 0,
    CreditTipPaidAmt DECIMAL(10,2) DEFAULT 0,
    DebitTipPaidAmt DECIMAL(10,2) DEFAULT 0,

    -- Online order info
    DeliveryChargeAmt DECIMAL(10,2) DEFAULT 0,
    OnlineOrderCompanyID INT NULL,

    Locked BIT DEFAULT 0,
    PaymentCount INT DEFAULT 0,

    CustomerTypeID INT NULL,
    CustomerGroupID INT NULL,

    CONSTRAINT FK_tblSales_Customer FOREIGN KEY (CustomerID) REFERENCES tblCustomer(ID),
    CONSTRAINT FK_tblSales_OnlineCompany FOREIGN KEY (OnlineOrderCompanyID) REFERENCES tblOnlineOrderCompany(ID)
);

-- Pending orders (active items in kitchen - BEFORE completion)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPendingOrders')
CREATE TABLE tblPendingOrders (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SalesID INT NOT NULL,
    ItemID INT NOT NULL,
    SizeID INT NOT NULL,

    Qty DECIMAL(10,2) NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0,

    Tastes NVARCHAR(500) NULL,
    SideDishes NVARCHAR(500) NULL,

    ItemName NVARCHAR(100) NOT NULL,
    ItemName2 NVARCHAR(100) NULL,
    SizeName NVARCHAR(50) NULL,

    -- Tax flags
    ApplyGST BIT DEFAULT 1,
    ApplyPST BIT DEFAULT 1,
    ApplyPST2 BIT DEFAULT 0,

    DSCAmt DECIMAL(10,2) DEFAULT 0,
    DSCAmtEmployee DECIMAL(10,2) DEFAULT 0,
    DSCAmtType1 DECIMAL(10,2) DEFAULT 0,
    DSCAmtType2 DECIMAL(10,2) DEFAULT 0,
    DayHourDiscountRate DECIMAL(5,4) DEFAULT 0,

    -- Kitchen routing
    KitchenB BIT DEFAULT 0,
    KitchenF BIT DEFAULT 0,
    KitchenE BIT DEFAULT 0,
    Bar BIT DEFAULT 0,

    PersonIndex INT DEFAULT 1,
    SeparateBillPrint BIT DEFAULT 0,
    ApplyNoDSC BIT DEFAULT 0,
    OpenItem BIT DEFAULT 0,
    ExtraChargeItem BIT DEFAULT 0,

    PricePerWeightUnit DECIMAL(10,2) NULL,

    CONSTRAINT FK_tblPendingOrders_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID),
    CONSTRAINT FK_tblPendingOrders_Item FOREIGN KEY (ItemID) REFERENCES tblItem(ID),
    CONSTRAINT FK_tblPendingOrders_Size FOREIGN KEY (SizeID) REFERENCES tblSize(ID)
);

-- Sales detail (completed order items - AFTER completion)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSalesDetail')
CREATE TABLE tblSalesDetail (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SalesID INT NOT NULL,
    ItemID INT NOT NULL,
    SizeID INT NOT NULL,

    Qty DECIMAL(10,2) NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0,

    PricePerWeightUnit DECIMAL(10,2) NULL,
    MeasuredWeight DECIMAL(10,3) NULL,
    DecimalPlaces INT DEFAULT 0,

    DiscountAmt DECIMAL(10,2) DEFAULT 0,
    DiscountPercent DECIMAL(5,2) DEFAULT 0,

    Tastes NVARCHAR(500) NULL,
    SideDishes NVARCHAR(500) NULL,

    ItemName NVARCHAR(100) NOT NULL,
    ItemName2 NVARCHAR(100) NULL,
    SizeName NVARCHAR(50) NULL,

    SequenceNo INT DEFAULT 1,
    Voided BIT DEFAULT 0,

    -- Tax flags (copy from menu item at time of sale)
    ApplyGST BIT DEFAULT 1,
    ApplyPST BIT DEFAULT 1,
    ApplyPST2 BIT DEFAULT 0,

    -- Kitchen routing (copy from menu item)
    KitchenB BIT DEFAULT 0,
    KitchenF BIT DEFAULT 0,
    KitchenE BIT DEFAULT 0,
    Bar BIT DEFAULT 0,

    CONSTRAINT FK_tblSalesDetail_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID),
    CONSTRAINT FK_tblSalesDetail_Item FOREIGN KEY (ItemID) REFERENCES tblItem(ID),
    CONSTRAINT FK_tblSalesDetail_Size FOREIGN KEY (SizeID) REFERENCES tblSize(ID)
);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPayment')
CREATE TABLE tblPayment (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SalesID INT NOT NULL,
    PaymentTypeID INT NOT NULL,

    PaidAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
    TipAmount DECIMAL(10,2) DEFAULT 0,

    CardNumber NVARCHAR(100) NULL,  -- Encrypted
    CardExpiryDate NVARCHAR(10) NULL,
    AuthorizationNo NVARCHAR(50) NULL,

    SequenceNo INT DEFAULT 1,
    CardReceipt NVARCHAR(MAX) NULL,
    BatchNo NVARCHAR(50) NULL,
    ItemNo NVARCHAR(50) NULL,
    RevisionNo INT DEFAULT 0,

    StationName NVARCHAR(50) NULL,
    TrackData NVARCHAR(500) NULL,
    TipAdjusted BIT DEFAULT 0,
    PaidDateTime DATETIME DEFAULT GETDATE(),
    Voided BIT DEFAULT 0,

    CONSTRAINT FK_tblPayment_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID),
    CONSTRAINT FK_tblPayment_PaymentType FOREIGN KEY (PaymentTypeID) REFERENCES tblPaymentType(ID)
);

-- =============================================================================
-- LOYALTY / POINTS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPointsDetail')
CREATE TABLE tblPointsDetail (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SalesID INT NOT NULL,
    CustomerID INT NOT NULL,
    PointUsed INT DEFAULT 0,
    PointSaved INT DEFAULT 0,
    TransactionDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_tblPointsDetail_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID),
    CONSTRAINT FK_tblPointsDetail_Customer FOREIGN KEY (CustomerID) REFERENCES tblCustomer(ID)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPointReward')
CREATE TABLE tblPointReward (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    PointsRequired INT NOT NULL,
    RewardAmount DECIMAL(10,2) NOT NULL,
    Description NVARCHAR(255) NULL
);

-- =============================================================================
-- GIFT CARDS / PREPAID CARDS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPrepaidCards')
CREATE TABLE tblPrepaidCards (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Barcode NVARCHAR(50) NOT NULL UNIQUE,
    Balance DECIMAL(10,2) DEFAULT 0,
    InitialAmount DECIMAL(10,2) DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    LastUsedDate DATETIME NULL
);

-- =============================================================================
-- ONLINE ORDERS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOnlineOrders')
CREATE TABLE tblOnlineOrders (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    OnlineOrderCompanyID INT NOT NULL,
    OnlineOrderNumber NVARCHAR(100) NOT NULL,
    CustomerName NVARCHAR(100) NULL,
    CustomerPhone NVARCHAR(20) NULL,
    OrderDateTime DATETIME DEFAULT GETDATE(),
    Status INT DEFAULT 0,  -- 0=Pending, 1=Accepted, 2=Completed, 3=Cancelled

    CONSTRAINT FK_tblOnlineOrders_Company FOREIGN KEY (OnlineOrderCompanyID) REFERENCES tblOnlineOrderCompany(ID)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOnlineOrderDetail')
CREATE TABLE tblOnlineOrderDetail (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    OnlineOrderID INT NOT NULL,
    ItemID INT NOT NULL,
    SizeID INT NOT NULL,
    Qty DECIMAL(10,2) NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    Tastes NVARCHAR(500) NULL,

    CONSTRAINT FK_tblOnlineOrderDetail_Order FOREIGN KEY (OnlineOrderID) REFERENCES tblOnlineOrders(ID),
    CONSTRAINT FK_tblOnlineOrderDetail_Item FOREIGN KEY (ItemID) REFERENCES tblItem(ID)
);

-- Link sales to online orders
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSalesOfOnlineOrders')
CREATE TABLE tblSalesOfOnlineOrders (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SalesID INT NOT NULL,
    OnlineOrderCompanyID INT NOT NULL,
    OnlineOrderNumber NVARCHAR(100) NULL,
    OnlineOrderCustomerName NVARCHAR(100) NULL,
    DineInOrder BIT DEFAULT 0,
    ReservedTipAmt DECIMAL(10,2) DEFAULT 0,
    DeliveryChargeAmt DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT FK_tblSalesOfOnlineOrders_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID),
    CONSTRAINT FK_tblSalesOfOnlineOrders_Company FOREIGN KEY (OnlineOrderCompanyID) REFERENCES tblOnlineOrderCompany(ID)
);

-- =============================================================================
-- DISCOUNTS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDayHourDiscount')
CREATE TABLE tblDayHourDiscount (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    DayOfWeek INT NOT NULL,  -- 0=Sunday, 1=Monday, etc.
    StartHour INT NOT NULL,
    EndHour INT NOT NULL,
    DiscountRate DECIMAL(5,4) NOT NULL,
    CategoryID INT NULL,
    ItemID INT NULL,
    IsActive BIT DEFAULT 1,

    CONSTRAINT FK_tblDayHourDiscount_Category FOREIGN KEY (CategoryID) REFERENCES tblCategory(ID),
    CONSTRAINT FK_tblDayHourDiscount_Item FOREIGN KEY (ItemID) REFERENCES tblItem(ID)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDiscountDetail')
CREATE TABLE tblDiscountDetail (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SalesID INT NOT NULL,
    DiscountType INT NOT NULL,  -- 1=Manual, 2=DayHour, 3=Coupon
    DiscountAmount DECIMAL(10,2) NOT NULL,
    DiscountRate DECIMAL(5,4) NULL,

    CONSTRAINT FK_tblDiscountDetail_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID)
);

-- =============================================================================
-- CONFIGURATION
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblTaxConfig')
CREATE TABLE tblTaxConfig (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TaxCode NVARCHAR(10) NOT NULL UNIQUE,
    TaxName NVARCHAR(50) NOT NULL,
    TaxRate DECIMAL(5,4) NOT NULL DEFAULT 0
);

PRINT 'Database schema created successfully';
GO
