using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Linq;
using System.Collections.Generic;

namespace scratch_init_drive;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== Local Drive Folder Seeder ===");
        string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
        string projectRoot = Path.Combine(desktopPath, "CourseProjectStorage_Test");
        string topicRoot = Path.Combine(desktopPath, "SpecializationReportStorage_Test");
        string thesisRoot = Path.Combine(desktopPath, "GraduationThesisStorage_Test");
        
        try
        {
            // Clean up old folders
            if (Directory.Exists(projectRoot)) Directory.Delete(projectRoot, true);
            if (Directory.Exists(topicRoot)) Directory.Delete(topicRoot, true);
            if (Directory.Exists(thesisRoot)) Directory.Delete(thesisRoot, true);

            Directory.CreateDirectory(projectRoot);
            Directory.CreateDirectory(topicRoot);
            Directory.CreateDirectory(thesisRoot);

            Console.WriteLine($"Generating Course Projects at: {projectRoot}");
            Console.WriteLine($"Generating Specialization Reports at: {topicRoot}");
            Console.WriteLine($"Generating Graduation Theses at: {thesisRoot}");

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
                }},
                new { DisplayName = "Công nghệ phần mềm", Key = "software-engineering", Subjects = Array.Empty<dynamic>() }
            };

            int projectUidCounter = 2024300;
            int topicUidCounter = 2026300;
            int thesisUidCounter = 2026400;
            int totalFiles = 0;

            // 1. Seed CourseProjectStorage_Test
            foreach (var major in majors)
            {
                foreach (var subject in major.Subjects)
                {
                    int groupsCount = 2; // Generate 2 groups per subject
                    for (int g = 1; g <= groupsCount; g++)
                    {
                        projectUidCounter++;
                        string studentUid = $"SV{projectUidCounter}";
                        string projectTitle = $"De tai {subject.Name} Nhom {g}";
                        string folderName = $"Nhom{g:D2}_DeTai_{studentUid}";
                        string safeFolderName = SanitizeFolderName(folderName);

                        string targetDir = Path.Combine(projectRoot, major.DisplayName, $"{subject.Name} ({subject.Code})", safeFolderName);
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

                        // File 2: PDF Document (4 pages)
                        string pdfFileName = "Slide_ThuyetTrinh.pdf";
                        byte[] pdfBytes = BuildSamplePdf(major.DisplayName, subject.Name, subject.Code, studentUid, projectTitle, pdfFileName);
                        File.WriteAllBytes(Path.Combine(targetDir, pdfFileName), pdfBytes);

                        // File 3: Spreadsheet
                        string xlsxFileName = "Bang_tinh_Chi_phi.xlsx";
                        string xlsxContent = $"eThesis - Bang tinh cho do an {projectTitle} (MSSV: {studentUid}) - Mon hoc {subject.Name} ({subject.Code})";
                        byte[] xlsxBytes = MinimalXlsxBuilder.Create("BangTinh", RemoveDiacritics(xlsxContent));
                        File.WriteAllBytes(Path.Combine(targetDir, xlsxFileName), xlsxBytes);

                        totalFiles += 3;
                    }
                }
            }

            var topicTitles = new Dictionary<string, string[]>
            {
                ["ai"] = new[] {
                    "Nghiên cứu ứng dụng Học sâu trong nhận diện khuôn mặt",
                    "Xây dựng chatbot hỗ trợ tuyển sinh tự động bằng NLP",
                    "Phân tích dữ liệu y tế bằng mô hình học máy",
                    "Phân loại hành vi người dùng bằng thuật toán học máy",
                    "Phát hiện gian lận thẻ tín dụng sử dụng thuật toán Random Forest",
                    "Nhận dạng chữ viết tay tiếng Việt bằng mạng LSTM",
                    "Phân khúc khách hàng mục tiêu bằng phương pháp phân cụm",
                    "Xây dựng hệ thống gợi ý sản phẩm cho trang thương mại điện tử",
                    "Phân tích cảm xúc bình luận khách hàng bằng Naive Bayes",
                    "Nhận dạng biển số xe tự động từ luồng video camera giám sát"
                },
                ["networking"] = new[] {
                    "Nghiên cứu triển khai hệ thống mạng Software-Defined Networking (SDN)",
                    "Thiết lập hệ thống giám sát mạng Prometheus và Grafana",
                    "Mô phỏng mạng 5G và phân tích hiệu năng QoS",
                    "Xây dựng hệ thống cân bằng tải cho máy chủ dịch vụ Web",
                    "Triển khai giải pháp mạng riêng ảo VPN bảo mật cho doanh nghiệp",
                    "Cấu hình định tuyến động OSPF và BGP cho mạng diện rộng",
                    "Giám sát lưu lượng mạng bằng công cụ Wireshark và ntopng",
                    "Thiết kế hạ tầng mạng không dây mật độ cao cho trường đại học",
                    "Nghiên cứu công nghệ mạng IPv6 và lập kế hoạch chuyển đổi",
                    "Phân tích và tối ưu hóa băng thông mạng WAN doanh nghiệp"
                },
                ["is"] = new[] {
                    "Nghiên cứu giải pháp ERP trong quản lý doanh nghiệp vừa và nhỏ",
                    "Phân tích quy trình kinh doanh bằng mô hình BPMN",
                    "Xây dựng hệ thống quản lý kho thông minh",
                    "Phân tích và thiết kế hệ thống thông tin quản lý nhân sự",
                    "Giải pháp Business Intelligence (BI) cho báo cáo doanh thu",
                    "Xây dựng hệ thống quản lý quan hệ khách hàng CRM",
                    "Thiết kế kho dữ liệu Data Warehouse phục vụ phân tích kinh doanh",
                    "Nghiên cứu ứng dụng Blockchain trong quản lý chuỗi cung ứng",
                    "Xây dựng hệ thống quản lý tài liệu và quy trình nội bộ",
                    "Phát triển cổng thông tin dịch vụ hành chính công trực tuyến"
                },
                ["security"] = new[] {
                    "Đánh giá an toàn thông tin ứng dụng web bằng OWASP Top 10",
                    "Phân tích mã độc ransomware bằng kỹ thuật điều tra số",
                    "Nghiên cứu mô phỏng giải pháp Zero Trust Network Access (ZTNA)",
                    "Triển khai hệ thống tường lửa thế hệ mới Next-Generation Firewall",
                    "Phòng chống tấn công từ chối dịch vụ DDoS trên Web Server",
                    "Đánh giá lỗ hổng bảo mật hạ tầng mạng bằng Nessus",
                    "Xây dựng hệ thống quản lý định danh và truy cập IAM",
                    "Phân tích và phát hiện tấn công Phishing qua Email",
                    "Thiết lập hệ thống giám sát an ninh mạng với ELK Stack",
                    "Nghiên cứu và triển khai chuẩn bảo mật dữ liệu PCI DSS"
                },
                ["programming"] = new[] {
                    "Nghiên cứu phát triển ứng dụng Web Front-end với ReactJS",
                    "Thiết kế kiến trúc ứng dụng Web API với Clean Architecture",
                    "Xây dựng ứng dụng di động đa nền tảng Flutter",
                    "Tối ưu hóa hiệu năng render ứng dụng web với VueJS",
                    "Xây dựng ứng dụng đặt lịch hẹn trực tuyến bằng NestJS",
                    "Lập trình ứng dụng chia sẻ vị trí thời gian thực bằng WebSockets",
                    "Phát triển trang web thương mại điện tử với Next.js và TailwindCSS",
                    "Xây dựng API Gateway và quản lý phân quyền trong Microservices",
                    "Phát triển ứng dụng di động Android native bằng Kotlin",
                    "Xây dựng hệ thống quản lý học tập trực tuyến LMS với C#"
                },
                ["software-engineering"] = new[] {
                    "Nghiên cứu kiến trúc Microservices và ứng dụng thực tế",
                    "Đánh giá và tối ưu hiệu năng ứng dụng web bằng Lighthouse",
                    "Xây dựng quy trình CI/CD tự động hóa kiểm thử phần mềm",
                    "Phân tích thiết kế hệ thống quản lý học tập trực tuyến LMS",
                    "Nghiên cứu giải pháp thiết kế Design System cho dự án web lớn",
                    "Ứng dụng quy trình Scrum trong phát triển phần mềm Agile",
                    "Xây dựng công cụ phân tích tĩnh mã nguồn kiểm tra chuẩn coding",
                    "Nghiên cứu giải pháp bảo mật API Gateway cho Microservices",
                    "Phát triển ứng dụng di động đa nền tảng sử dụng React Native",
                    "Tối ưu hóa cơ sở dữ liệu quy mô lớn cho ứng dụng thương mại điện tử"
                }
            };

            var thesisTitles = new Dictionary<string, string[]>
            {
                ["ai"] = new[] {
                    "Khóa luận tốt nghiệp chuyên sâu về Trí tuệ nhân tạo",
                    "Phát triển hệ thống lái xe tự hành dựa trên thị giác máy tính",
                    "Tối ưu hóa thuật toán đề xuất sản phẩm thời gian thực",
                    "Ứng dụng Generative AI trong việc tự động hóa tạo nội dung",
                    "Phân tích hình ảnh y tế phát hiện khối u phổi bằng Deep Learning",
                    "Dự báo lưu lượng giao thông đô thị bằng Graph Neural Networks",
                    "Hệ thống dịch thuật hai chiều Việt - Anh sử dụng Seq2Seq",
                    "Nhận dạng giọng nói tiếng Việt và chuyển đổi thành văn bản",
                    "Phát hiện gian lận tài chính quy mô lớn bằng học máy tăng cường",
                    "Tối ưu hóa lập lịch sản xuất tự động sử dụng thuật toán di truyền"
                },
                ["networking"] = new[] {
                    "Khóa luận tốt nghiệp chuyên sâu về Mạng máy tính",
                    "Xây dựng hạ tầng mạng ảo hóa SDN cho trung tâm dữ liệu",
                    "Giải pháp truyền dữ liệu an toàn đa kênh trong mạng di động",
                    "Nghiên cứu giải pháp SD-WAN tối ưu hóa kết nối đa chi nhánh",
                    "Thiết kế và triển khai hạ tầng mạng Hybrid Cloud bảo mật cao",
                    "Phân tích và tối ưu hóa định tuyến định hướng chất lượng dịch vụ QoS",
                    "Ứng dụng Network Functions Virtualization (NFV) trong biên mạng",
                    "Xây dựng hệ thống mạng cảm biến không dây IoT giám sát nông nghiệp",
                    "Nghiên cứu và mô phỏng giao thức định tuyến trong mạng VANET",
                    "Tối ưu hóa hiệu năng CDN tự phát triển cho luồng video trực tuyến"
                },
                ["is"] = new[] {
                    "Khóa luận tốt nghiệp chuyên sâu về Hệ thống thông tin DN",
                    "Triển khai giải pháp SAP ERP cho chuỗi cung ứng sản xuất",
                    "Xây dựng kho dữ liệu và công cụ Business Intelligence (BI) báo cáo",
                    "Nghiên cứu thiết kế kiến trúc Enterprise Architecture cho ngân hàng",
                    "Ứng dụng Big Data phân tích hành vi mua sắm trực tuyến",
                    "Xây dựng hệ thống đề xuất tài chính thông minh dựa trên lịch sử tín dụng",
                    "Phát triển hệ thống quản lý chuỗi cung ứng thông minh SCM",
                    "Số hóa quy trình nghiệp vụ hành chính doanh nghiệp bằng BPMS",
                    "Thiết kế giải pháp Master Data Management (MDM) cho tập đoàn",
                    "Xây dựng hệ thống chấm điểm tín dụng tự động cho tổ chức tài chính"
                },
                ["security"] = new[] {
                    "Khóa luận tốt nghiệp chuyên sâu về An toàn không gian mạng",
                    "Xây dựng hệ thống phát hiện xâm nhập IDS/IPS sử dụng học máy",
                    "Tối ưu hệ thống bảo mật SIEM và giám sát an ninh SOC",
                    "Thiết lập hệ thống bẫy mã độc Honeypot phân tích hành vi tin tặc",
                    "Giải pháp bảo vệ dữ liệu đám mây đa nền tảng Cloud Security",
                    "Nghiên cứu và xây dựng quy trình DevSecOps cho sản phẩm phần mềm",
                    "Ứng dụng mật mã học nâng cao trong bảo vệ giao dịch blockchain",
                    "Đánh giá lỗ hổng bảo mật hệ thống SCADA trong công nghiệp",
                    "Điều tra số và khôi phục dữ liệu sau sự cố tấn công mạng",
                    "Xây dựng kiến trúc bảo mật lớp ứng dụng chống tấn công nâng cao"
                },
                ["programming"] = new[] {
                    "Khóa luận tốt nghiệp chuyên sâu về Kỹ thuật lập trình",
                    "Xây dựng nền tảng E-commerce quy mô lớn với Microservices",
                    "Tối ưu hóa hiệu năng render ứng dụng web đa luồng WebAssembly",
                    "Thiết kế và xây dựng công cụ phát triển phần mềm tự động CI/CD",
                    "Phát triển ứng dụng Web Real-time cộng tác đa người dùng bằng WebRTC",
                    "Nghiên cứu và triển khai cơ chế đồng bộ dữ liệu Offline-First",
                    "Xây dựng hệ thống IoT Hub quản lý thiết bị thông minh quy mô lớn",
                    "Tối ưu hóa truy vấn cơ sở dữ liệu phi quan hệ cho ứng dụng mạng xã hội",
                    "Thiết kế framework phát triển ứng dụng di động tùy biến cao",
                    "Xây dựng hệ thống quản lý và xử lý hàng đợi tin nhắn chịu tải cao"
                },
                ["software-engineering"] = new[] {
                    "Khóa luận tốt nghiệp chuyên sâu về Công nghệ phần mềm",
                    "Nghiên cứu triển khai quy trình DevSecOps cho doanh nghiệp",
                    "Xây dựng hệ thống quản lý chất lượng phần mềm tự động hóa",
                    "Thiết kế kiến trúc hệ thống lưu trữ phân tán chịu lỗi cao",
                    "Phát triển giải pháp Single Sign-On bảo mật đa nền tảng",
                    "Tối ưu hóa trải nghiệm người dùng UX/UI bằng phương pháp A/B testing",
                    "Phát triển ứng dụng Web Real-time chịu tải cao sử dụng Node.js",
                    "Nghiên cứu ứng dụng Kubernetes quản lý container trong doanh nghiệp",
                    "Xây dựng hệ thống giám sát hiệu năng phần mềm APM thời gian thực",
                    "Tối ưu hóa và tái cấu trúc mã nguồn hệ thống ERP di sản"
                }
            };

            // 2. Seed Topic_Test (Chuyên đề) - placed directly under Major folder
            int majorIdx = -1;
            foreach (var major in majors)
            {
                majorIdx++;
                var titles = topicTitles[major.Key];
                string targetDir = Path.Combine(topicRoot, major.DisplayName);
                Directory.CreateDirectory(targetDir);

                for (int k = 1; k <= 10; k++)
                {
                    string studentUid = $"SV{2026300 + majorIdx * 10 + k}";
                    string title = titles[k - 1];

                    // File 1: Word Document
                    string wordFileName = $"{studentUid}_Bao_cao_Chuyen_de.docx";
                    string docxContent = $"""
                        BAO CAO CHUYEN DE TOT NGHIEP - eThesis
                        MSSV: {studentUid}
                        Ten de tai: {RemoveDiacritics(title)}
                        Chuyen nganh: {RemoveDiacritics(major.DisplayName)}
                        Tai lieu: {wordFileName}

                        Tom tat: Chuyen de nghien cuu va phat trien ung dung {RemoveDiacritics(title)}.
                        """;
                    byte[] docxBytes = MinimalDocxBuilder.Create(docxContent);
                    File.WriteAllBytes(Path.Combine(targetDir, wordFileName), docxBytes);

                    // File 2: PDF Document (4 pages)
                    string pdfFileName = $"{studentUid}_Slide_ThuyetTrinh.pdf";
                    byte[] pdfBytes = BuildSamplePdf(major.DisplayName, "Chuyên đề tốt nghiệp", "TOPIC101", studentUid, title, pdfFileName);
                    File.WriteAllBytes(Path.Combine(targetDir, pdfFileName), pdfBytes);

                    // File 3: README Document
                    string readmeFileName = $"{studentUid}_README.docx";
                    string readmeContent = $"""
                        THONG TIN TAI LIEU THAM KHAO (README) - UEF eThesis
                        =================================================
                        Ma so sinh vien: {studentUid}
                        Ten de tai: {RemoveDiacritics(title)}
                        Chuyen nganh: {RemoveDiacritics(major.DisplayName)}
                        Phan loai: Chuyen de tot nghiep
                        
                        1. GIOI THIEU DE TAI
                           Tai lieu nay thuoc he thong thu vien so khoa luan va chuyen de tot nghiep.
                           De tai tap trung nghien cuu ve: {RemoveDiacritics(title)}.
                        
                        2. NOI DUNG NGHIEU CUU
                           - Tim hieu ly thuyet lien quan va cac nghien cuu truoc day.
                           - Nghien cuu giai phap ung dung thuc tien.
                           - Nhan xet, danh gia ket qua va dinh huong phat trien.
                        
                        3. HUONG DAN SU DUNG & THAM KHAO
                           - Day la tai lieu luu tru de doc va tham khao hoc thuat.
                           - Nghiem cam sao chep duoi moi hinh thuc khi chua duoc su dong y cua tac gia va nha truong.
                        """;
                    byte[] readmeBytes = MinimalDocxBuilder.Create(readmeContent);
                    File.WriteAllBytes(Path.Combine(targetDir, readmeFileName), readmeBytes);

                    totalFiles += 3;
                }
            }

            // 3. Seed Thesis_Test (Khóa luận) - placed directly under Major folder
            majorIdx = -1;
            foreach (var major in majors)
            {
                majorIdx++;
                var titles = thesisTitles[major.Key];
                string targetDir = Path.Combine(thesisRoot, major.DisplayName);
                Directory.CreateDirectory(targetDir);

                for (int k = 1; k <= 10; k++)
                {
                    string studentUid = $"SV{2026400 + majorIdx * 10 + k}";
                    string title = titles[k - 1];

                    // File 1: Word Document
                    string wordFileName = $"{studentUid}_Khoa_luan_Tot_nghiep.docx";
                    string docxContent = $"""
                        KHOA LUAN TOT NGHIEP - eThesis
                        MSSV: {studentUid}
                        Ten de tai: {RemoveDiacritics(title)}
                        Chuyen nganh: {RemoveDiacritics(major.DisplayName)}
                        Tai lieu: {wordFileName}

                        Tom tat: Khoa luan tot nghiep nghien cuu va phat trien ung dung {RemoveDiacritics(title)}.
                        """;
                    byte[] docxBytes = MinimalDocxBuilder.Create(docxContent);
                    File.WriteAllBytes(Path.Combine(targetDir, wordFileName), docxBytes);

                    // File 2: PDF Document (4 pages)
                    string pdfFileName = $"{studentUid}_Slide_ThuyetTrinh.pdf";
                    byte[] pdfBytes = BuildSamplePdf(major.DisplayName, "Khóa luận tốt nghiệp", "THESIS202", studentUid, title, pdfFileName);
                    File.WriteAllBytes(Path.Combine(targetDir, pdfFileName), pdfBytes);

                    // File 3: README Document
                    string readmeFileName = $"{studentUid}_README.docx";
                    string readmeContent = $"""
                        THONG TIN TAI LIEU THAM KHAO (README) - UEF eThesis
                        =================================================
                        Ma so sinh vien: {studentUid}
                        Ten de tai: {RemoveDiacritics(title)}
                        Chuyen nganh: {RemoveDiacritics(major.DisplayName)}
                        Phan loai: Khoa luan tot nghiep
                        
                        1. GIOI THIEU DE TAI
                           Tai lieu nay thuoc he thong thu vien so khoa luan va chuyen de tot nghiep.
                           De tai tap trung nghien cuu ve: {RemoveDiacritics(title)}.
                        
                        2. NOI DUNG NGHIEU CUU
                           - Tim hieu ly thuyet lien quan va cac nghien cuu truoc day.
                           - Nghien cuu giai phap ung dung thuc tien.
                           - Nhan xet, danh gia ket qua va dinh huong phat trien.
                        
                        3. HUONG DAN SU DUNG & THAM KHAO
                           - Day la tai lieu luu tru de doc va tham khao hoc thuat.
                           - Nghiem cam sao chep duoi moi hinh thuc khi chua duoc su dong y cua tac gia va nha truong.
                        """;
                    byte[] readmeBytes = MinimalDocxBuilder.Create(readmeContent);
                    File.WriteAllBytes(Path.Combine(targetDir, readmeFileName), readmeBytes);

                    totalFiles += 3;
                }
            }


            Console.WriteLine($"\nSuccessfully generated {totalFiles} test files on your Desktop!");
            Console.WriteLine(@"Directories created:");
            Console.WriteLine($" - {projectRoot} -> Upload to 'CourseProjectStorage' on Google Drive");
            Console.WriteLine($" - {topicRoot} -> Upload to 'SpecializationReportStorage' on Google Drive");
            Console.WriteLine($" - {thesisRoot} -> Upload to 'GraduationThesisStorage' on Google Drive");
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

    public static byte[] BuildSamplePdf(string major, string subject, string code, string uid, string project, string fileName)
    {
        var cleanedMajor = RemoveDiacritics(major);
        var cleanedSubject = RemoveDiacritics(subject);
        var cleanedProject = RemoveDiacritics(project);
        var cleanedFileName = RemoveDiacritics(fileName);

        var page1 = $"""
            eThesis Fallback PDF Report - Page 1 (Cover Page)
            ------------------------------------------------
            File name: {cleanedFileName}
            Student UID: {uid}
            Subject: {cleanedSubject} ({code})
            Major: {cleanedMajor}
            Project: {cleanedProject}

            Tom tat: Do an nghien cuu va phat trien ung dung {cleanedProject}.
            """;

        var page2 = $"""
            eThesis Fallback PDF Report - Page 2 (Literature Review)
            ------------------------------------------------
            Research Topic: {cleanedProject}
            Student: {uid}
            
            1. Introduction
            This research addresses key challenges in {cleanedMajor}. 
            We investigate various methodologies and state-of-the-art architectures.
            
            2. Related Work
            Prior studies in {cleanedSubject} have proposed several frameworks.
            However, limitations in performance and security remain to be solved.
            """;

        var page3 = $"""
            eThesis Fallback PDF Report - Page 3 (Methodology & Conclusion)
            ------------------------------------------------
            Research Topic: {cleanedProject}
            Student: {uid}

            3. Proposed Methodology
            We design an integrated microservices system using secure cloud technologies.
            The experimental results demonstrate a significant improvement in efficiency.

            4. Conclusion
            This graduation thesis / report successfully achieves its primary objectives.
            Future work will focus on integrating advanced machine learning techniques.
            """;

        var page4 = $"""
            eThesis Fallback PDF Report - Page 4 (Evaluation & References)
            ------------------------------------------------
            Research Topic: {cleanedProject}
            Student: {uid}

            5. Evaluation Results
            The proposed system was evaluated against baseline configurations.
            We observed a 15% reduction in request latency and 99.9% uptime.

            6. References
            [1] Author A, "Advanced Systems in {cleanedMajor}", Journal of eThesis, 2025.
            [2] Author B, "Research and Applications in {cleanedSubject}", UEF Press, 2026.
            """;

        var body = $"{page1}\n---\n{page2}\n---\n{page3}\n---\n{page4}";
        return MinimalPdfBuilder.Create(body);
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
        var pageDelimiters = new[] { "\n---\n", "\r\n---\r\n" };
        var pagesText = text.Split(pageDelimiters, StringSplitOptions.RemoveEmptyEntries)
                            .Select(p => p.Trim())
                            .ToList();

        if (pagesText.Count == 0)
        {
            pagesText.Add("eThesis Empty Document");
        }

        var streams = new List<byte[]>();
        foreach (var pageText in pagesText)
        {
            var streamContent = new StringBuilder();
            streamContent.AppendLine("BT");
            streamContent.AppendLine("/F1 12 Tf");
            streamContent.AppendLine("70 750 Td");
            streamContent.AppendLine("14 TL");

            var lines = pageText.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
            foreach (var line in lines)
            {
                var escapedLine = line.Replace("(", "\\(").Replace(")", "\\)");
                streamContent.AppendLine($"({escapedLine}) '");
            }
            streamContent.AppendLine("ET");
            streams.Add(Encoding.UTF8.GetBytes(streamContent.ToString()));
        }

        using var ms = new MemoryStream();
        using (var writer = new StreamWriter(ms, new UTF8Encoding(false)))
        {
            writer.Write("%PDF-1.4\r\n");

            // 1 0 obj: Catalog
            writer.Write("1 0 obj\r\n<< /Type /Catalog /Pages 2 0 R >>\r\nendobj\r\n");

            // 2 0 obj: Pages
            var kidsStr = string.Join(" ", Enumerable.Range(0, pagesText.Count).Select(i => $"{(3 + i * 2)} 0 R"));
            writer.Write($"2 0 obj\r\n<< /Type /Pages /Kids [{kidsStr}] /Count {pagesText.Count} >>\r\nendobj\r\n");
            writer.Flush();

            for (int i = 0; i < pagesText.Count; i++)
            {
                int pageObjId = 3 + i * 2;
                int streamObjId = pageObjId + 1;

                // Page object
                writer.Write($"{pageObjId} 0 obj\r\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents {streamObjId} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\r\nendobj\r\n");

                // Stream object
                var streamBytes = streams[i];
                writer.Write($"{streamObjId} 0 obj\r\n<< /Length {streamBytes.Length} >>\r\nstream\r\n");
                writer.Flush();

                ms.Write(streamBytes, 0, streamBytes.Length);

                writer.Write("\r\nendstream\r\nendobj\r\n");
                writer.Flush();
            }

            // Footer (xref and trailer)
            writer.Write("xref\r\n0 1\r\n0000000000 65535 f \r\n");
            writer.Write($"trailer\r\n<< /Size {(3 + pagesText.Count * 2)} /Root 1 0 R >>\r\nstartxref\r\n370\r\n%%EOF\r\n");
            writer.Flush();
        }

        return ms.ToArray();
    }
}

internal static class MinimalXlsxBuilder
{
    public static byte[] Create(string sheetName, string cellValue)
    {
        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            WriteEntry(archive, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
                  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
                </Types>
                """);

            WriteEntry(archive, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
                </Relationships>
                """);

            WriteEntry(archive, "xl/workbook.xml", $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <sheets>
                    <sheet name="{sheetName}" sheetId="1" r:id="rId1"/>
                  </sheets>
                </workbook>
                """);

            WriteEntry(archive, "xl/_rels/workbook.xml.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/relationships/worksheet" Target="worksheets/sheet1.xml"/>
                </Relationships>
                """);

            WriteEntry(archive, "xl/worksheets/sheet1.xml", $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
                  <sheetData>
                    <row r="1">
                      <c r="A1" t="inlineStr">
                        <is><t>{System.Security.SecurityElement.Escape(cellValue)}</t></is>
                      </c>
                    </row>
                  </sheetData>
                </worksheet>
                """);
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
