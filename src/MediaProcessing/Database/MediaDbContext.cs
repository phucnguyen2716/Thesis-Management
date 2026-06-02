using Microsoft.EntityFrameworkCore;
using System;

namespace MediaProcessing.Database
{
    public class MediaDbContext : DbContext
    {
        public DbSet<MediaJobDbModel> MediaJobs { get; set; } = null!;

        public MediaDbContext(DbContextOptions<MediaDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // ARCHITECTURE GUARDRAIL: Maps under Postgres 'media' default schema context
            modelBuilder.HasDefaultSchema("media");

            modelBuilder.Entity<MediaJobDbModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ResourceName).IsRequired();
                entity.Property(e => e.JobType).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }
    }

    public class MediaJobDbModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 12);
        public string ResourceName { get; set; } = string.Empty;
        public string JobType { get; set; } = "ImageOptimization"; // ImageOptimization, ImageToVideo
        public double OriginalSizeKb { get; set; }
        public double OptimizedSizeKb { get; set; }
        public string Status { get; set; } = "Completed";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
