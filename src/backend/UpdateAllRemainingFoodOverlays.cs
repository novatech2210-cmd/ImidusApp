
using System;
using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;

namespace UpdateAllRemainingFoodOverlays
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

                var mappings = new[]
                {
                    // SPECIALTY SANDWICHES & WRAP (Category 5)
                    new { ItemId = (int?)54, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" }, // Jeans Special
                    new { ItemId = (int?)55, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" }, // Avocado Delight
                    new { ItemId = (int?)56, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" }, // Chicken Breast Avocado
                    new { ItemId = (int?)57, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" }, // Veggie
                    new { ItemId = (int?)58, CategoryId = (int?)null, Image = "/images/menu/steak_cheese_philly_luxury.png" }, // Italian Cold Cut
                    new { ItemId = (int?)59, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" }, // Turkey Deluxe
                    new { ItemId = (int?)60, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" }, // Wraps (fallback)
                    new { ItemId = (int?)61, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" },
                    new { ItemId = (int?)62, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" },
                    new { ItemId = (int?)63, CategoryId = (int?)null, Image = "/images/menu/hot_sandwich.png" },

                    // SALADS (Category 7)
                    new { ItemId = (int?)64, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)65, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)66, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)67, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)68, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)69, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)70, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)71, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)72, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)73, CategoryId = (int?)null, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)74, CategoryId = (int?)null, Image = "/images/menu/soup_chili.png" },
                    new { ItemId = (int?)75, CategoryId = (int?)null, Image = "/images/menu/soup_chili.png" },
                    new { ItemId = (int?)76, CategoryId = (int?)null, Image = "/images/menu/soup_chili.png" },
                    new { ItemId = (int?)77, CategoryId = (int?)null, Image = "/images/menu/soup_chili.png" },

                    // CLUB CORNER (Category 9)
                    new { ItemId = (int?)100, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" },
                    new { ItemId = (int?)97, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" },
                    new { ItemId = (int?)98, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" },
                    new { ItemId = (int?)99, CategoryId = (int?)null, Image = "/images/menu/turkey_club_gourmet.png" },
                    
                    // CATEGORY MAPPINGS
                    new { ItemId = (int?)null, CategoryId = (int?)5, Image = "/images/menu/hot_sandwich.png" },
                    new { ItemId = (int?)null, CategoryId = (int?)7, Image = "/images/menu/salads.png" },
                    new { ItemId = (int?)null, CategoryId = (int?)9, Image = "/images/menu/turkey_club_gourmet.png" },
                };

                foreach (var m in mappings)
                {
                    if (m.ItemId.HasValue)
                    {
                        conn.Execute("DELETE FROM MenuOverlays WHERE ItemId = @ItemId AND CategoryId IS NULL", new { m.ItemId });
                        conn.Execute(
                            "INSERT INTO MenuOverlays (ItemId, CategoryId, OverrideImageUrl) VALUES (@ItemId, @CategoryId, @Image)",
                            new { m.ItemId, m.CategoryId, m.Image });
                        Console.WriteLine($"Updated Item {m.ItemId} with {m.Image}");
                    }
                    else if (m.CategoryId.HasValue)
                    {
                        conn.Execute("DELETE FROM MenuOverlays WHERE CategoryId = @CategoryId AND ItemId IS NULL", new { m.CategoryId });
                        conn.Execute(
                            "INSERT INTO MenuOverlays (ItemId, CategoryId, OverrideImageUrl) VALUES (@ItemId, @CategoryId, @Image)",
                            new { m.ItemId, m.CategoryId, m.Image });
                        Console.WriteLine($"Updated Category {m.CategoryId} with {m.Image}");
                    }
                }
            }
            Console.WriteLine("Done.");
        }
    }
}
