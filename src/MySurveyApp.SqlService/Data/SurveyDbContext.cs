using Microsoft.EntityFrameworkCore;
using MySurveyApp.SqlService.Models;

namespace MySurveyApp.SqlService.Data;

public class SurveyDbContext : DbContext
{
    public SurveyDbContext(DbContextOptions<SurveyDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyOption> SurveyOptions => Set<SurveyOption>();
    public DbSet<SurveyInteraction> SurveyInteractions => Set<SurveyInteraction>();
    public DbSet<Region> Regions => Set<Region>();
    public DbSet<Hobby> Hobbies => Set<Hobby>();
    public DbSet<Occupation> Occupations => Set<Occupation>();
    public DbSet<OccupationDomain> OccupationDomains => Set<OccupationDomain>();
    public DbSet<SurveyTopic> SurveyTopics => Set<SurveyTopic>();
    public DbSet<SurveyDomain> SurveyDomains => Set<SurveyDomain>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        base.ConfigureConventions(configurationBuilder);
        // Зберігаємо всі enum у вигляді тексту (VARCHAR), а не цифр
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Обмеження значень статі (Ч, Ж або NULL)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_users_gender",
                "gender IN ('Ч', 'Ж') OR gender IS NULL"
            ));

            entity.Property(u => u.AnswersCount).HasDefaultValue(0);
            entity.Property(u => u.AvailableQuestionTokens).HasDefaultValue(0);
        });

        // За замовчуванням поточний час у UTC для створення опитування
        modelBuilder.Entity<Survey>(entity =>
        {
            entity.Property(s => s.CreatedAt).HasDefaultValueSql("NOW()");
        });

        // Зв'язок мікро-тем із макро-категоріями
        modelBuilder.Entity<SurveyTopic>(entity =>
        {
            entity.HasIndex(t => t.DomainId).HasDatabaseName("idx_survey_topic_domain_id");
        });

        // Зв'язок конкретної посади зі сферою діяльності
        modelBuilder.Entity<Occupation>(entity =>
        {
            entity.HasIndex(o => o.DomainId).HasDatabaseName("idx_occupation_occ_domain_id");
        });

        // Швидке завантаження варіантів відповідей для картки опитування
        modelBuilder.Entity<SurveyOption>(entity =>
        {
            entity.HasIndex(o => o.SurveyId).HasDatabaseName("idx_survey_option_survey_id");
        });

        // Індекси для таблиці survey
        modelBuilder.Entity<Survey>(entity =>
        {
            // Прискорення вибірки та фільтрації за регіональним таргетингом
            entity.HasIndex(s => s.RegionTargetId).HasDatabaseName("idx_survey_region_target_id");

            // Вибірка всіх опитувань конкретного автора
            entity.HasIndex(s => s.AuthorId).HasDatabaseName("idx_survey_author_id");

            // Частковий індекс (Partial Index) для Shuffle Bag
            // Застосовується тільки для записів з статусом 'Active'
            entity.HasIndex(s => new { s.SurveyId, s.RegionTargetId })
                  .HasDatabaseName("idx_survey_active_feed")
                  .HasFilter("status = 'Active'");
        });


        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SurveyDbContext).Assembly);
    }
}