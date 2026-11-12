FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MySurveyApp.ApiGateway/MySurveyApp.ApiGateway.csproj", "MySurveyApp.ApiGateway/"]
RUN dotnet restore "MySurveyApp.ApiGateway/MySurveyApp.ApiGateway.csproj"
COPY . .
WORKDIR "/src/MySurveyApp.ApiGateway"
RUN dotnet build "MySurveyApp.ApiGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MySurveyApp.ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MySurveyApp.ApiGateway.dll"]