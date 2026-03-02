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
            policy.WithOrigins("http://localhost:3000")
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

// Repository Registrations
builder.Services.AddScoped<IPosRepository, PosRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IIdempotencyRepository, IdempotencyRepository>();
builder.Services.AddScoped<IOrderNumberRepository, OrderNumberRepository>();

// Service Registrations
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<IOrderProcessingService, OrderProcessingService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IUpsellService, UpsellService>();
builder.Services.AddScoped<BirthdayRewardService>();
builder.Services.AddHostedService<BirthdayRewardBackgroundService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<INotificationService, MockNotificationService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowWebApp");
app.UseHttpsRedirection();
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

app.Run();
