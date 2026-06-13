using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Linq;

namespace scratch_init_drive;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== Local Drive Folder Seeder ===");
        string targetRoot = @"C:\Users\nguye\Desktop\CourseProjectStorage_Test";
        
        try
        {
            if (Directory.Exists(targetRoot))
            {
                Directory.Delete(targetRoot, true);
            }
            Directory.CreateDirectory(targetRoot);
            Console.WriteLine($"Generating folder structure at: {targetRoot}");

            // Define subjects and majors
            var majors = new[]
            {
                new { DisplayName = "Trí tuệ nhân tạo", Key = "ai", Subjects = new[] {
                    new { Name = "Máy học", Code = "ITE1173E" },
                    new { Name = "Phát triển ứng dụng trí tuệ nhân tạo", Code = "ITE1174E" },
                    new { Name = "Đồ án chuyên ngành trí tuệ nhân tạo", Code = "ITE1491" },
                    new { Name = "Khai thác dữ liệu và ứng dụng", Code = "ITE1176E" },
                    new { Name = "Thị giác máy tính", Code = "ITE1181E" }
                }},
                new { DisplayName = "Mạng máy tính", Key = "networking", Subjects = new[] {
                    new { Name = "Mạng máy tính nâng cao", Code = "ITE1235E" },
                    new { Name = "Thiết kế mạng máy tính", Code = "ITE1267E" },
                    new { Name = "Lập trình mạng máy tính", Code = "ITE1255E" },
                    new { Name = "Quản trị mạng", Code = "ITE1241E" },
                    new { Name = "Đồ án chuyên ngành mạng máy tính", Code = "ITE1489" }
                }},
                new { DisplayName = "Hệ thống thông tin DN", Key = "is", Subjects = new[] {
                    new { Name = "Cơ sở dữ liệu nâng cao", Code = "ITE1224E" },
                    new { Name = "Hoạch định nguồn nhân lực doanh nghiệp", Code = "ITE1285E" },
                    new { Name = "Hệ thống thông tin quản lý", Code = "ITE1129E" },
                    new { Name = "Phân tích nghiệp vụ kinh doanh", Code = "ITE1284E" },
                    new { Name = "Đồ án chuyên ngành hệ thống thông tin DN", Code = "ITE1488" }
                }},
                new { DisplayName = "An toàn không gian mạng", Key = "security", Subjects = new[] {
                    new { Name = "An toàn thông tin cho ứng dụng web", Code = "ITE1268E" },
                    new { Name = "An toàn hệ thống mạng máy tính", Code = "ITE1232E" },
                    new { Name = "Phân tích và đánh giá an toàn thông tin", Code = "ITE1239E" },
                    new { Name = "Điều tra số", Code = "ITE1258E" },
                    new { Name = "Đồ án chuyên ngành an toàn không gian mạng", Code = "ITE1490" }
                }},
                new { DisplayName = "Kỹ thuật lập trình", Key = "programming", Subjects = new[] {
                    new { Name = "Lập trình Front-End", Code = "SWE1208E" },
                    new { Name = "Mạng máy tính và bảo mật thông tin", Code = "SWE1204E" },
                    new { Name = "Phân tích và thiết kế phần mềm", Code = "SWE1107E" },
                    new { Name = "Lập trình ứng dụng", Code = "SWE1205E" },
                    new { Name = "Phát triển ứng dụng Full-Stack", Code = "SWE1209E" },
                    new { Name = "Công cụ phát triển ứng dụng", Code = "SWE1210E" },
                    new { Name = "Đồ án kỹ thuật phần mềm", Code = "SWE1422" }
                }}
            };

            int uidCounter = 2024300;
            int totalFiles = 0;

            foreach (var major in majors)
            {
                foreach (var subject in major.Subjects)
                {
                    int groupsCount = 2; // Generate 2 groups per subject
                    for (int g = 1; g <= groupsCount; g++)
                    {
                        uidCounter++;
                        string studentUid = $"SV{uidCounter}";
                        string projectTitle = $"De tai {subject.Name} Nhom {g}";
                        string folderName = $"Nhom{g:D2}_DeTai_{studentUid}";
                        string safeFolderName = SanitizeFolderName(folderName);

                        string targetDir = Path.Combine(targetRoot, major.DisplayName, $"{subject.Name} ({subject.Code})", safeFolderName);
                        Directory.CreateDirectory(targetDir);

                        var cleanedMajor = RemoveDiacritics(major.DisplayName);
                        var cleanedSubject = RemoveDiacritics(subject.Name);
                        var cleanedProjectTitle = RemoveDiacritics(projectTitle);

                        // File 1: Word Document
                        string wordFileName = "Bao_cao_DoAn.docx";
                        string docxContent = $"""
                            BAO CAO DO AN MON HOC - eThesis
                            Hoc phan: {cleanedSubject} ({subject.Code})
                            MSSV: {studentUid}
                            Ten de tai: {cleanedProjectTitle}
                            Chuyen nganh: {cleanedMajor}
                            Tai lieu: {wordFileName}

                            Tom tat: Do an nghien cuu va phat trien {cleanedProjectTitle}.
                            """;
                        byte[] docxBytes = MinimalDocxBuilder.Create(docxContent);
                        File.WriteAllBytes(Path.Combine(targetDir, wordFileName), docxBytes);

                        // File 2: PDF Document
                        string pdfFileName = "Slide_ThuyetTrinh.pdf";
                        string pdfContent = $"""
                            eThesis Fallback PDF Report
                            File name: {pdfFileName}
                            Student UID: {studentUid}
                            Subject: {cleanedSubject} ({subject.Code})
                            Major: {cleanedMajor}
                            Project: {cleanedProjectTitle}

                            Tom tat: Do an nghien cuu va phat trien {cleanedProjectTitle}.
                            """;
                        byte[] pdfBytes = MinimalPdfBuilder.Create(pdfContent);
                        File.WriteAllBytes(Path.Combine(targetDir, pdfFileName), pdfBytes);

                        totalFiles += 2;
                    }
                }
            }

            Console.WriteLine($"\nSuccessfully generated {totalFiles} test files on your Desktop!");
            Console.WriteLine(@"Please upload the contents of 'CourseProjectStorage_Test' directly into your Google Drive's 'CourseProjectStorage' folder.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    static string SanitizeFolderName(string name)
    {
        foreach (var c in Path.GetInvalidFileNameChars())
            name = name.Replace(c, '_');
        return name.Trim();
    }

    public static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();
        foreach (var c in normalizedString)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                if (c == 'đ') stringBuilder.Append('d');
                else if (c == 'Đ') stringBuilder.Append('D');
                else stringBuilder.Append(c);
            }
        }
        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }
}

