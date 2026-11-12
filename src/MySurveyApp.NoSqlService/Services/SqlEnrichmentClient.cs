using System.Net.Http.Json;
using MySurveyApp.Shared.DTO;

namespace MySurveyApp.NoSqlService.Services;

public class SqlEnrichmentClient
{
    private readonly HttpClient _httpClient;

    public SqlEnrichmentClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<EnrichmentContextResponseDto?> FetchContextAsync(
        Guid? userId,
        string? anonymousToken,
        int surveyId,
        List<int> selectedOptionIds,
        CancellationToken cancellationToken = default)
    {
        var requestPayload = new EnrichmentContextRequestDto(
            userId,
            anonymousToken,
            surveyId,
            selectedOptionIds);

        var response = await _httpClient.PostAsJsonAsync(
            "/api/internal/enrichment-context",
            requestPayload,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException(
                $"SqlService повернув помилку {(int)response.StatusCode}: {errorBody}");
        }

        return await response.Content.ReadFromJsonAsync<EnrichmentContextResponseDto>(
            cancellationToken: cancellationToken);
    }

    public async Task<bool> RecordInteractionAsync(
    int surveyId,
    string userId,
    CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new
            {
                surveyId = surveyId,
                userId = userId
            };

            var response = await _httpClient.PostAsJsonAsync(
                "/api/Surveys/interact",
                payload,
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}