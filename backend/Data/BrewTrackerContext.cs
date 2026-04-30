using Microsoft.EntityFrameworkCore;
using BrewTracker.Api.Models;

namespace BrewTracker.Api.Data;

public class BrewTrackerContext : DbContext
{
    public BrewTrackerContext(DbContextOptions<BrewTrackerContext> options) : base(options) { }

    public DbSet<Brew> Brews => Set<Brew>();
    public DbSet<BeanOrigin> BeanOrigins => Set<BeanOrigin>();
    public DbSet<BrewMethod> BrewMethods => Set<BrewMethod>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // BrewRatio is a computed column — tell EF not to try to insert/update it
        modelBuilder.Entity<Brew>()
            .Property(b => b.BrewRatio)
            .HasComputedColumnSql("[WaterGrams] / [CoffeeGrams]", stored: true);

        modelBuilder.Entity<Brew>()
            .HasOne(b => b.BeanOrigin)
            .WithMany(o => o.Brews)
            .HasForeignKey(b => b.BeanOriginId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Brew>()
            .HasOne(b => b.BrewMethod)
            .WithMany(m => m.Brews)
            .HasForeignKey(b => b.BrewMethodId)
            .OnDelete(DeleteBehavior.Restrict);

        // Precision for decimal columns
        modelBuilder.Entity<Brew>().Property(b => b.CoffeeGrams).HasPrecision(6, 2);
        modelBuilder.Entity<Brew>().Property(b => b.WaterGrams).HasPrecision(7, 2);
        modelBuilder.Entity<Brew>().Property(b => b.BrewRatio).HasPrecision(8, 4);
        modelBuilder.Entity<Brew>().Property(b => b.WaterTempFahrenheit).HasPrecision(5, 2);
    }
}
