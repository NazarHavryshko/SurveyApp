using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySurveyApp.SqlService.Data;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DictionariesController : ControllerBase
{
    private readonly SurveyDbContext _context;

    public DictionariesController(SurveyDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Отримати список усіх регіонів України
    /// </summary>
    [HttpGet("regions")]
    [ProducesResponseType(typeof(List<Region>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRegions()
    {
        var regions = await _context.Regions
            .AsNoTracking()
            .OrderBy(r => r.RegionName)
            .ToListAsync();
        return Ok(regions);
    }

    /// <summary>
    /// Отримати список усіх хобі
    /// </summary>
    [HttpGet("hobbies")]
    [ProducesResponseType(typeof(List<Hobby>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHobbies()
    {
        var hobbies = await _context.Hobbies
            .AsNoTracking()
            .OrderBy(h => h.HobbyName)
            .ToListAsync();
        return Ok(hobbies);
    }

    /// <summary>
    /// Отримати перелік усіх галузей опитувань
    /// </summary>
    [HttpGet("survey-domains")]
    [ProducesResponseType(typeof(List<SurveyDomain>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSurveyDomains()
    {
        var domains = await _context.SurveyDomains
            .AsNoTracking()
            .OrderBy(d => d.DomainId)
            .ToListAsync();

        return Ok(domains);
    }

    /// <summary>
    /// Отримати теми опитувань для конкретної галузі за її ID
    /// </summary>
    [HttpGet("survey-domains/{domainId:int}/topics")]
    [ProducesResponseType(typeof(List<SurveyTopic>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopicsByDomain(int domainId)
    {
        var topics = await _context.SurveyTopics
            .AsNoTracking()
            .Where(t => t.DomainId == domainId)
            .OrderBy(t => t.TopicName)
            .ToListAsync();

        return Ok(topics);
    }

    /// <summary>
    /// Отримати перелік усіх галузей професій
    /// </summary>
    [HttpGet("occupation-domains")]
    [ProducesResponseType(typeof(List<OccupationDomain>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOccupationDomains()
    {
        var domains = await _context.OccupationDomains
            .AsNoTracking()
            .OrderBy(od => od.DomainName)
            .ToListAsync();

        return Ok(domains);
    }

    /// <summary>
    /// Отримати професії/спеціальності для конкретної галузі за її ID
    /// </summary>
    [HttpGet("occupation-domains/{domainId:int}/occupations")]
    [ProducesResponseType(typeof(List<Occupation>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOccupationsByDomain(int domainId)
    {
        var occupations = await _context.Occupations
            .AsNoTracking()
            .Where(o => o.OccupationId == domainId)
            .OrderBy(o => o.OccupationName)
            .ToListAsync();

        return Ok(occupations);
    }
}