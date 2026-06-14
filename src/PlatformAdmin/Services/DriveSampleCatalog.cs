namespace PlatformAdmin.Services;

/// <summary>
/// CourseProjectStorage / Chuyên ngành / Môn học (Mã) / NhomXX_Ten_SVxxxx / files
/// </summary>
public static class DriveSampleCatalog
{
    public record SubjectDef(string Name, string Code);
    public record MajorDef(string DisplayName, string MajorKey, SubjectDef[] Subjects, int GroupsPerSubject = 2);
    public record GroupDef(
        string Major, string MajorKey, string Subject, string Code,
        string GroupName, string Uid, string Project, string FolderName, string[] Files);

    public static readonly MajorDef[] Majors =
    {
        new("Trí tuệ nhân tạo", "ai", new[]
        {
            new SubjectDef("Máy học", "ITE1173E"),
            new SubjectDef("Phát triển ứng dụng trí tuệ nhân tạo", "ITE1174E"),
            new SubjectDef("Đồ án chuyên ngành trí tuệ nhân tạo", "ITE1491"),
            new SubjectDef("Khai thác dữ liệu và ứng dụng", "ITE1176E"),
            new SubjectDef("Thị giác máy tính", "ITE1181E"),
        }),
        new("Mạng máy tính", "networking", new[]
        {
            new SubjectDef("Mạng máy tính nâng cao", "ITE1235E"),
            new SubjectDef("Thiết kế mạng máy tính", "ITE1267E"),
            new SubjectDef("Lập trình mạng máy tính", "ITE1255E"),
            new SubjectDef("Quản trị mạng", "ITE1241E"),
            new SubjectDef("Đồ án chuyên ngành mạng máy tính", "ITE1489"),
        }),
        new("Hệ thống thông tin DN", "is", new[]
        {
            new SubjectDef("Cơ sở dữ liệu nâng cao", "ITE1224E"),
            new SubjectDef("Hoạch định nguồn nhân lực doanh nghiệp", "ITE1285E"),
            new SubjectDef("Hệ thống thông tin quản lý", "ITE1129E"),
            new SubjectDef("Phân tích nghiệp vụ kinh doanh", "ITE1284E"),
            new SubjectDef("Đồ án chuyên ngành hệ thống thông tin DN", "ITE1488"),
        }),
        new("An toàn không gian mạng", "security", new[]
        {
            new SubjectDef("An toàn thông tin cho ứng dụng web", "ITE1268E"),
            new SubjectDef("An toàn hệ thống mạng máy tính", "ITE1232E"),
            new SubjectDef("Phân tích và đánh giá an toàn thông tin", "ITE1239E"),
            new SubjectDef("Điều tra số", "ITE1258E"),
            new SubjectDef("Đồ án chuyên ngành an toàn không gian mạng", "ITE1490"),
        }),
        new("Kỹ thuật lập trình", "programming", new[]
        {
            new SubjectDef("Lập trình Front-End", "SWE1208E"),
            new SubjectDef("Mạng máy tính và bảo mật thông tin", "SWE1204E"),
            new SubjectDef("Phân tích và thiết kế phần mềm", "SWE1107E"),
            new SubjectDef("Lập trình ứng dụng", "SWE1205E"),
            new SubjectDef("Phát triển ứng dụng Full-Stack", "SWE1209E"),
            new SubjectDef("Công cụ phát triển ứng dụng", "SWE1210E"),
            new SubjectDef("Đồ án kỹ thuật phần mềm", "SWE1422"),
            new SubjectDef("Đảm bảo chất lượng phần mềm", "SWE1111E"),
            new SubjectDef("Kiểm thử phần mềm", "SWE1212E"),
            new SubjectDef("Quản lý dự án kiểm thử", "SWE1114E"),
            new SubjectDef("Công cụ và kỹ thuật kiểm thử tự động", "SWE1213E"),
            new SubjectDef("Đồ án chuyên ngành kiểm thử phần mềm", "SWE1415"),
            new SubjectDef("Phát triển ứng dụng đa nền tảng", "SWE1216E"),
            new SubjectDef("Phát triển Game", "ITE1279E"),
            new SubjectDef("Phát triển và vận hành hệ thống công nghệ thông tin", "SWE1219E"),
            new SubjectDef("Phát triển ứng dụng web nâng cao", "SWE1218E"),
            new SubjectDef("Đồ án chuyên ngành phát triển ứng dụng", "SWE1420"),
        }, 3),
    };

    private static readonly Dictionary<string, string[]> GroupSuffixes = new()
    {
        ["ITE1279E"] = new[] { "Game2D_Platformer", "Game3D_RPG", "GamePuzzle_Mobile" },
        ["SWE1209E"] = new[] { "FullStack_ThuVienUEF", "FullStack_KhachSan", "FullStack_FoodDelivery" },
        ["SWE1208E"] = new[] { "FrontEnd_Portfolio", "FrontEnd_Dashboard" },
        ["SWE1107E"] = new[] { "PTTK_CRM", "PTTK_ERP" },
        ["SWE1212E"] = new[] { "Test_AutoWeb", "Test_ManualApp" },
        ["ITE1174E"] = new[] { "AI_FaceDetect", "AI_Chatbot" },
    };

