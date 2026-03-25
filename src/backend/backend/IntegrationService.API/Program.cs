using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Services;
using IntegrationService.Core.Configuration;
using IntegrationService.Core.Models;
using IntegrationService.Infrastructure.Data;
using IntegrationService.Infrastructure.Services;
using IntegrationService.API.BackgroundServices;
using IntegrationService.API.Middleware;
using Serilog;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Text;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using IntegrationService.API.Services;
using SendGrid.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TOAST POS Integration API",
        Version = "v2.0",  // Increment version
        Description = "Online ordering API with size-based pricing"
    });

    // Add XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    
    options.AddPolicy("AllowMobileApp",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Health Checks - configure for both databases with graceful handling of missing connection strings
var posConnectionString = builder.Configuration.GetConnectionString("PosDatabase");
var backendConnectionString = builder.Configuration.GetConnectionString("BackendDatabase");

var healthChecks = builder.Services.AddHealthChecks();

if (!string.IsNullOrEmpty(posConnectionString))
{
    healthChecks.AddSqlServer(
        connectionString: posConnectionString,
        healthQuery: "SELECT 1",
        name: "pos-database",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "db", "sql", "pos" });
}

if (!string.IsNullOrEmpty(backendConnectionString))
{
    healthChecks.AddSqlServer(
        connectionString: backendConnectionString,
        healthQuery: "SELECT 1",
        name: "backend-database",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "db", "sql", "backend" });
}

// Configuration with validation
builder.Services.AddOptions<OnlineOrderSettings>()
    .BindConfiguration(OnlineOrderSettings.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<AuthorizeNetSettings>()
    .BindConfiguration(AuthorizeNetSettings.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<JwtSettings>()
    .BindConfiguration("JwtSettings")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
if (jwtSettings != null && !string.IsNullOrEmpty(jwtSettings.Secret))
{
    var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Allow HTTP in development
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
}

// Initialize Firebase Admin SDK
// NOTE: firebase-admin-key.json is a deployment-time config file
// Place in API root directory before production deployment
var firebaseKeyPath = Path.Combine(AppContext.BaseDirectory, "firebase-admin-key.json");
if (File.Exists(firebaseKeyPath))
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile(firebaseKeyPath)
    });
    Log.Information("Firebase Admin SDK initialized successfully");
}
else
{
    Log.Warning("firebase-admin-key.json not found. Push notifications will fail until configured.");
}

// Repository Registrations
builder.Services.AddScoped<IPosRepository, PosRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IIdempotencyRepository, IdempotencyRepository>();
builder.Services.AddScoped<IOrderNumberRepository, OrderNumberRepository>();
builder.Services.AddScoped<IDeviceTokenRepository, DeviceTokenRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IMiscRepository, MiscRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<INotificationLogRepository, NotificationLogRepository>();
builder.Services.AddScoped<IOnlineOrderStatusRepository, OnlineOrderStatusRepository>();

// Milestone 4 Admin Portal Repositories
builder.Services.AddScoped<IActivityLogRepository>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<ActivityLogRepository>>();
    var connectionString = configuration.GetConnectionString("BackendDatabase")
        ?? throw new ArgumentNullException("BackendDatabase connection string not found");
    return new ActivityLogRepository(connectionString, logger);
});

// ScheduledOrderRepository with factory to provide connection string
builder.Services.AddScoped<IScheduledOrderRepository>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<ScheduledOrderRepository>>();
    var connectionString = configuration.GetConnectionString("BackendDatabase")
        ?? throw new ArgumentNullException("BackendDatabase connection string not found");
    return new ScheduledOrderRepository(connectionString, logger);
});

// MarketingRuleRepository with factory to provide connection string
builder.Services.AddScoped<IMarketingRuleRepository>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<MarketingRuleRepository>>();
    var connectionString = configuration.GetConnectionString("BackendDatabase")
        ?? throw new ArgumentNullException("BackendDatabase connection string not found");
    return new MarketingRuleRepository(connectionString, logger);
});

// Core Services
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<IOrderProcessingService, OrderProcessingService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IUpsellService, UpsellService>();
builder.Services.AddScoped<BirthdayRewardService>();
builder.Services.AddHostedService<BirthdayRewardBackgroundService>();
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<IPaymentService, MockPaymentService>();
}
else
{
    builder.Services.AddScoped<IPaymentService, PaymentService>();
}
builder.Services.AddScoped<INotificationService, FcmNotificationService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

// Milestone 4 Admin Portal Service
builder.Services.AddScoped<AdminPortalService>();

// Add SendGrid
builder.Services.AddSendGrid(options =>
{
    options.ApiKey = builder.Configuration["SendGrid:ApiKey"];
});

// Add Email Service
builder.Services.AddScoped<IEmailService, EmailService>();

