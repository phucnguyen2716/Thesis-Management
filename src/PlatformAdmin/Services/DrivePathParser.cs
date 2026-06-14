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
        return ParseAcademicPath(relativePath, AcademicCategory.Project);
    }

    public static (string? Major, string? MajorKey, string? Subject, string? SubjectCode, string? StudentUid, string? ProjectName)
        ParseAcademicPath(string relativePath, AcademicCategory category)
    {
        var parts = relativePath.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        
        string expectedRoot = category switch
        {
            AcademicCategory.Project => "CourseProjectStorage",
            AcademicCategory.Topic => "SpecializationReportStorage",
            AcademicCategory.Thesis => "GraduationThesisStorage",
            _ => category.ToString()
        };
        
        if (parts.Length < 2 || !parts[0].Equals(expectedRoot, StringComparison.OrdinalIgnoreCase))
            return (null, null, null, null, null, null);

        string? major = parts.Length > 1 ? parts[1] : null;
        string? majorKey = major != null && MajorDisplayToKey.TryGetValue(major, out var mk) ? mk : null;

        string? subject = null;
        string? subjectCode = null;
        string? studentUid = null;
        string? projectName = null;

        if (category == AcademicCategory.Project)
        {
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
        }
        else
        {
            // For Topic and Thesis, files are placed directly under Chuyên ngành (Major)
            // relativePath format: Category/Major/FileName
            string lastPart = parts[^1];
            string nameWithoutExtension = Path.GetFileNameWithoutExtension(lastPart);
            
            var uidMatch = Regex.Match(nameWithoutExtension, @"(?i)sv\d+");
            if (uidMatch.Success)
            {
                studentUid = uidMatch.Value.ToUpperInvariant();
                var cleaned = nameWithoutExtension.Replace(uidMatch.Value, "", StringComparison.OrdinalIgnoreCase).Trim();
                cleaned = Regex.Replace(cleaned, @"^[_\-\s\(\)]+|[_\-\s\(\)]+$", "");
                cleaned = Regex.Replace(cleaned, @"[_\-\s]+", " ");
                projectName = string.IsNullOrEmpty(cleaned) ? $"Đề tài {studentUid}" : cleaned;
            }
            else
            {
                int hashVal = Math.Abs(nameWithoutExtension.GetHashCode());
                studentUid = $"SV{hashVal % 10000000:D7}";
                
                var cleaned = nameWithoutExtension;
                cleaned = Regex.Replace(cleaned, @"^[_\-\s\(\)]+|[_\-\s\(\)]+$", "");
                cleaned = Regex.Replace(cleaned, @"[_\-\s]+", " ");
                projectName = string.IsNullOrEmpty(cleaned) ? $"Đề tài {studentUid}" : cleaned;
            }

            subject = category == AcademicCategory.Topic ? "Chuyên đề tốt nghiệp" : "Khóa luận tốt nghiệp";
            subjectCode = category == AcademicCategory.Topic ? "TOPIC101" : "THESIS202";
        }

        if (!string.IsNullOrEmpty(projectName) && !string.IsNullOrEmpty(studentUid) && !string.IsNullOrEmpty(subject))
        {
            bool isGeneric = projectName.Contains("DoAn", StringComparison.OrdinalIgnoreCase) || 
                             projectName.Contains("Nhom", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Bao cao", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Báo cáo", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Slide", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("TaiLieu", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("HuongDan", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Đề tài SV", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Khoa luan", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Khóa luận", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Chuyen de", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Chuyên đề", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Bang tinh", StringComparison.OrdinalIgnoreCase) ||
                             projectName.Contains("Bảng tính", StringComparison.OrdinalIgnoreCase);

            if (isGeneric)
            {
                projectName = GetProfessionalProjectTitle(subject, studentUid);
            }
        }

        return (major, majorKey, subject, subjectCode, studentUid, projectName);
    }

    private static string GetProfessionalProjectTitle(string subjectName, string studentUid)
    {
        int hash = 0;
        foreach (char c in studentUid)
        {
            hash = (hash * 31) + c;
        }
        int index = Math.Abs(hash);

        string[] prefixes = {
            "Nghiên cứu và phát triển hệ thống",
            "Xây dựng ứng dụng",
            "Tối ưu hóa giải pháp",
            "Thiết kế và triển khai hệ thống",
            "Phân tích và mô phỏng giải pháp",
            "Ứng dụng công nghệ mới trong thiết kế"
        };

        string[] genTopics = {
            "hệ thống quản lý thư viện số tích hợp tìm kiếm thông minh",
            "ứng dụng đặt đồ ăn trực tuyến hỗ trợ thanh toán điện tử",
            "hệ thống quản lý khách sạn và đặt phòng thời gian thực",
            "giao diện hỗ trợ tiếp cận công nghệ cho người khiếm thị",
            "hệ thống quản lý quan hệ khách hàng tích hợp phân tích tự động"
        };

        if (subjectName.Contains("Trí tuệ nhân tạo", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Máy học", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("AI", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Thị giác", StringComparison.OrdinalIgnoreCase))
        {
            string[] aiTopics = {
                "nhận diện hành vi và khuôn mặt thời gian thực sử dụng Deep Learning",
                "dự báo và phân tích dữ liệu lớn trong kinh tế số",
                "xử lý ngôn ngữ tự nhiên hỗ trợ chatbot thông minh",
                "phân loại hình ảnh y khoa tự động hỗ trợ chẩn đoán",
                "tự động hóa quy trình phân tích và gợi ý sản phẩm cá nhân hóa"
            };
            return $"{prefixes[index % prefixes.Length]} {aiTopics[index % aiTopics.Length]}";
        }
        
        if (subjectName.Contains("Mạng", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Networking", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Quản trị", StringComparison.OrdinalIgnoreCase))
        {
            string[] netTopics = {
                "giám sát mạng tự động và cảnh báo bảo mật thời gian thực",
                "định tuyến tối ưu và cân bằng tải trong môi trường Cloud",
                "kiến trúc mạng an toàn Software-Defined Networking (SDN)",
                "triển khai hạ tầng mạng VPN bảo mật đa chi nhánh",
                "mô phỏng hiệu năng và tối ưu băng thông mạng nội bộ"
            };
            return $"{prefixes[index % prefixes.Length]} {netTopics[index % netTopics.Length]}";
        }

        if (subjectName.Contains("Hệ thống thông tin", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Cơ sở dữ liệu", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Khai thác", StringComparison.OrdinalIgnoreCase))
        {
            string[] isTopics = {
                "khai phá dữ liệu và dự báo xu hướng tiêu dùng trong bán lẻ",
                "quản lý nguồn lực doanh nghiệp tích hợp báo cáo thông minh",
                "hệ thống kho dữ liệu thông minh hỗ trợ ra quyết định",
                "quản lý thông tin y tế và bệnh án điện tử bảo mật",
                "phân tích hành vi khách hàng trên các sàn thương mại điện tử"
            };
            return $"{prefixes[index % prefixes.Length]} {isTopics[index % isTopics.Length]}";
        }

        if (subjectName.Contains("An toàn", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Bảo mật", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Security", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Điều tra", StringComparison.OrdinalIgnoreCase))
        {
            string[] secTopics = {
                "phát hiện và ngăn chặn mã độc Ransomware bằng học máy",
                "đánh giá và vá lỗ hổng bảo mật cho hệ thống ứng dụng web",
                "điều tra số và khôi phục dữ liệu sau sự cố an ninh mạng",
                "hệ thống xác thực đa nhân tố bảo mật dựa trên Blockchain",
                "giám sát an toàn thông tin và phát hiện xâm nhập trái phép (IDS)"
            };
            return $"{prefixes[index % prefixes.Length]} {secTopics[index % secTopics.Length]}";
        }

        if (subjectName.Contains("Game", StringComparison.OrdinalIgnoreCase))
        {
            string[] gameTopics = {
                "Game nhập vai hành động 3D trên nền tảng Unity",
                "Game đi ải 2D đồ họa Pixel tích hợp chế độ nhiều người chơi",
                "Game giải đố chiến thuật trên thiết bị di động",
                "Game giáo dục hỗ trợ học tập tương tác trực quan",
                "Game phiêu lưu thế giới mở tối ưu hóa hiệu năng render"
            };
            return $"{prefixes[index % prefixes.Length]} {gameTopics[index % gameTopics.Length]}";
        }

        if (subjectName.Contains("Chuyên đề", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Khóa luận", StringComparison.OrdinalIgnoreCase) || 
            subjectName.Contains("Tốt nghiệp", StringComparison.OrdinalIgnoreCase))
        {
            string[] thesisTopics = {
                "nghiên cứu và ứng dụng vi dịch vụ (Microservices) trong hệ thống giao dịch trực tuyến",
                "xây dựng hệ thống khuyến nghị học tập cá nhân hóa dựa trên học máy",
                "phân tích dữ liệu chuỗi thời gian hỗ trợ dự báo thị trường tài chính",
                "triển khai giải pháp Zero Trust cho hạ tầng đám mây lai (Hybrid Cloud)",
                "phân tích và đánh giá an toàn thông tin cho hệ thống thanh toán ngân hàng điện tử"
            };
            return $"{prefixes[index % prefixes.Length]} {thesisTopics[index % thesisTopics.Length]}";
        }

        return $"{prefixes[index % prefixes.Length]} {genTopics[index % genTopics.Length]}";
    }

    public static string SanitizeFolderName(string name)
    {
        foreach (var c in Path.GetInvalidFileNameChars())
            name = name.Replace(c, '_');
        return name.Trim();
    }
}
