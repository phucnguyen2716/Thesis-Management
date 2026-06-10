namespace PlatformAdmin.Entities;

/// <summary>
/// Represents a file synced from Google Drive (e.g. Temporary_PDF folder).
/// Hangfire job populates this table every minute.
/// </summary>
public class DriveFileRecord
{
    public int Id { get; set; }

    /// <summary>Google Drive file ID</summary>
    public string DriveFileId { get; set; } = string.Empty;

    /// <summary>File name on Drive</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>MIME type (application/pdf, etc.)</summary>
    public string MimeType { get; set; } = string.Empty;

    /// <summary>File size in bytes</summary>
    public long? FileSize { get; set; }

    /// <summary>Google Drive web view link</summary>
    public string WebViewLink { get; set; } = string.Empty;

    /// <summary>Google Drive direct download link</summary>
    public string WebContentLink { get; set; } = string.Empty;

    /// <summary>Source folder name on Drive (e.g. "Temporary_PDF")</summary>
    public string SourceFolder { get; set; } = string.Empty;

    /// <summary>Academic category: Project, Topic, Thesis</summary>
    public string Category { get; set; } = "Project";

    /// <summary>When the file was created on Drive</summary>
    public DateTime? DriveCreatedAt { get; set; }

    /// <summary>When the file was last modified on Drive</summary>
    public DateTime? DriveModifiedAt { get; set; }

    /// <summary>When this record was first synced to our DB</summary>
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Last time this record was verified still on Drive</summary>
    public DateTime LastCheckedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Whether this file still exists on Drive</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Relative path on Drive, e.g. CourseProjectStorage/Major/Subject/file.pdf</summary>
    public string RelativePath { get; set; } = string.Empty;

    public string Major { get; set; } = string.Empty;
    public string MajorKey { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string StudentUid { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;

    /// <summary>Local path to converted PDF (temporary_pdf/uid_filename/)</summary>
    public string LocalPdfPath { get; set; } = string.Empty;
}
