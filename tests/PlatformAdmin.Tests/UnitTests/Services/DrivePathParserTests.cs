using PlatformAdmin.Services;
using static PlatformAdmin.Services.GoogleDriveStorageService;
using Xunit;

namespace PlatformAdmin.Tests.UnitTests.Services;

public class DrivePathParserTests
{
    [Fact]
    public void ParseCourseProjectPath_ValidProjectStandardPath_ReturnsCorrectMetadata()
    {
        var relativePath = "CourseProjectStorage/Trí tuệ nhân tạo/Máy học (ITE1173E)/SV2024101_Hệ thống AI.pdf";
        var (major, majorKey, subject, subjectCode, studentUid, projectName) = 
            DrivePathParser.ParseCourseProjectPath(relativePath);

        Assert.Equal("Trí tuệ nhân tạo", major);
        Assert.Equal("ai", majorKey);
        Assert.Equal("Máy học", subject);
        Assert.Equal("ITE1173E", subjectCode);
        Assert.Equal("SV2024101", studentUid);
        Assert.Equal("Hệ thống AI", projectName);
    }

    [Fact]
    public void ParseCourseProjectPath_GroupPathWithGenericFilename_GeneratesProfessionalTitle()
    {
        var relativePath = "CourseProjectStorage/Mạng máy tính/Quản trị mạng (ITE1241E)/Nhom02_DesignNetwork_SV2026302/Báo cáo.pdf";
        var (major, majorKey, subject, subjectCode, studentUid, projectName) = 
            DrivePathParser.ParseCourseProjectPath(relativePath);

        Assert.Equal("Mạng máy tính", major);
        Assert.Equal("networking", majorKey);
        Assert.Equal("Quản trị mạng", subject);
        Assert.Equal("ITE1241E", subjectCode);
        Assert.Equal("SV2026302", studentUid);
        Assert.NotNull(projectName);
        Assert.NotEqual("Báo cáo", projectName);
        Assert.Contains("mạng", projectName.ToLowerInvariant());
    }

    [Fact]
    public void ParseAcademicPath_TopicCategory_ReturnsTopicMetadata()
    {
        var relativePath = "SpecializationReportStorage/Công nghệ phần mềm/SV2025001_Bao cao chuyen de.docx";
        var (major, majorKey, subject, subjectCode, studentUid, projectName) = 
            DrivePathParser.ParseAcademicPath(relativePath, AcademicCategory.Topic);

        Assert.Equal("Công nghệ phần mềm", major);
        Assert.Equal("software-engineering", majorKey);
        Assert.Equal("Chuyên đề tốt nghiệp", subject);
        Assert.Equal("TOPIC101", subjectCode);
        Assert.Equal("SV2025001", studentUid);
        Assert.NotNull(projectName);
    }

    [Fact]
    public void ParseAcademicPath_ThesisCategory_ReturnsThesisMetadata()
    {
        var relativePath = "GraduationThesisStorage/An toàn không gian mạng/SV2026999_Khoa luan.docx";
        var (major, majorKey, subject, subjectCode, studentUid, projectName) = 
            DrivePathParser.ParseAcademicPath(relativePath, AcademicCategory.Thesis);

        Assert.Equal("An toàn không gian mạng", major);
        Assert.Equal("security", majorKey);
        Assert.Equal("Khóa luận tốt nghiệp", subject);
        Assert.Equal("THESIS202", subjectCode);
        Assert.Equal("SV2026999", studentUid);
        Assert.NotNull(projectName);
    }

    [Fact]
    public void ParseAcademicPath_InvalidRootDirectory_ReturnsAllNulls()
    {
        var relativePath = "WrongRootFolder/Trí tuệ nhân tạo/Máy học (ITE1173E)/SV2024101_Hệ thống AI.pdf";
        var (major, majorKey, subject, subjectCode, studentUid, projectName) = 
            DrivePathParser.ParseAcademicPath(relativePath, AcademicCategory.Project);

        Assert.Null(major);
        Assert.Null(majorKey);
    }