// Background Services
builder.Services.AddHostedService<OrderStatusPollingService>();
builder.Services.AddHostedService<ScheduledOrderReleaseService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowWebApp");
app.UseCors("AllowMobileApp");
// app.UseHttpsRedirection();
app.UseRouting();
app.UseMiddleware<IdempotencyMiddleware>();
app.UseAuthentication(); // Add JWT authentication middleware
app.UseAuthorization();
app.MapControllers();

// Health check endpoint with detailed JSON response
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Database Initialization (Overlay Store)
using (var scope = app.Services.CreateScope())
{
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var backendDb = configuration.GetConnectionString("BackendDatabase");
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    if (!string.IsNullOrEmpty(backendDb))
    {
        try 
        {
            using var conn = new Microsoft.Data.SqlClient.SqlConnection(backendDb);
            await conn.OpenAsync();
            
            // NotificationLogs
            var notificationLogsExists = await Dapper.SqlMapper.ExecuteScalarAsync<int>(conn, "SELECT COUNT(*) FROM sys.tables WHERE name = 'NotificationLogs'");
            if (notificationLogsExists == 0)
            {
                await Dapper.SqlMapper.ExecuteAsync(conn, @"
                    CREATE TABLE NotificationLogs (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        CustomerId INT NOT NULL,
                        DeviceTokenId INT NULL,
                        NotificationType NVARCHAR(50) NOT NULL,
                        Title NVARCHAR(200) NOT NULL,
                        Body NVARCHAR(1000) NOT NULL,
                        Status NVARCHAR(50) NOT NULL,
                        FcmResponse NVARCHAR(MAX) NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                    )");
                logger.LogInformation("Created NotificationLogs table in IntegrationService database");
            }

            // ScheduledOrders
            var scheduledOrdersExists = await Dapper.SqlMapper.ExecuteScalarAsync<int>(conn, "SELECT COUNT(*) FROM sys.tables WHERE name = 'ScheduledOrders'");
            if (scheduledOrdersExists == 0)
            {
                await Dapper.SqlMapper.ExecuteAsync(conn, @"
                    CREATE TABLE ScheduledOrders (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        PosCustomerId INT NOT NULL,
                        CustomerFirstName NVARCHAR(100) NULL,
                        CustomerLastName NVARCHAR(100) NULL,
                        CustomerPhone NVARCHAR(20) NULL,
                        ScheduledDateTime DATETIME2 NOT NULL,
                        Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
                        ItemsJson NVARCHAR(MAX) NOT NULL,
                        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
                        TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
                        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
                        PaymentAuthorizationNo NVARCHAR(100) NULL,
                        PaymentBatchNo NVARCHAR(100) NULL,
                        PaymentTypeId INT NULL,
                        TipAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
                        SpecialInstructions NVARCHAR(500) NULL,
                        IdempotencyKey NVARCHAR(100) NOT NULL UNIQUE,
                        PosSalesId INT NULL,
                        PosOrderNumber NVARCHAR(50) NULL,
                        ReleasedDateTime DATETIME2 NULL,
                        ReleaseRetryCount INT NOT NULL DEFAULT 0,
                        ReleaseErrorMessage NVARCHAR(MAX) NULL,
                        CreatedBy NVARCHAR(100) NULL,
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        UpdatedAt DATETIME2 NULL
                    )");
                logger.LogInformation("Created ScheduledOrders table in IntegrationService database");
            }

            // Users table
            var usersExists = await Dapper.SqlMapper.ExecuteScalarAsync<int>(conn, "SELECT COUNT(*) FROM sys.tables WHERE name = 'Users'");
            if (usersExists == 0)
            {
                await Dapper.SqlMapper.ExecuteAsync(conn, @"
                    CREATE TABLE Users (
                        ID INT IDENTITY(1,1) PRIMARY KEY,
                        CustomerID INT NULL,
                        Email NVARCHAR(256) NOT NULL UNIQUE,
                        EmailConfirmed BIT NOT NULL DEFAULT 0,
                        PasswordHash NVARCHAR(MAX) NULL,
                        SecurityStamp NVARCHAR(MAX) NULL,
                        PhoneNumber NVARCHAR(50) NULL,
                        PhoneConfirmed BIT NOT NULL DEFAULT 0,
                        TwoFactorEnabled BIT NOT NULL DEFAULT 0,
                        LockoutEnd DATETIMEOFFSET(7) NULL,
                        LockoutEnabled BIT NOT NULL DEFAULT 1,
                        AccessFailedCount INT NOT NULL DEFAULT 0,
                        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                        UpdatedAt DATETIME NULL,
                        LastLoginAt DATETIME NULL,
                        IsActive BIT NOT NULL DEFAULT 1
                    )");
                logger.LogInformation("Created Users table in IntegrationService database");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to initialize IntegrationService database tables");
        }
    }
}

app.Run();
