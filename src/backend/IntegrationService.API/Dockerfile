# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY IntegrationService.Core/IntegrationService.Core.csproj IntegrationService.Core/
COPY IntegrationService.Infrastructure/IntegrationService.Infrastructure.csproj IntegrationService.Infrastructure/
COPY IntegrationService.API/IntegrationService.API.csproj IntegrationService.API/

# Restore dependencies
RUN dotnet restore IntegrationService.API/IntegrationService.API.csproj

# Copy source code
COPY IntegrationService.Core/ IntegrationService.Core/
COPY IntegrationService.Infrastructure/ IntegrationService.Infrastructure/
COPY IntegrationService.API/ IntegrationService.API/

# Build
WORKDIR /src/IntegrationService.API
RUN dotnet build -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080
ENTRYPOINT ["dotnet", "IntegrationService.API.dll"]