    [Fact]
    public void ParseCourseProjectPath_MissingStudentUid_GeneratesConsistentPseudoUid()
    {
        var relativePath1 = "CourseProjectStorage/Trí tuệ nhân tạo/Máy học (ITE1173E)/Nhom_KhongMSSV/Document.pdf";
        var relativePath2 = "CourseProjectStorage/Trí tuệ nhân tạo/Máy học (ITE1173E)/Nhom_KhongMSSV/Slide.pdf";

        var result1 = DrivePathParser.ParseCourseProjectPath(relativePath1);
        var result2 = DrivePathParser.ParseCourseProjectPath(relativePath2);

        Assert.NotNull(result1.StudentUid);
        Assert.StartsWith("SV", result1.StudentUid);
        Assert.Equal(result1.StudentUid, result2.StudentUid);
    }

    [Fact]
    public void SanitizeFolderName_ContainsInvalidChars_ReplacesWithUnderscores()
    {
        var originalName = "Project/Detail: With? Invalid* Chars";
        var sanitized = DrivePathParser.SanitizeFolderName(originalName);

        Assert.DoesNotContain("/", sanitized);
        Assert.DoesNotContain(":", sanitized);
        Assert.Equal("Project_Detail_ With_ Invalid_ Chars", sanitized);
    }

    [Theory]
    [InlineData("Công nghệ phần mềm", "software-engineering")]
    [InlineData("Mạng máy tính", "networking")]
    [InlineData("An toàn không gian mạng", "security")]
    [InlineData("Trí tuệ nhân tạo", "ai")]
    public void ParseMajorKey_VariousMajors_ReturnsExpectedKey(string majorName, string expectedKey)
    {
        var path = $"CourseProjectStorage/{majorName}/Subject (SUB101)/SV123_Project.pdf";
        var (_, majorKey, _, _, _, _) = DrivePathParser.ParseCourseProjectPath(path);
        Assert.Equal(expectedKey, majorKey);
    }

    [Theory]
    [InlineData("CourseProjectStorage/ai/Subject (SUB101)/File.txt")] // Invalid extension
    [InlineData("CourseProjectStorage/ai/File.pdf")] // Not deep enough
    [InlineData("CourseProjectStorage/ai/Subject/SV123_File.pdf")] // Missing subject code parentheses
    public void ParseCourseProjectPath_InvalidFormat_ReturnsNullMetadata(string path)
    {
        var (_, _, subject, subjectCode, studentUid, projectName) = 
            DrivePathParser.ParseCourseProjectPath(path);

        Assert.Null(subject);
        Assert.Null(subjectCode);
        Assert.Null(studentUid);
        Assert.Null(projectName);
    }

    [Fact]
    public void ParseCourseProjectPath_MalformedSubjectParentheses_ExtractsCleanSubjectAndCode()
    {
        var path = "CourseProjectStorage/Trí tuệ nhân tạo/Học Máy ITE1173E)/SV2024101_Hệ thống AI.pdf";
        var (_, _, subject, subjectCode, _, _) = DrivePathParser.ParseCourseProjectPath(path);

        Assert.NotNull(subject);
        Assert.Equal("Học Máy", subject.Trim());
        Assert.Equal("ITE1173E", subjectCode);
    }

    [Fact]
    public void ParseCourseProjectPath_WhitespaceInPath_SanitizesMetadata()
    {
        var path = "CourseProjectStorage /  Trí tuệ nhân tạo  / Máy học ( ITE1173E ) / SV2024101 _ Hệ thống AI .pdf";
        var (major, _, subject, subjectCode, studentUid, projectName) = DrivePathParser.ParseCourseProjectPath(path);

        Assert.Equal("Trí tuệ nhân tạo", major);
        Assert.Equal("Máy học", subject);
        Assert.Equal("ITE1173E", subjectCode);
        Assert.Equal("SV2024101", studentUid);
        Assert.Equal("Hệ thống AI", projectName);
    }

    [Fact]
    public void ParseAcademicPath_TopicWithGenericName_GeneratesProfessionalTitle()
    {
        var path = "SpecializationReportStorage/Công nghệ phần mềm/SV2025001_Slide.docx";
        var (_, _, _, _, _, projectName) = DrivePathParser.ParseAcademicPath(path, AcademicCategory.Topic);

        Assert.NotNull(projectName);
        Assert.NotEqual("Slide", projectName);
        Assert.Contains("phần mềm", projectName.ToLowerInvariant());
    }
}
