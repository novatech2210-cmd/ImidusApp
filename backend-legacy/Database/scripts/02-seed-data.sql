-- INI POS Seed Data for Testing
-- Sample restaurant menu data

USE TPPro;
GO

-- =============================================================================
-- PAYMENT TYPES (FIXED IDs per INI POS)
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblPaymentType WHERE ID = 1)
BEGIN
    SET IDENTITY_INSERT tblPaymentType OFF;
    INSERT INTO tblPaymentType (ID, PaymentTypeName) VALUES
    (1, 'Cash'),
    (2, 'Debit'),
    (3, 'Visa'),
    (4, 'MasterCard'),
    (5, 'Amex'),
    (6, 'Gift Card'),
    (7, 'JCB'),
    (8, 'Discover');
END

-- =============================================================================
-- TAX CONFIGURATION (Canadian taxes)
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblTaxConfig WHERE TaxCode = 'GST')
BEGIN
    INSERT INTO tblTaxConfig (TaxCode, TaxName, TaxRate) VALUES
    ('GST', 'Goods and Services Tax', 0.05),
    ('PST', 'Provincial Sales Tax', 0.07),
    ('PST2', 'Additional Provincial Tax', 0.00);
END

-- =============================================================================
-- SIZES
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblSize WHERE SizeName = 'Regular')
BEGIN
    INSERT INTO tblSize (SizeName) VALUES
    ('Regular'),
    ('Small'),
    ('Medium'),
    ('Large'),
    ('Extra Large'),
    ('Glass'),
    ('Pitcher'),
    ('Bottle'),
    ('Can'),
    ('Half'),
    ('Full');
END

-- =============================================================================
-- CATEGORIES
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblCategory WHERE CatName = 'Appetizers')
BEGIN
    INSERT INTO tblCategory (CatName, PrintOrder) VALUES
    ('Appetizers', 1),
    ('Soups', 2),
    ('Salads', 3),
    ('Main Dishes', 4),
    ('Noodles', 5),
    ('Rice Dishes', 6),
    ('Sushi', 7),
    ('Desserts', 8),
    ('Beverages', 9),
    ('Alcoholic Beverages', 10),
    ('Kids Menu', 11),
    ('Specials', 12);
END

-- =============================================================================
-- CUSTOMER TYPES & GROUPS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblCustomerType WHERE TypeName = 'Regular')
BEGIN
    INSERT INTO tblCustomerType (TypeName) VALUES
    ('Regular'),
    ('VIP'),
    ('Employee'),
    ('Senior');
END

IF NOT EXISTS (SELECT * FROM tblCustomerGroup WHERE GroupName = 'Default')
BEGIN
    INSERT INTO tblCustomerGroup (GroupName) VALUES
    ('Default'),
    ('Frequent Diner'),
    ('Corporate');
END

-- =============================================================================
-- ONLINE ORDER COMPANIES
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblOnlineOrderCompany WHERE CompanyName = 'IMIDUS App')
BEGIN
    INSERT INTO tblOnlineOrderCompany (CompanyName, IsActive) VALUES
    ('IMIDUS App', 1),
    ('Uber Eats', 1),
    ('Skip The Dishes', 1),
    ('DoorDash', 1),
    ('Website', 1);
END

-- =============================================================================
-- SAMPLE MENU ITEMS
-- =============================================================================

-- Get category IDs
DECLARE @AppetizersID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Appetizers');
DECLARE @SoupsID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Soups');
DECLARE @MainDishesID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Main Dishes');
DECLARE @NoodlesID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Noodles');
DECLARE @RiceID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Rice Dishes');
DECLARE @SushiID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Sushi');
DECLARE @DessertsID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Desserts');
DECLARE @BeveragesID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Beverages');
DECLARE @AlcoholID INT = (SELECT ID FROM tblCategory WHERE CatName = 'Alcoholic Beverages');