internal static class MinimalDocxBuilder
{
    public static byte[] Create(string plainText)
    {
        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            WriteEntry(archive, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
                </Types>
                """);

            WriteEntry(archive, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
                </Relationships>
                """);

            var escaped = System.Security.SecurityElement.Escape(plainText) ?? plainText;
            var paragraphs = escaped.Split('\n').Select(line => $"<w:p><w:r><w:t xml:space=\"preserve\">{line}</w:t></w:r></w:p>");
            var documentXml = $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:body>{string.Join("", paragraphs)}</w:body>
                </w:document>
                """;
            WriteEntry(archive, "word/document.xml", documentXml);
        }
        return ms.ToArray();
    }

    private static void WriteEntry(ZipArchive archive, string name, string content)
    {
        var entry = archive.CreateEntry(name, CompressionLevel.Fastest);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content);
    }
}

internal static class MinimalPdfBuilder
{
    public static byte[] Create(string text)
    {
        var streamContent = new StringBuilder();
        streamContent.AppendLine("BT");
        streamContent.AppendLine("/F1 12 Tf");
        streamContent.AppendLine("70 750 Td");
        streamContent.AppendLine("14 TL"); // Set leading to 14 points

        var lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
        foreach (var line in lines)
        {
            var escapedLine = line.Replace("(", "\\(").Replace(")", "\\)");
            streamContent.AppendLine($"({escapedLine}) '"); //apostrophe moves down and writes line
        }
        streamContent.AppendLine("ET");

        var streamBytes = Encoding.UTF8.GetBytes(streamContent.ToString());

        var pdf = new StringBuilder();
        pdf.AppendLine("%PDF-1.4");
        pdf.AppendLine("1 0 obj");
        pdf.AppendLine("<< /Type /Catalog /Pages 2 0 R >>");
        pdf.AppendLine("endobj");
        pdf.AppendLine("2 0 obj");
        pdf.AppendLine("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
        pdf.AppendLine("endobj");
        pdf.AppendLine("3 0 obj");
        pdf.AppendLine("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>");
        pdf.AppendLine("endobj");
        pdf.AppendLine("4 0 obj");
        pdf.AppendLine($"<< /Length {streamBytes.Length} >>");
        pdf.AppendLine("stream");

        var headerBytes = Encoding.UTF8.GetBytes(pdf.ToString());

        using var ms = new MemoryStream();
        ms.Write(headerBytes, 0, headerBytes.Length);
        ms.Write(streamBytes, 0, streamBytes.Length);

        var footer = "\r\nendstream\r\nendobj\r\nxref\r\n0 5\r\n0000000000 65535 f \r\n0000000009 00000 n \r\n0000000058 00000 n \r\n0000000115 00000 n \r\n0000000270 00000 n \r\ntrailer\r\n<< /Size 5 /Root 1 0 R >>\r\nstartxref\r\n370\r\n%%EOF\r\n";
        var footerBytes = Encoding.UTF8.GetBytes(footer);
        ms.Write(footerBytes, 0, footerBytes.Length);

        return ms.ToArray();
    }
}
