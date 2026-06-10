using System.Text.RegularExpressions;

namespace PlatformAdmin.Services;

public static class DrivePathParser
{
    private static readonly Dictionary<string, string> MajorDisplayToKey = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Trí tuệ nhân tạo"] = "ai",
        ["Mạng máy tính"] = "networking",
        ["Hệ thống thông tin DN"] = "is",
        ["An toàn không gian mạng"] = "security",
        ["Kỹ thuật lập trình"] = "programming",
        ["Công nghệ phần mềm"] = "software-engineering",
    };

    public static (string? Major, string? MajorKey, string? Subject, string? SubjectCode, string? StudentUid, string? ProjectName)
        ParseCourseProjectPath(string relativePath)
    {
        var parts = relativePath.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2 || !parts[0].Equals("CourseProjectStorage", StringComparison.OrdinalIgnoreCase))
            return (null, null, null, null, null, null);

        string? major = parts.Length > 1 ? parts[1] : null;
        string? majorKey = major != null && MajorDisplayToKey.TryGetValue(major, out var mk) ? mk : null;

        string? subject = null;
        string? subjectCode = null;
        if (parts.Length > 2)
        {
            var m = Regex.Match(parts[2], @"^(.+?)\s*\(([^)]+)\)\s*$");
            if (m.Success)
            {
                subject = m.Groups[1].Value.Trim();
                subjectCode = m.Groups[2].Value.Trim();
            }
            else
            {
                subject = parts[2];
            }
        }

        string? studentUid = null;
        string? projectName = null;

        // Check the filename (the last part of the path) first
        string lastPart = parts[^1];
        string nameWithoutExtension = Path.GetFileNameWithoutExtension(lastPart);
        
        var uidMatchInFile = Regex.Match(nameWithoutExtension, @"(?i)sv\d+");
        if (uidMatchInFile.Success)
        {
            studentUid = uidMatchInFile.Value.ToUpperInvariant();
            
            // Clean up the rest of the filename to extract the project name
            var cleaned = nameWithoutExtension.Replace(uidMatchInFile.Value, "", StringComparison.OrdinalIgnoreCase).Trim();
            cleaned = Regex.Replace(cleaned, @"^[_\-\s\(\)]+|[_\-\s\(\)]+$", ""); // Trim separators
            cleaned = Regex.Replace(cleaned, @"[_\-\s]+", " "); // Normalize spaces
            
            projectName = string.IsNullOrEmpty(cleaned) ? $"Đề tài {studentUid}" : cleaned;
        }
        else if (parts.Length > 3)
        {
            // Fallback: Check the folder name (parts[3]) if the filename doesn't contain a student ID
            var folderName = parts[3];
            var uidMatchInFolder = Regex.Match(folderName, @"(?i)sv\d+");
            if (uidMatchInFolder.Success)
            {
                studentUid = uidMatchInFolder.Value.ToUpperInvariant();
                
                var cleaned = folderName.Replace(uidMatchInFolder.Value, "", StringComparison.OrdinalIgnoreCase).Trim();
                cleaned = Regex.Replace(cleaned, @"^[_\-\s\(\)]+|[_\-\s\(\)]+$", "");
                cleaned = Regex.Replace(cleaned, @"[_\-\s]+", " ");
                
                projectName = string.IsNullOrEmpty(cleaned) ? $"Đề tài {studentUid}" : cleaned;
            }
            else
            {
                projectName = folderName;
            }
        }

        if (string.IsNullOrEmpty(studentUid))
        {
            // If no student ID is matched, generate a pseudo studentUid from the subfolder (if parts.Length > 4) or the filename
            string sourceSeed = parts.Length > 4 ? parts[3] : nameWithoutExtension;
            int hashVal = Math.Abs(sourceSeed.GetHashCode());
            studentUid = $"SV{hashVal % 10000000:D7}";

            var cleaned = nameWithoutExtension;
            cleaned = Regex.Replace(cleaned, @"^[_\-\s\(\)]+|[_\-\s\(\)]+$", "");
            cleaned = Regex.Replace(cleaned, @"[_\-\s]+", " ");
            projectName = string.IsNullOrEmpty(cleaned) ? $"Đề tài {studentUid}" : cleaned;
        }

        return (major, majorKey, subject, subjectCode, studentUid, projectName);
    }

    public static string SanitizeFolderName(string name)
    {
        foreach (var c in Path.GetInvalidFileNameChars())
            name = name.Replace(c, '_');
        return name.Trim();
    }
}