-- Get size IDs
DECLARE @RegularID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Regular');
DECLARE @SmallID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Small');
DECLARE @MediumID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Medium');
DECLARE @LargeID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Large');
DECLARE @GlassID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Glass');
DECLARE @PitcherID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Pitcher');
DECLARE @CanID INT = (SELECT ID FROM tblSize WHERE SizeName = 'Can');

-- APPETIZERS
IF NOT EXISTS (SELECT * FROM tblItem WHERE IName = 'Spring Rolls')
BEGIN
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenB, ItemDescription) VALUES
    ('Spring Rolls', 'Veggie Rolls', @AppetizersID, 1, 1, 0, 1, 1, 'Crispy vegetable spring rolls with sweet chili sauce'),
    ('Pot Stickers', 'Gyoza', @AppetizersID, 1, 1, 0, 1, 1, 'Pan-fried dumplings with pork filling'),
    ('Edamame', NULL, @AppetizersID, 1, 1, 0, 1, 1, 'Steamed soybeans with sea salt'),
    ('Chicken Wings', 'Korean Wings', @AppetizersID, 1, 1, 0, 1, 1, 'Crispy fried chicken wings with choice of sauce'),
    ('Tempura', 'Veggie Tempura', @AppetizersID, 1, 1, 0, 1, 1, 'Lightly battered vegetables');

    -- SOUPS
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenB, ItemDescription) VALUES
    ('Miso Soup', NULL, @SoupsID, 1, 1, 0, 1, 1, 'Traditional Japanese miso soup with tofu and seaweed'),
    ('Wonton Soup', NULL, @SoupsID, 1, 1, 0, 1, 1, 'Pork wontons in clear broth'),
    ('Hot and Sour Soup', NULL, @SoupsID, 1, 1, 0, 1, 1, 'Spicy and tangy Chinese soup');

    -- MAIN DISHES
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenB, ItemDescription) VALUES
    ('General Tso Chicken', 'General Chicken', @MainDishesID, 1, 1, 0, 1, 1, 'Crispy chicken in sweet and spicy sauce'),
    ('Beef with Broccoli', NULL, @MainDishesID, 1, 1, 0, 1, 1, 'Tender beef stir-fried with fresh broccoli'),
    ('Sweet and Sour Pork', NULL, @MainDishesID, 1, 1, 0, 1, 1, 'Crispy pork in tangy sweet and sour sauce'),
    ('Kung Pao Chicken', NULL, @MainDishesID, 1, 1, 0, 1, 1, 'Spicy chicken with peanuts'),
    ('Teriyaki Salmon', NULL, @MainDishesID, 1, 1, 0, 1, 1, 'Grilled salmon with teriyaki glaze'),
    ('Korean BBQ Beef', 'Bulgogi', @MainDishesID, 1, 1, 0, 1, 1, 'Marinated beef with Korean spices');

    -- NOODLES
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenB, ItemDescription) VALUES
    ('Pad Thai', NULL, @NoodlesID, 1, 1, 0, 1, 1, 'Thai stir-fried rice noodles with shrimp'),
    ('Chow Mein', NULL, @NoodlesID, 1, 1, 0, 1, 1, 'Stir-fried egg noodles with vegetables'),
    ('Singapore Noodles', NULL, @NoodlesID, 1, 1, 0, 1, 1, 'Curry-flavored rice vermicelli'),
    ('Ramen', 'Tonkotsu Ramen', @NoodlesID, 1, 1, 0, 1, 1, 'Rich pork bone broth with ramen noodles');

    -- RICE DISHES
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenB, ItemDescription) VALUES
    ('Fried Rice', 'House Special', @RiceID, 1, 1, 0, 1, 1, 'Wok-fried rice with eggs and vegetables'),
    ('Chicken Curry Rice', NULL, @RiceID, 1, 1, 0, 1, 1, 'Japanese curry with chicken over rice'),
    ('Bibimbap', 'Korean Rice Bowl', @RiceID, 1, 1, 0, 1, 1, 'Mixed rice bowl with vegetables and egg'),
    ('Katsu Don', NULL, @RiceID, 1, 1, 0, 1, 1, 'Breaded pork cutlet over rice');

    -- SUSHI
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenF, ItemDescription) VALUES
    ('California Roll', NULL, @SushiID, 1, 1, 0, 1, 1, 'Crab, avocado, and cucumber roll'),
    ('Salmon Roll', NULL, @SushiID, 1, 1, 0, 1, 1, 'Fresh salmon sushi roll'),
    ('Dragon Roll', NULL, @SushiID, 1, 1, 0, 1, 1, 'Eel and cucumber topped with avocado'),
    ('Rainbow Roll', NULL, @SushiID, 1, 1, 0, 1, 1, 'California roll topped with assorted fish'),
    ('Sashimi Platter', NULL, @SushiID, 1, 1, 0, 1, 1, 'Assortment of fresh raw fish');

    -- DESSERTS
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, KitchenB, ItemDescription) VALUES
    ('Green Tea Ice Cream', 'Matcha Ice Cream', @DessertsID, 1, 1, 0, 1, 1, 'Japanese green tea flavored ice cream'),
    ('Mochi', 'Rice Cake', @DessertsID, 1, 1, 0, 1, 1, 'Japanese rice cake with ice cream'),
    ('Fried Banana', NULL, @DessertsID, 1, 1, 0, 1, 1, 'Crispy fried banana with honey'),
    ('Cheesecake', 'Japanese Cheesecake', @DessertsID, 1, 1, 0, 1, 1, 'Light and fluffy Japanese cheesecake');

    -- BEVERAGES (No PST on basic beverages in some provinces)
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, OnlineItem, Bar, ItemDescription) VALUES
    ('Green Tea', 'Hot Tea', @BeveragesID, 1, 0, 0, 1, 1, 'Traditional Japanese green tea'),
    ('Soft Drink', 'Pop', @BeveragesID, 1, 1, 0, 1, 1, 'Choice of Coca-Cola products'),
    ('Thai Iced Tea', NULL, @BeveragesID, 1, 1, 0, 1, 1, 'Sweet Thai tea with cream'),
    ('Bubble Tea', 'Boba', @BeveragesID, 1, 1, 0, 1, 1, 'Milk tea with tapioca pearls'),
    ('Coffee', NULL, @BeveragesID, 1, 0, 0, 1, 1, 'Fresh brewed coffee');

    -- ALCOHOLIC BEVERAGES (Special tax handling)
    INSERT INTO tblItem (IName, IName2, CategoryID, ApplyGST, ApplyPST, ApplyPST2, Alcohol, OnlineItem, Bar, ItemDescription) VALUES
    ('House Beer', 'Draft Beer', @AlcoholID, 1, 1, 0, 1, 1, 1, 'Local craft beer on tap'),
    ('Sake', 'Hot Sake', @AlcoholID, 1, 1, 0, 1, 1, 1, 'Japanese rice wine'),
    ('Soju', NULL, @AlcoholID, 1, 1, 0, 1, 1, 1, 'Korean rice spirit'),
    ('House Wine', 'Red/White', @AlcoholID, 1, 1, 0, 1, 1, 1, 'Glass of house wine'),
    ('Plum Wine', NULL, @AlcoholID, 1, 1, 0, 1, 1, 1, 'Sweet Japanese plum wine');
