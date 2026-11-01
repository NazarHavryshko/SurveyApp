# 1. Етап збірки проєкту (Build SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Копіюємо файли проектів для кешування відновлення пакетів
COPY MySurveyApp.SqlService/MySurveyApp.SqlService.csproj MySurveyApp.SqlService/
COPY MySurveyApp.Shared/MySurveyApp.Shared.csproj MySurveyApp.Shared/

# Відновлюємо залежності
RUN dotnet restore MySurveyApp.SqlService/MySurveyApp.SqlService.csproj

# Копіюємо всі вихідні файли обох проектів
COPY MySurveyApp.SqlService/ MySurveyApp.SqlService/
COPY MySurveyApp.Shared/ MySurveyApp.Shared/

# Публікуємо сервіс
WORKDIR /app/MySurveyApp.SqlService
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# 2. Етап запуску (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "MySurveyApp.SqlService.dll"]