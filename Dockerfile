# Stage 1: Build the .NET App
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and restore dependencies
COPY eThesis.sln ./
COPY src/PlatformAdmin/PlatformAdmin.csproj src/PlatformAdmin/
COPY src/Notification/Notification.csproj src/Notification/
COPY src/SocialMedia/SocialMedia.csproj src/SocialMedia/
COPY src/MediaProcessing/MediaProcessing.csproj src/MediaProcessing/
COPY src/BuildingBlocks/SharedContracts/SharedContracts.csproj src/BuildingBlocks/SharedContracts/
COPY tests/PlatformAdmin.Tests/PlatformAdmin.Tests.csproj tests/PlatformAdmin.Tests/

RUN dotnet restore

# Copy all source code
COPY src/ src/
COPY tests/ tests/

# Build and publish PlatformAdmin
WORKDIR /src/src/PlatformAdmin
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Install LibreOffice for Word-to-PDF conversion
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice && \
    rm -rf /var/lib/apt/lists/*

# Copy build artifacts
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PlatformAdmin.dll"]