END

-- =============================================================================
-- ITEM SIZES AND PRICES
-- =============================================================================

-- Add prices for each item
IF NOT EXISTS (SELECT * FROM tblAvailableSize WHERE ItemID = 1)
BEGIN
    DECLARE @ItemID INT;

    -- Cursor through all items to add sizes
    DECLARE item_cursor CURSOR FOR SELECT ID FROM tblItem;
    OPEN item_cursor;
    FETCH NEXT FROM item_cursor INTO @ItemID;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @CategoryID INT = (SELECT CategoryID FROM tblItem WHERE ID = @ItemID);
        DECLARE @IsAlcohol BIT = (SELECT Alcohol FROM tblItem WHERE ID = @ItemID);

        -- Different pricing based on category
        IF @CategoryID = @AppetizersID
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @RegularID, 8.99);
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @LargeID, 12.99);
        END
        ELSE IF @CategoryID = @SoupsID
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @SmallID, 4.99);
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @LargeID, 7.99);
        END
        ELSE IF @CategoryID IN (@MainDishesID, @NoodlesID, @RiceID)
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @RegularID, 15.99);
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @LargeID, 19.99);
        END
        ELSE IF @CategoryID = @SushiID
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @RegularID, 12.99);
        END
        ELSE IF @CategoryID = @DessertsID
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @RegularID, 6.99);
        END
        ELSE IF @CategoryID = @BeveragesID
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @RegularID, 2.99);
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @LargeID, 3.99);
        END
        ELSE IF @CategoryID = @AlcoholID
        BEGIN
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @GlassID, 7.99);
            INSERT INTO tblAvailableSize (ItemID, SizeID, UnitPrice) VALUES (@ItemID, @PitcherID, 24.99);
        END

        FETCH NEXT FROM item_cursor INTO @ItemID;
    END

    CLOSE item_cursor;
    DEALLOCATE item_cursor;
