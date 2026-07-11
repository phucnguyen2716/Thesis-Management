using System;
using System.Collections.Generic;

namespace PlatformAdmin.DTOs.Admin
{
    public class AdminDashboardDto
    {
        public OverviewStats Overview { get; set; } = new();
        public List<MonthlySubmissionDto> MonthlySubmissions { get; set; } = new();
        public List<YearlyUploadDto> YearlyUploads { get; set; } = new();
        public DocumentStats Documents { get; set; } = new();
        public List<DepartmentStatDto> DepartmentStats { get; set; } = new();
        public PlagiarismStats Plagiarism { get; set; } = new();
        public SearchStats Search { get; set; } = new();
        public SystemStatusDto SystemStatus { get; set; } = new();
    }

    public class OverviewStats
    {
        public int TotalTheses { get; set; }
        public int TotalProjects { get; set; }
        public int TotalStudents { get; set; }
        public int TotalAdvisors { get; set; }
        public int TotalDepartments { get; set; }
        public int TotalMajors { get; set; }
    }

    public class MonthlySubmissionDto
    {
        public string Month { get; set; } = string.Empty; // e.g., "01/2026"
        public int Count { get; set; }
    }

    public class YearlyUploadDto
    {
        public string SchoolYear { get; set; } = string.Empty; // e.g., "2023-2024"
        public int Count { get; set; }
    }

    public class DocumentStats
    {
        public int PdfCount { get; set; }
        public int DocxCount { get; set; }
        public int ApprovedCount { get; set; }
        public int PendingCount { get; set; }
        public int RejectedCount { get; set; }
    }

    public class DepartmentStatDto
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class PlagiarismStats
    {
        public List<RecentPlagiarismCheckDto> RecentChecks { get; set; } = new();
        public SimilarityDistribution Distribution { get; set; } = new();
        public List<TopPlagiarismDocumentDto> TopSimilarDocuments { get; set; } = new();
    }

    public class RecentPlagiarismCheckDto
    {
        public int ThesisId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public double SimilarityPercentage { get; set; }
        public DateTime CheckedAt { get; set; }
    }

    public class SimilarityDistribution
    {
        public int Range0To20 { get; set; }
        public int Range21To40 { get; set; }
        public int Range41To60 { get; set; }
        public int RangeAbove60 { get; set; }
    }

    public class TopPlagiarismDocumentDto
    {
        public int ThesisId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public double SimilarityPercentage { get; set; }
    }

    public class SearchStats
    {
        public List<TopKeywordDto> TopKeywords { get; set; } = new();
        public SearchCountDto SearchCounts { get; set; } = new();
    }

    public class TopKeywordDto
    {
        public string Keyword { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class SearchCountDto
    {
        public int Today { get; set; }
        public int ThisWeek { get; set; }
        public int ThisMonth { get; set; }
    }

    public class SystemStatusDto
    {
        public string Postgres { get; set; } = "Online";
        public string Elasticsearch { get; set; } = "Online";
        public string RabbitMQ { get; set; } = "Online";
        public QueueStats ProcessingQueue { get; set; } = new();
    }

    public class QueueStats
    {
        public int Analyzing { get; set; }
        public int Indexing { get; set; }
        public int PlagiarismChecking { get; set; }
    }
}
