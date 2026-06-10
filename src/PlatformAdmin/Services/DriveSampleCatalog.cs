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