END

-- =============================================================================
-- SAMPLE CUSTOMERS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblCustomer WHERE Phone = '6041234567')
BEGIN
    INSERT INTO tblCustomer (CustomerNum, FName, LName, Phone, Email, Address, City, PostalCode, BirthMonth, BirthDay, EarnedPoints, CustomerTypeID) VALUES
    ('CUST001', 'John', 'Smith', '6041234567', 'john.smith@email.com', '123 Main St', 'Vancouver', 'V6B 1A1', 3, 15, 150, 1),
    ('CUST002', 'Jane', 'Doe', '6049876543', 'jane.doe@email.com', '456 Oak Ave', 'Burnaby', 'V5H 2K3', 7, 22, 320, 2),
    ('CUST003', 'Mike', 'Johnson', '7785551234', 'mike.j@email.com', '789 Pine Rd', 'Richmond', 'V6X 3T2', 11, 8, 75, 1),
    ('CUST004', 'Sarah', 'Williams', '6042223333', 'sarah.w@email.com', '321 Maple Dr', 'Surrey', 'V3T 4R5', 5, 30, 500, 2),
    ('CUST005', 'David', 'Brown', '7789998888', 'david.b@email.com', '654 Cedar Ln', 'Coquitlam', 'V3K 1M2', 9, 12, 200, 1);
END

-- =============================================================================
-- SAMPLE GIFT CARDS
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblPrepaidCards WHERE Barcode = 'GC100001')
BEGIN
    INSERT INTO tblPrepaidCards (Barcode, Balance, InitialAmount, IsActive) VALUES
    ('GC100001', 50.00, 50.00, 1),
    ('GC100002', 25.00, 100.00, 1),
    ('GC100003', 100.00, 100.00, 1),
    ('GC100004', 0.00, 25.00, 0),  -- Used up
    ('GC100005', 75.50, 100.00, 1);
END

-- =============================================================================
-- LOYALTY REWARDS CONFIGURATION
-- =============================================================================

IF NOT EXISTS (SELECT * FROM tblPointReward WHERE PointsRequired = 100)
BEGIN
    INSERT INTO tblPointReward (PointsRequired, RewardAmount, Description) VALUES
    (100, 5.00, '$5 off your order'),
    (200, 12.00, '$12 off your order'),
    (500, 35.00, '$35 off your order'),
    (1000, 75.00, '$75 off your order');
END

PRINT 'Seed data inserted successfully';
GO