    public static readonly Dictionary<string, string[]> TopicTitles = new()
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
        }
    };

    public static readonly Dictionary<string, string[]> ThesisTitles = new()
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
        }
    };

    public static string[] GetFilesForSubject(string code) => code switch
    {
        "ITE1279E" => new[] { "Bao_cao_DoAn.docx", "GameDesign_GDD.pdf", "Level_Design.docx", "Unity_README.pdf", "Asset_List.xlsx", "Demo_Script.docx" },
        "SWE1209E" => new[] { "Bao_cao_DoAn.docx", "Slide_ThuyetTrinh.pdf", "TaiLieu_API.docx", "HuongDan_CaiDat.pdf", "Database_ERD.xlsx", "Postman_Collection.docx" },
        "SWE1208E" => new[] { "Bao_cao_DoAn.docx", "Wireframe_Figma.pdf", "Component_Library.docx", "CSS_Guideline.xlsx", "Responsive_Demo.pdf" },
        "SWE1107E" => new[] { "Bao_cao_DoAn.docx", "UseCase.pdf", "ClassDiagram.docx", "SequenceDiagram.xlsx", "ActivityDiagram.pdf" },
        "SWE1212E" or "SWE1111E" or "SWE1114E" or "SWE1213E" or "SWE1415" =>
            new[] { "Bao_cao_DoAn.docx", "TestPlan.pdf", "TestCase.xlsx", "BugReport_Mau.docx", "Checklist_QA.pdf" },
        "ITE1173E" or "ITE1174E" or "ITE1176E" or "ITE1181E" or "ITE1491" =>
            new[] { "Bao_cao_DoAn.docx", "MoHinh_AI.pdf", "Dataset_MoTa.xlsx", "KetQua_ThucNghiem.docx", "Notebook_HuongDan.pdf" },
        "ITE1235E" or "ITE1267E" or "ITE1255E" or "ITE1241E" or "ITE1489" =>
            new[] { "Bao_cao_DoAn.docx", "Topology_Mang.pdf", "CauHinh_ThietBi.docx", "Lab_HuongDan.xlsx" },
        "ITE1224E" or "ITE1285E" or "ITE1129E" or "ITE1284E" or "ITE1488" =>
            new[] { "Bao_cao_DoAn.docx", "ERD_Database.xlsx", "BPMN_QuyTrinh.pdf", "Mockup_UI.docx" },
        "ITE1268E" or "ITE1232E" or "ITE1239E" or "ITE1258E" or "ITE1490" =>
            new[] { "Bao_cao_DoAn.docx", "PenTest_Report.pdf", "OWASP_Checklist.xlsx", "Security_Audit.docx" },
        _ => new[] { "Bao_cao_DoAn.docx", "Slide_ThuyetTrinh.pdf", "TaiLieu_ThamKhao.xlsx", "HuongDan_SuDung.docx" },
    };

    public static IEnumerable<GroupDef> EnumerateAllGroups()
    {
        int uidCounter = 2024100;
        foreach (var major in Majors)
        {
            foreach (var subject in major.Subjects)
            {
                int groups = subject.Code == "SWE1209E" || subject.Code == "ITE1279E" ? 3 : major.GroupsPerSubject;
                var files = GetFilesForSubject(subject.Code);
                var suffixes = GroupSuffixes.GetValueOrDefault(subject.Code)
                    ?? new[] { "DoAn_01", "DoAn_02", "DoAn_03" };

                for (int g = 0; g < groups; g++)
                {
                    uidCounter++;
                    var uid = $"SV{uidCounter}";
                    var suffix = suffixes[g % suffixes.Length];
                    var groupName = $"Nhom{(g + 1):00}_{suffix}";
                    var folderName = $"{groupName}_{uid}";
                    var project = suffix.Replace('_', ' ');

                    yield return new GroupDef(
                        major.DisplayName, major.MajorKey, subject.Name, subject.Code,
                        groupName, uid, project, folderName, files);
                }
            }
        }
    }

    public static List<DriveFileInfo> BuildMockDriveFiles()
    {
        var list = new List<DriveFileInfo>();
        int i = 0;
        foreach (var g in EnumerateAllGroups())
        {
            foreach (var fileName in g.Files)
            {
                i++;
                var rel = $"CourseProjectStorage/{g.Major}/{g.Subject} ({g.Code})/{g.FolderName}/{fileName}";
                list.Add(new DriveFileInfo
                {
                    Id = $"mock-{i}",
                    Name = fileName,
                    MimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    Size = 800_000 + i * 5000,
                    WebViewLink = $"https://drive.google.com/file/d/mock-{i}/view",
                    CreatedTime = DateTime.UtcNow.AddDays(-30 + (i % 20)),
                    ModifiedTime = DateTime.UtcNow.AddDays(-(i % 10)),
                    RelativePath = rel,
                    Major = g.Major,
                    MajorKey = g.MajorKey,
                    Subject = g.Subject,
                    SubjectCode = g.Code,
                    StudentUid = g.Uid,
                    ProjectName = g.Project
                });
            }
        }
        return list;
    }
}
