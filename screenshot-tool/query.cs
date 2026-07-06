using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;

namespace ScreenshotTool
{
    class Program
    {
        static void Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=eThesisProjectDb_dev;Username=postgres;Password=1");

            using (var context = new AppDbContext(optionsBuilder.Options))
            {
                // 1. Tìm đề tài có chứa file hoặc thuộc về student SV0971090
                var theses = context.Theses
                    .Include(t => t.Student)
                    .Where(t => t.FilePath.Contains("GROUPCHATGPT") || t.Student.StudentId == "SV0971090")
                    .ToList();

                if (theses.Any())
                {
                    Console.WriteLine("FOUND_THESES:");
                    foreach (var t in theses)
                    {
                        Console.WriteLine($"ID: {t.Id} | Title: {t.Title} | FilePath: {t.FilePath} | Student: {t.Student?.FullName} ({t.Student?.StudentId})");
                    }
                }
                else
                {
                    Console.WriteLine("No thesis found for SV0971090 in database.");
                    // In ra một vài đề tài để tham khảo
                    var someTheses = context.Theses.Take(5).ToList();
                    Console.WriteLine("SAMPLE_THESES:");
                    foreach (var t in someTheses)
                    {
                        Console.WriteLine($"ID: {t.Id} | Title: {t.Title} | FilePath: {t.FilePath}");
                    }
                }
            }
        }
    }
}
