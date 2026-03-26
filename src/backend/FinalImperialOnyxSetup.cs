using System;
using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;

namespace FinalImperialOnyxSetup
{
    class Program
    {
        static void Main(string[] args)
        {
            string connectionString = "Server=localhost,1433;Database=IntegrationService;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;Encrypt=False;";
            
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                Console.WriteLine("Connected to IntegrationService database.");

                // 1. Ensure Table Schema is updated (if not already)
                conn.Execute(@"
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MenuOverlays') AND name = 'CategoryId')
                    BEGIN
                        ALTER TABLE MenuOverlays ADD CategoryId INT NULL;
                        CREATE INDEX IX_MenuOverlays_CategoryId ON MenuOverlays(CategoryId);
                    END
                ");

                // 2. Clear old mappings to start fresh for major categories
                conn.Execute("DELETE FROM MenuOverlays WHERE CategoryId IS NOT NULL OR ItemId IN (54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,97,98,99,100)");

                var mappings = new[]
                {
                    // --- CATEGORY LEVEL OVERLAYS ---
                    new { ItemId = (int?)null, CategoryId = (int?)1, Image = "/images/menu/breakfast.png" }, // Breakfast
                    new { ItemId = (int?)null, CategoryId = (int?)2, Image = "/images/menu/breakfast_sandwich_premium.png" },
                    new { ItemId = (int?)null, CategoryId = (int?)3, Image = "/images/menu/platter.png" }, // Platters
                    new { ItemId = (int?)null, CategoryId = (int?)4, Image = "/images/menu/omelet.png" }, // Omelets
                    new { ItemId = (int?)null, CategoryId = (int?)5, Image = "/images/menu/hot_sandwich.png" }, // Specialty Sandwiches
                    new { ItemId = (int?)null, CategoryId = (int?)6, Image = "/images/menu/hot_sandwich.png" }, // Sandwiches
                    new { ItemId = (int?)null, CategoryId = (int?)7, Image = "/images/menu/salads.png" }, // Salads
                    new { ItemId = (int?)null, CategoryId = (int?)8, Image = "/images/menu/soup_chili.png" }, // Soup
                    new { ItemId = (int?)null, CategoryId = (int?)9, Image = "/images/menu/turkey_club_gourmet.png" }, // Club
                    new { ItemId = (int?)null, CategoryId = (int?)10, Image = "/images/menu/beverages.png" }, // Beverages

                    // --- ITEM LEVEL OVERLAYS (EXCEPTIONS / HIGHLIGHTS) ---
                    new { ItemId = (int?)58, CategoryId = (int?)null, Image = "/images/menu/steak_cheese_philly_luxury.png" },
                    new { ItemId = (int?)59, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" },
                    new { ItemId = (int?)74, CategoryId = (int?)null, Image = "/images/menu/soup_chili.png" },
                    new { ItemId = (int?)97, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" }
                };

                foreach (var m in mappings)
                {
                    conn.Execute(
                        "INSERT INTO MenuOverlays (ItemId, CategoryId, OverrideImageUrl, IsEnabled) VALUES (@ItemId, @CategoryId, @Image, 1)",
                        new { m.ItemId, m.CategoryId, m.Image });
                    
                    if (m.ItemId.HasValue)
                        Console.WriteLine($"Mapped Item {m.ItemId} -> {m.Image}");
                    else
                        Console.WriteLine($"Mapped Category {m.CategoryId} -> {m.Image}");
                }
            }
            Console.WriteLine("Imperial Onyx Final Mapping Complete.");
        }
    }
}
