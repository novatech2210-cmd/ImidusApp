using System;
using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;

class CheckDb
{
    static async System.Threading.Tasks.Task Main()
    {
        string connectionString = "Server=localhost,1433;Database=IntegrationService;User ID=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;";
        
        try
        {
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            Console.WriteLine("Connected to IntegrationService successfully.");

            // Check if Users table exists
            var tableExists = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'Users'");

            if (tableExists == 0)
            {
                Console.WriteLine("ERROR: Users table DOES NOT EXIST in IntegrationService database.");
                return;
            }

            Console.WriteLine("Users table exists.");

            // List users
            var users = await connection.QueryAsync("SELECT ID, Email, CustomerID, IsActive FROM Users");
            Console.WriteLine($"Found {users.Count()} users:");
            foreach (var user in users)
            {
                Console.WriteLine($"- ID: {user.ID}, Email: {user.Email}, CustomerID: {user.CustomerID}, Active: {user.IsActive}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
        }
    }
}
