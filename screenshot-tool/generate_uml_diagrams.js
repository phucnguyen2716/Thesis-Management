const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Escape helper
function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 1. ERD Diagram SVG
function getERD() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1300 1000" width="1300" height="1000">
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
        .table-title { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; fill: #ffffff; }
        .field { font-family: 'Inter', sans-serif; font-size: 10px; fill: #94a3b8; }
        .pk { fill: #f59e0b; font-weight: bold; }
        .fk { fill: #38bdf8; font-weight: bold; }
        .conn { stroke: #475569; stroke-width: 1.5; fill: none; }
        .conn-label { font-family: 'Inter', sans-serif; font-size: 9px; fill: #64748b; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#1e293b" rx="16"/>
      <text x="30" y="36" class="title">ENTITY RELATIONSHIP DIAGRAM (ERD) - SYSTEM DATABASE SCHEMA</text>
      <rect x="1130" y="18" width="140" height="24" rx="12" fill="#3b82f6" opacity="0.2"/>
      <text x="1200" y="33" fill="#38bdf8" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle">POSTGRESQL DB</text>

      <!-- Connection Lines (Relationships) -->
      <!-- Faculties (1) -> Majors (N) -->
      <path d="M 150 230 V 280" class="conn"/>
      <!-- Majors (1) -> Users (N) -->
      <path d="M 250 345 H 300" class="conn"/>
      <!-- Users (1) -> Notifications (N) -->
      <path d="M 300 400 H 270 V 580 H 250" class="conn"/>
      <!-- Users (1) -> ChatHistory (N) -->
      <path d="M 400 490 V 530" class="conn"/>

      <!-- Users (1) -> Theses (N) [Student] -->
      <path d="M 500 330 H 550" class="conn" stroke-dasharray="3 3"/>
      <!-- Users (1) -> Theses (N) [Advisor] -->
      <path d="M 500 360 H 550" class="conn"/>

      <!-- Semesters (1) -> Theses (N) -->
      <path d="M 900 230 V 250 H 710 V 280" class="conn"/>
      <!-- Subjects (1) -> Theses (N) -->
      <path d="M 1150 230 V 260 H 730 V 280" class="conn"/>

      <!-- Theses (1) -> Submissions (N) -->
      <path d="M 750 330 H 800" class="conn"/>
      <!-- Theses (1) -> PlagiarismReports (1) -->
      <path d="M 650 490 V 510 H 750 V 530" class="conn"/>

      <!-- PlagiarismReports (1) -> PlagiarismSources (N) -->
      <path d="M 850 530 V 210 H 650 V 200" class="conn"/>
      <!-- Theses (1) -> PlagiarismSources (N) -->
      <path d="M 600 280 V 200" class="conn"/>

      <!-- SocialPosts (1) -> MediaJobs (N) -->
      <path d="M 1150 700 V 740" class="conn"/>
      
      <!-- Tables -->
      <!-- Table 1: Faculties -->
      <g transform="translate(50, 100)">
        <rect width="200" height="130" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#f59e0b" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">FACULTIES (Khoa)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    Name : varchar</text>
        <text x="15" y="90" class="field">    Code : varchar (Unique)</text>
        <text x="15" y="110" class="field">    Description : varchar</text>
      </g>

      <!-- Table 2: Majors -->
      <g transform="translate(50, 280)">
        <rect width="200" height="130" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#f59e0b" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">MAJORS (Chuyên ngành)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field fk">FK  FacultyId : int</text>
        <text x="15" y="90" class="field">    Name : varchar</text>
        <text x="15" y="110" class="field">    Code : varchar (Unique)</text>
      </g>

      <!-- Table 3: PlagiarismSources -->
      <g transform="translate(500, 50)">
        <rect width="200" height="150" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#ef4444" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ef4444" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">PLAGIARISM_SOURCES</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field fk">FK  ThesisId : int</text>
        <text x="15" y="90" class="field fk">FK  ReportId : int</text>
        <text x="15" y="110" class="field">    SourceUrl : varchar</text>
        <text x="15" y="130" class="field">    SourceTitle : varchar</text>
        <text x="15" y="150" class="field">    MatchPercentage : double</text>
      </g>

      <!-- Table 4: Semesters -->
      <g transform="translate(800, 100)">
        <rect width="200" height="130" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#10b981" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">SEMESTERS (Đợt/Học kỳ)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    SemesterName : varchar</text>
        <text x="15" y="90" class="field">    SemesterCode : varchar</text>
        <text x="15" y="110" class="field">    AcademicYear : varchar</text>
      </g>

      <!-- Table 5: Subjects -->
      <g transform="translate(1050, 100)">
        <rect width="200" height="130" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#10b981" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">SUBJECTS (Học phần)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    Name : varchar</text>
        <text x="15" y="90" class="field">    Code : varchar (Unique)</text>
        <text x="15" y="110" class="field">    Credits : int</text>
      </g>

      <!-- Table 6: Users -->
      <g transform="translate(300, 280)">
        <rect width="200" height="210" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#a78bfa" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#a78bfa" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">USERS (Tài khoản)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    FullName : varchar</text>
        <text x="15" y="90" class="field">    Email : varchar (Unique)</text>
        <text x="15" y="110" class="field">    Role : Student/Advisor/Admin</text>
        <text x="15" y="130" class="field">    PasswordHash : varchar</text>
        <text x="15" y="150" class="field fk">FK  MajorId : int (Nullable)</text>
        <text x="15" y="170" class="field">    StudentId : varchar (Nullable)</text>
        <text x="15" y="190" class="field">    IsActive : boolean</text>
      </g>

      <!-- Table 7: Theses -->
      <g transform="translate(550, 280)">
        <rect width="200" height="210" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#10b981" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">THESES (Khóa luận/Đề tài)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    Title : varchar</text>
        <text x="15" y="90" class="field fk">FK  StudentId : int (Tác giả)</text>
        <text x="15" y="110" class="field fk">FK  AdvisorId : int (Cố vấn)</text>
        <text x="15" y="130" class="field fk">FK  SubjectId : int</text>
        <text x="15" y="150" class="field fk">FK  SemesterId : int</text>
        <text x="15" y="170" class="field">    Status : varchar</text>
        <text x="15" y="190" class="field">    Category : varchar</text>
      </g>

      <!-- Table 8: ThesisSubmissions -->
      <g transform="translate(800, 280)">
        <rect width="200" height="150" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#3b82f6" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">SUBMISSIONS (Bản nộp file)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field fk">FK  ThesisId : int</text>
        <text x="15" y="90" class="field">    FilePath : varchar</text>
        <text x="15" y="110" class="field">    Version : int</text>
        <text x="15" y="130" class="field">    SubmittedAt : datetime</text>
      </g>

      <!-- Table 9: Notifications -->
      <g transform="translate(50, 530)">
        <rect width="200" height="150" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#3b82f6" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">NOTIFICATIONS (Thông báo)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field fk">FK  UserId : int</text>
        <text x="15" y="90" class="field">    Title : varchar</text>
        <text x="15" y="110" class="field">    Message : varchar</text>
        <text x="15" y="130" class="field">    IsRead : boolean</text>
      </g>

      <!-- Table 10: ChatHistory -->
      <g transform="translate(300, 530)">
        <rect width="200" height="160" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#3b82f6" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">CHAT_HISTORY (Trợ lý AI)</text>
        <text x="15" y="50" class="field pk">PK  Id : varchar</text>
        <text x="15" y="70" class="field">    Prompt : text</text>
        <text x="15" y="90" class="field">    Message : text</text>
        <text x="15" y="110" class="field">    Success : boolean</text>
        <text x="15" y="130" class="field fk">FK  UserId : int (Nullable)</text>
        <text x="15" y="150" class="field">    CreatedAt : datetime</text>
      </g>

      <!-- Table 11: PlagiarismReports -->
      <g transform="translate(750, 530)">
        <rect width="200" height="150" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#ef4444" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ef4444" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">PLAGIARISM_REPORTS</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field fk">FK  ThesisId : int</text>
        <text x="15" y="90" class="field">    SimilarityPercentage : double</text>
        <text x="15" y="110" class="field">    ReportJson : text</text>
        <text x="15" y="130" class="field">    CheckedAt : datetime</text>
      </g>

      <!-- Table 12: SocialPosts -->
      <g transform="translate(1050, 530)">
        <rect width="200" height="170" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#ec4899" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ec4899" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">SOCIAL_POSTS (Tin tức)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    Title : varchar</text>
        <text x="15" y="90" class="field">    Category : varchar</text>
        <text x="15" y="110" class="field">    Image : varchar (Admin post)</text>
        <text x="15" y="130" class="field">    Content : text</text>
        <text x="15" y="150" class="field">    Published : boolean</text>
        <text x="15" y="170" class="field">    CloudinaryStatus : varchar</text>
      </g>

      <!-- Table 13: DriveFileRecords -->
      <g transform="translate(300, 740)">
        <rect width="200" height="210" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#6366f1" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#6366f1" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">DRIVE_FILE_RECORDS</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    FileName : varchar</text>
        <text x="15" y="90" class="field">    GoogleDriveFileId : varchar</text>
        <text x="15" y="110" class="field">    WebViewLink : varchar</text>
        <text x="15" y="130" class="field">    LocalPdfPath : varchar</text>
        <text x="15" y="150" class="field">    Category : varchar</text>
        <text x="15" y="170" class="field">    Major : varchar</text>
        <text x="15" y="190" class="field">    StudentUid : varchar</text>
      </g>

      <!-- Table 14: AuditLogs -->
      <g transform="translate(550, 740)">
        <rect width="200" height="160" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#f59e0b" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">AUDIT_LOGS (Nhật ký bảo mật)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field">    Email : varchar</text>
        <text x="15" y="90" class="field">    Role : varchar (Admin/Advisor...)</text>
        <text x="15" y="110" class="field">    Success : boolean</text>
        <text x="15" y="130" class="field">    Message : varchar</text>
        <text x="15" y="150" class="field">    CreatedAt : datetime</text>
      </g>

      <!-- Table 15: MediaJobs -->
      <g transform="translate(1050, 740)">
        <rect width="200" height="160" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#ec4899" opacity="0.1"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ec4899" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">MEDIA_JOBS (Xử lý file)</text>
        <text x="15" y="50" class="field pk">PK  Id : varchar</text>
        <text x="15" y="70" class="field">    ResourceName : varchar</text>
        <text x="15" y="90" class="field">    JobType : varchar</text>
        <text x="15" y="110" class="field">    OriginalSizeKb : double</text>
        <text x="15" y="130" class="field">    OptimizedSizeKb : double</text>
        <text x="15" y="150" class="field">    Status : varchar</text>
      </g>
    </svg>
  `;
}

// 2. Class Diagram SVG
function getClassDiagram() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
        .class-title { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: bold; fill: #ffffff; }
        .field { font-family: 'Consolas', monospace; font-size: 9px; fill: #94a3b8; }
        .method { font-family: 'Consolas', monospace; font-size: 9px; fill: #38bdf8; }
        .conn { stroke: #475569; stroke-width: 1.5; fill: none; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#1e293b" rx="16"/>
      <text x="30" y="36" class="title">UML CLASS DIAGRAM - BACKEND APPLICATION LAYER</text>
      <rect x="830" y="18" width="140" height="24" rx="12" fill="#10b981" opacity="0.2"/>
      <text x="900" y="33" fill="#10b981" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle">.NET WEB API</text>

      <!-- Relationships -->
      <!-- ThesisService -> IThesisService (Implementation) -->
      <path d="M 500 240 V 160" class="conn" stroke-dasharray="5 4"/>
      <!-- Triangle pointer at top -->
      <polygon points="500,150 495,160 505,160" fill="none" stroke="#475569" stroke-width="1.5"/>

      <!-- PlagiarismService -> IPlagiarismService -->
      <path d="M 830 240 V 160" class="conn" stroke-dasharray="5 4"/>
      <polygon points="830,150 825,160 835,160" fill="none" stroke="#475569" stroke-width="1.5"/>

      <!-- ThesisController -> IThesisService (Usage) -->
      <path d="M 260 200 H 400" class="conn"/>
      <polygon points="400,200 392,196 392,204" fill="#475569"/>

      <!-- PlagiarismController -> IPlagiarismService (Usage) -->
      <path d="M 260 460 H 730" class="conn"/>
      <polygon points="730,460 722,456 722,464" fill="#475569"/>

      <!-- Classes -->
      <!-- Controller 1: ThesisController -->
      <g transform="translate(50, 90)">
        <rect width="210" height="150" rx="4" ry="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="210" height="24" fill="#3b82f6" opacity="0.2"/>
        <line x1="0" y1="24" x2="210" y2="24" stroke="#475569" stroke-width="1.5"/>
        <text x="10" y="16" class="class-title">ThesisController : ControllerBase</text>
        
        <text x="10" y="42" class="field">- _thesisService : IThesisService</text>
        <line x1="0" y1="52" x2="210" y2="52" stroke="#475569" stroke-width="1"/>
        
        <text x="10" y="68" class="method">+ GetAll(page, size) : Task</text>
        <text x="10" y="84" class="method">+ GetById(id) : Task</text>
        <text x="10" y="100" class="method">+ Create(request) : Task</text>
        <text x="10" y="116" class="method">+ Update(id, request) : Task</text>
        <text x="10" y="132" class="method">+ Delete(id) : Task</text>
      </g>

      <!-- Interface 1: IThesisService -->
      <g transform="translate(400, 70)">
        <rect width="210" height="80" rx="4" ry="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="210" height="24" fill="#10b981" opacity="0.2"/>
        <line x1="0" y1="24" x2="210" y2="24" stroke="#475569" stroke-width="1.5"/>
        <text x="10" y="16" class="class-title">&lt;&lt;interface&gt;&gt; IThesisService</text>
        
        <text x="10" y="42" class="method">+ GetAllAsync(...) : Task</text>
        <text x="10" y="58" class="method">+ GetByIdAsync(id) : Task</text>
        <text x="10" y="72" class="method">+ CreateAsync(...) : Task</text>
      </g>

      <!-- Service 1: ThesisService -->
      <g transform="translate(400, 240)">
        <rect width="210" height="150" rx="4" ry="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="210" height="24" fill="#10b981" opacity="0.1"/>
        <line x1="0" y1="24" x2="210" y2="24" stroke="#475569" stroke-width="1.5"/>
        <text x="10" y="16" class="class-title">ThesisService : IThesisService</text>
        
        <text x="10" y="42" class="field">- _db : AppDbContext</text>
        <text x="10" y="58" class="field">- _rabbitmq : IQueueService</text>
        <line x1="0" y1="68" x2="210" y2="68" stroke="#475569" stroke-width="1"/>
        
        <text x="10" y="84" class="method">+ GetAllAsync(...) : Task</text>
        <text x="10" y="100" class="method">+ GetByIdAsync(id) : Task</text>
        <text x="10" y="116" class="method">+ CreateAsync(...) : Task</text>
        <text x="10" y="132" class="method">+ SubmitFileAsync(id, file) : Task</text>
      </g>

      <!-- Interface 2: IPlagiarismService -->
      <g transform="translate(730, 70)">
        <rect width="220" height="80" rx="4" ry="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="220" height="24" fill="#ef4444" opacity="0.2"/>
        <line x1="0" y1="24" x2="220" y2="24" stroke="#475569" stroke-width="1.5"/>
        <text x="10" y="16" class="class-title">&lt;&lt;interface&gt;&gt; IPlagiarismService</text>
        
        <text x="10" y="42" class="method">+ RunCheckAsync(thesisId) : Task</text>
        <text x="10" y="58" class="method">+ ExtractTextAsync(file) : Task</text>
      </g>

      <!-- Service 2: PlagiarismService -->
      <g transform="translate(730, 240)">
        <rect width="220" height="150" rx="4" ry="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="220" height="24" fill="#ef4444" opacity="0.1"/>
        <line x1="0" y1="24" x2="220" y2="24" stroke="#475569" stroke-width="1.5"/>
        <text x="10" y="16" class="class-title">PlagiarismService : IPlagiarismService</text>
        
        <text x="10" y="42" class="field">- _geminiApi : IGeminiClient</text>
        <text x="10" y="58" class="field">- _db : AppDbContext</text>
        <line x1="0" y1="68" x2="220" y2="68" stroke="#475569" stroke-width="1"/>
        
        <text x="10" y="84" class="method">+ RunCheckAsync(thesisId) : Task</text>
        <text x="10" y="100" class="method">+ ExtractTextAsync(file) : Task</text>
        <text x="10" y="116" class="method">- CallGeminiCompareAsync(text) : Task</text>
      </g>

      <!-- Controller 2: PlagiarismController -->
      <g transform="translate(50, 400)">
        <rect width="210" height="120" rx="4" ry="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="210" height="24" fill="#e2e8f0" opacity="0.1"/>
        <line x1="0" y1="24" x2="210" y2="24" stroke="#475569" stroke-width="1.5"/>
        <text x="10" y="16" class="class-title">PlagiarismController : ControllerBase</text>
        
        <text x="10" y="42" class="field">- _plagService : IPlagiarismService</text>
        <line x1="0" y1="52" x2="210" y2="52" stroke="#475569" stroke-width="1"/>
        
        <text x="10" y="68" class="method">+ GetReport(thesisId) : Task</text>
        <text x="10" y="84" class="method">+ TriggerScan(thesisId) : Task</text>
      </g>
    </svg>
  `;
}

// 3. Sequence Diagram SVG
function getSequenceDiagram() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
        .actor { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: bold; fill: #ffffff; }
        .msg { font-family: 'Inter', sans-serif; font-size: 9px; fill: #38bdf8; }
        .msg-note { font-family: 'Inter', sans-serif; font-size: 8.5px; fill: #94a3b8; }
        .line { stroke: #475569; stroke-width: 1.5; stroke-dasharray: 4 4; }
        .arrow { stroke: #38bdf8; stroke-width: 1.5; fill: none; }
        .reply-arrow { stroke: #64748b; stroke-width: 1.5; stroke-dasharray: 3 2; fill: none; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#1e293b" rx="16"/>
      <text x="30" y="36" class="title">UML SEQUENCE DIAGRAM - PLAGIARISM CHECK SYSTEM FLOW</text>
      <rect x="830" y="18" width="140" height="24" rx="12" fill="#ef4444" opacity="0.2"/>
      <text x="900" y="33" fill="#ef4444" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle">SYSTEM SEQUENCE</text>

      <!-- Lifelines -->
      <!-- Sinh viên -->
      <line x1="120" y1="120" x2="120" y2="580" class="line"/>
      <rect x="70" y="80" width="100" height="30" rx="4" fill="#a78bfa" opacity="0.2" stroke="#a78bfa"/>
      <text x="120" y="99" class="actor" text-anchor="middle">Student (SV)</text>
      
      <!-- Frontend -->
      <line x1="300" y1="120" x2="300" y2="580" class="line"/>
      <rect x="250" y="80" width="100" height="30" rx="4" fill="#38bdf8" opacity="0.2" stroke="#38bdf8"/>
      <text x="300" y="99" class="actor" text-anchor="middle">React Frontend</text>

      <!-- Web API -->
      <line x1="480" y1="120" x2="480" y2="580" class="line"/>
      <rect x="430" y="80" width="100" height="30" rx="4" fill="#10b981" opacity="0.2" stroke="#10b981"/>
      <text x="480" y="99" class="actor" text-anchor="middle">PlatformAdmin API</text>

      <!-- RabbitMQ -->
      <line x1="660" y1="120" x2="660" y2="580" class="line"/>
      <rect x="610" y="80" width="100" height="30" rx="4" fill="#f59e0b" opacity="0.2" stroke="#f59e0b"/>
      <text x="660" y="99" class="actor" text-anchor="middle">RabbitMQ Queue</text>

      <!-- Plagiarism Worker -->
      <line x1="840" y1="120" x2="840" y2="580" class="line"/>
      <rect x="780" y="80" width="120" height="30" rx="4" fill="#f43f5e" opacity="0.2" stroke="#f43f5e"/>
      <text x="840" y="99" class="actor" text-anchor="middle">Plagiarism Worker</text>

      <!-- Messages -->
      <!-- 1. Submit file -->
      <line x1="120" y1="160" x2="292" y2="160" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="130" y="152" class="msg">1. Submit document (PDF/Docx)</text>

      <!-- 2. POST submit file API -->
      <line x1="300" y1="200" x2="472" y2="200" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="310" y="192" class="msg">2. POST /api/theses/{id}/submit</text>

      <!-- 3. Save File & DB record -->
      <path d="M 480 220 H 510 V 250 H 488" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="515" y="240" class="msg-note">3. Save file &amp; Update status in DB</text>

      <!-- 4. Queue Plagiarism Job -->
      <line x1="480" y1="280" x2="652" y2="280" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="490" y="272" class="msg">4. Publish message (ThesisId)</text>

      <!-- 5. Return success response -->
      <line x1="480" y1="310" x2="308" y2="310" class="reply-arrow" marker-end="url(#arrow-head)"/>
      <text x="320" y="302" class="msg">5. Status: Submitted (HTTP 200)</text>

      <!-- 6. Consume Queue Job -->
      <line x1="660" y1="350" x2="832" y2="350" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="670" y="342" class="msg">6. Consume Plagiarism Job</text>

      <!-- 7. Call Gemini AI check -->
      <path d="M 840 380 H 870 V 430 H 848" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="875" y="410" class="msg-note">7. Extract PDF text &amp; Call Gemini AI</text>

      <!-- 8. Save Plagiarism Report -->
      <line x1="840" y1="470" x2="488" y2="470" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="510" y="462" class="msg">8. Save PlagiarismReportEntity to PostgreSQL</text>

      <!-- 9. SSE / Fetch Report -->
      <line x1="300" y1="520" x2="472" y2="520" class="arrow" marker-end="url(#arrow-head)"/>
      <text x="310" y="512" class="msg">9. GET /api/theses/{id}/plagiarism-report</text>

      <!-- 10. Display report -->
      <line x1="480" y1="550" x2="308" y2="550" class="reply-arrow" marker-end="url(#arrow-head)"/>
      <text x="320" y="542" class="msg">10. Display similarity report on Web</text>

      <!-- Markers -->
      <defs>
        <marker id="arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 2 L 6 5 L 0 8 z" fill="#38bdf8"/>
        </marker>
      </defs>
    </svg>
  `;
}

// 4. Activity Diagram SVG
function getActivityDiagram() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
        .swim-title { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: bold; fill: #ffffff; letter-spacing: 1px; }
        .action { font-family: 'Inter', sans-serif; font-size: 10px; fill: #ffffff; font-weight: bold; }
        .decision { font-family: 'Inter', sans-serif; font-size: 9px; fill: #94a3b8; font-weight: bold; }
        .conn { stroke: #64748b; stroke-width: 1.5; fill: none; }
        .label { font-family: 'Inter', sans-serif; font-size: 9px; fill: #38bdf8; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#1e293b" rx="16"/>
      <text x="30" y="36" class="title">UML ACTIVITY DIAGRAM - THESIS REGISTRATION &amp; SUBMISSION FLOW</text>
      <rect x="830" y="18" width="140" height="24" rx="12" fill="#38bdf8" opacity="0.2"/>
      <text x="900" y="33" fill="#38bdf8" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle">ACTIVITY FLOW</text>

      <!-- Swimlanes dividers -->
      <line x1="333" y1="60" x2="333" y2="650" stroke="#334155" stroke-width="1.5"/>
      <line x1="666" y1="60" x2="666" y2="650" stroke="#334155" stroke-width="1.5"/>

      <!-- Swimlanes titles -->
      <text x="166" y="90" class="swim-title" text-anchor="middle">SINH VIÊN (Student)</text>
      <text x="500" y="90" class="swim-title" text-anchor="middle">GIẢNG VIÊN (Advisor)</text>
      <text x="833" y="90" class="swim-title" text-anchor="middle">HỆ THỐNG (eThesis System)</text>

      <!-- Activity Start -->
      <circle cx="166" cy="130" r="10" fill="#ffffff"/>
      
      <!-- Arrow from Start to Register -->
      <line x1="166" y1="140" x2="166" y2="172" class="conn" marker-end="url(#arrow)"/>

      <!-- Action 1: Register topic -->
      <g transform="translate(96, 180)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Đăng ký đề tài mới</text>
      </g>

      <!-- Arrow from Register to System notifies -->
      <path d="M 236 200 H 763" class="conn" marker-end="url(#arrow)"/>
      
      <!-- Action 2: System creates & notifies -->
      <g transform="translate(763, 180)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Lưu Pending &amp; Báo GV</text>
      </g>

      <!-- Arrow from System to GV review -->
      <path d="M 833 220 V 270 H 570" class="conn" marker-end="url(#arrow)"/>

      <!-- Action 3: GV review -->
      <g transform="translate(430, 250)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Xem xét duyệt đề tài</text>
      </g>

      <!-- Arrow from GV review to Decision -->
      <line x1="500" y1="290" x2="500" y2="322" class="conn" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(480, 330)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
      </g>

      <!-- Decision Path: Reject -->
      <path d="M 480 350 H 166 V 220" class="conn" marker-end="url(#arrow)"/>
      <text x="300" y="342" class="label">Từ chối (Rejected)</text>

      <!-- Decision Path: Approve -->
      <path d="M 520 350 H 833 V 390" class="conn" marker-end="url(#arrow)"/>
      <text x="680" y="342" class="label">Đồng ý (InProgress)</text>

      <!-- Action 4: System marks InProgress -->
      <g transform="translate(763, 400)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Mở khóa chức năng nộp</text>
      </g>

      <!-- Arrow from System to SV submit -->
      <path d="M 763 420 H 166 V 450" class="conn" marker-end="url(#arrow)"/>

      <!-- Action 5: SV submits document -->
      <g transform="translate(96, 460)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#a78bfa" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Nộp bản thảo (PDF)</text>
      </g>

      <!-- Arrow from SV submit to System checks -->
      <path d="M 236 480 H 763" class="conn" marker-end="url(#arrow)"/>

      <!-- Action 6: System Plagiarism check -->
      <g transform="translate(763, 460)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Tự động check đạo văn</text>
      </g>

      <!-- Arrow from System checks to Final result -->
      <line x1="833" y1="500" x2="833" y2="532" class="conn" marker-end="url(#arrow)"/>

      <!-- Action 7: Render Result -->
      <g transform="translate(763, 540)">
        <rect width="140" height="40" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="70" y="24" class="action" text-anchor="middle">Báo điểm &amp; Tỷ lệ tương đồng</text>
      </g>

      <!-- Arrow from Render Result to SV End -->
      <path d="M 763 560 H 166 V 590" class="conn" marker-end="url(#arrow)"/>

      <!-- Activity End -->
      <g transform="translate(156, 600)">
        <circle cx="10" cy="10" r="10" fill="#ffffff"/>
        <circle cx="10" cy="10" r="6" fill="#0f172a"/>
      </g>

      <!-- Definitions -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
    </svg>
  `;
}

// 5. State Diagram SVG
function getStateDiagram() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
        .state-name { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; fill: #ffffff; }
        .trans-label { font-family: 'Consolas', monospace; font-size: 9px; fill: #38bdf8; }
        .conn { stroke: #475569; stroke-width: 1.5; fill: none; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#1e293b" rx="16"/>
      <text x="30" y="36" class="title">UML STATE MACHINE DIAGRAM - THESIS STATE LIFECYCLE</text>
      <rect x="830" y="18" width="140" height="24" rx="12" fill="#8b5cf6" opacity="0.2"/>
      <text x="900" y="33" fill="#8b5cf6" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle">STATE MACHINE</text>

      <!-- States -->
      <!-- Start -->
      <circle cx="80" cy="220" r="10" fill="#ffffff"/>
      <line x1="90" y1="220" x2="162" y2="220" class="conn" marker-end="url(#arrow)"/>
      <text x="120" y="210" class="trans-label" text-anchor="middle">Register()</text>

      <!-- State: Pending -->
      <g transform="translate(170, 185)">
        <rect width="120" height="70" rx="12" ry="12" fill="#1e293b" stroke="#a78bfa" stroke-width="2" filter="url(#glow)"/>
        <text x="60" y="35" class="state-name" text-anchor="middle">PENDING</text>
        <text x="60" y="50" fill="#64748b" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">Chờ giảng viên duyệt</text>
      </g>

      <!-- Transition: Pending -> Rejected -->
      <path d="M 230 260 V 380" class="conn" marker-end="url(#arrow)"/>
      <text x="240" y="320" class="trans-label">Reject() [Lý do từ chối]</text>

      <!-- State: Rejected -->
      <g transform="translate(170, 390)">
        <rect width="120" height="70" rx="12" ry="12" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
        <text x="60" y="35" class="state-name" text-anchor="middle">REJECTED</text>
        <text x="60" y="50" fill="#64748b" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">Đã bị từ chối</text>
      </g>

      <!-- Transition: Rejected -> Pending -->
      <path d="M 170 425 H 120 V 240 H 162" class="conn" stroke-dasharray="3 3" marker-end="url(#arrow)"/>
      <text x="90" y="340" class="trans-label">ReSubmit()</text>

      <!-- Transition: Pending -> InProgress -->
      <line x1="290" y1="220" x2="412" y2="220" class="conn" marker-end="url(#arrow)"/>
      <text x="350" y="210" class="trans-label" text-anchor="middle">Approve()</text>

      <!-- State: InProgress -->
      <g transform="translate(420, 185)">
        <rect width="130" height="70" rx="12" ry="12" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
        <text x="65" y="35" class="state-name" text-anchor="middle">IN_PROGRESS</text>
        <text x="65" y="50" fill="#64748b" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">Đang làm đồ án</text>
      </g>

      <!-- Transition: InProgress -> Submitted -->
      <line x1="550" y1="220" x2="682" y2="220" class="conn" marker-end="url(#arrow)"/>
      <text x="616" y="210" class="trans-label" text-anchor="middle">SubmitFile()</text>

      <!-- State: Submitted -->
      <g transform="translate(690, 185)">
        <rect width="130" height="70" rx="12" ry="12" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
        <text x="65" y="35" class="state-name" text-anchor="middle">SUBMITTED</text>
        <text x="65" y="50" fill="#64748b" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">Đã nộp bản thảo</text>
      </g>

      <!-- Transition: Submitted -> UnderReview -->
      <line x1="755" y1="260" x2="755" y2="382" class="conn" marker-end="url(#arrow)"/>
      <text x="765" y="320" class="trans-label">StartEvaluation()</text>

      <!-- State: UnderReview -->
      <g transform="translate(690, 390)">
        <rect width="130" height="70" rx="12" ry="12" fill="#1e293b" stroke="#8b5cf6" stroke-width="2"/>
        <text x="65" y="35" class="state-name" text-anchor="middle">UNDER_REVIEW</text>
        <text x="65" y="50" fill="#64748b" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">Hội đồng/GV đang chấm</text>
      </g>

      <!-- Transition: UnderReview -> Revision -->
      <path d="M 690 425 H 520 V 260" class="conn" stroke-dasharray="3 3" marker-end="url(#arrow)"/>
      <text x="590" y="415" class="trans-label">RequireRevision()</text>

      <!-- Transition: UnderReview -> Approved -->
      <path d="M 755 465 H 480 V 550" class="conn" marker-end="url(#arrow)"/>
      <text x="620" y="535" class="trans-label">AcceptThesis() [Điểm đạt]</text>

      <!-- State: Approved -->
      <g transform="translate(360, 560)">
        <rect width="240" height="60" rx="12" ry="12" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
        <text x="120" y="30" class="state-name" text-anchor="middle">APPROVED / FINISHED</text>
        <text x="120" y="45" fill="#64748b" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">Bảo vệ thành công &amp; lưu thư viện</text>
      </g>

      <!-- End state pointer -->
      <line x1="600" y1="590" x2="682" y2="590" class="conn" marker-end="url(#arrow)"/>
      <g transform="translate(690, 580)">
        <circle cx="10" cy="10" r="10" fill="#ffffff"/>
        <circle cx="10" cy="10" r="6" fill="#0f172a"/>
      </g>

      <!-- Definitions -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#a78bfa" flood-opacity="0.15"/>
        </filter>
      </defs>
    </svg>
  `;
}

// Main execution function
async function generateUML() {
  const outputDir = path.join(__dirname, '..', 'flows');
  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads', 'flows');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`Starting generation of UML diagrams...`);

  const diagrams = [
    { name: 'erd_diagram', content: getERD() },
    { name: 'class_diagram', content: getClassDiagram() },
    { name: 'sequence_diagram', content: getSequenceDiagram() },
    { name: 'activity_diagram', content: getActivityDiagram() },
    { name: 'state_diagram', content: getStateDiagram() }
  ];

  for (const diag of diagrams) {
    try {
      const svgPath = path.join(outputDir, `${diag.name}.svg`);
      const pngPath = path.join(outputDir, `${diag.name}.png`);
      
      const dlSvgPath = path.join(downloadsDir, `${diag.name}.svg`);
      const dlPngPath = path.join(downloadsDir, `${diag.name}.png`);

      // Write SVGs
      fs.writeFileSync(svgPath, diag.content);
      fs.writeFileSync(dlSvgPath, diag.content);

      // Convert to PNGs using sharp
      const svgBuffer = Buffer.from(diag.content);
      await sharp(svgBuffer)
        .png()
        .toFile(pngPath);

      await sharp(svgBuffer)
        .png()
        .toFile(dlPngPath);

      console.log(`[Generated] UML Diagram: ${diag.name}`);
    } catch (err) {
      console.error(`Error generating UML ${diag.name}:`, err);
    }
  }

  console.log(`Successfully generated all UML diagrams!`);
}

generateUML();
