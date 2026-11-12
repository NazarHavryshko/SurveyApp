# 1. Етап збірки
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Копіюємо файли проєктів для кешування restore
COPY ["MySurveyApp.Shared/MySurveyApp.Shared.csproj", "MySurveyApp.Shared/"]
COPY ["MySurveyApp.NoSqlService/MySurveyApp.NoSqlService.csproj", "MySurveyApp.NoSqlService/"]
RUN dotnet restore "MySurveyApp.NoSqlService/MySurveyApp.NoSqlService.csproj"

# Копіюємо весь вихідний код і публікуємо
COPY . .
WORKDIR "/src/MySurveyApp.NoSqlService"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# 2. Етап виконання
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MySurveyApp.NoSqlService.dll"]