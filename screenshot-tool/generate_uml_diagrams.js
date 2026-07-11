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
      <path d="M 900 230 V 260 H 710 V 280" class="conn"/>
      <!-- Subjects (1) -> Theses (N) -->
      <path d="M 1150 230 V 270 H 730 V 280" class="conn"/>

      <!-- Theses (1) -> Submissions (N) -->
      <path d="M 750 330 H 800" class="conn"/>
      <!-- Theses (1) -> PlagiarismReports (1) -->
      <path d="M 650 490 V 510 H 750 V 530" class="conn"/>

      <!-- PlagiarismReports (1) -> PlagiarismSources (N) -->
      <path d="M 770 530 V 240 H 600 V 200" class="conn"/>
      <!-- Theses (1) -> PlagiarismSources (N) -->
      <path d="M 600 280 V 200" class="conn"/>

      <!-- SocialPosts (1) -> MediaJobs (N) -->
      <path d="M 1150 700 V 740" class="conn"/>

      <!-- Users (1) -> SocialPosts (N) [Creator] -->
      <path d="M 400 490 V 515 H 1020 V 550 H 1050" class="conn" stroke-dasharray="3 3"/>
      
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
        <rect width="200" height="250" rx="8" ry="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <rect width="200" height="30" rx="8" ry="8" fill="#ec4899" opacity="0.2"/>
        <line x1="0" y1="30" x2="200" y2="30" stroke="#ec4899" stroke-width="1.5"/>
        <text x="15" y="20" class="table-title">SOCIAL_POSTS (Tin tức)</text>
        <text x="15" y="50" class="field pk">PK  Id : int</text>
        <text x="15" y="70" class="field fk">FK  AuthorId : int (Admin)</text>
        <text x="15" y="90" class="field">    Title : varchar</text>
        <text x="15" y="110" class="field">    Category : varchar</text>
        <text x="15" y="130" class="field">    Image : varchar</text>
        <text x="15" y="150" class="field">    Content : text</text>
        <text x="15" y="170" class="field">    Published : boolean</text>
        <text x="15" y="190" class="field">    CloudinaryStatus : varchar</text>
        <text x="15" y="210" class="field">    ViewCount : int</text>
        <text x="15" y="230" class="field">    LikesCount : int</text>
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

// 5a. State Diagram Phase 1
function getStateDiagramPhase1() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 400" width="900" height="400">
      <style>
        .title { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: bold; fill: #000000; }
        .state-name { font-family: 'Arial', sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
        .state-desc { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .trans-label { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .conn { stroke: #000000; stroke-width: 1.2; fill: none; }
        .conn-dash { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 3 3; fill: none; }
      </style>
      
      <!-- Background (White Canvas) -->
      <rect width="100%" height="100%" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      <text x="30" y="35" class="title">STATE DIAGRAM - PHASE 1: ĐỀ XUẤT &amp; XÉT DUYỆT ĐỀ TÀI</text>
      <rect x="730" y="18" width="140" height="24" rx="12" fill="#000000" opacity="0.05"/>
      <text x="800" y="33" fill="#000000" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">PROPOSAL STAGE</text>

      <!-- Connections -->
      <line x1="80" y1="160" x2="150" y2="160" class="conn" marker-end="url(#arrow)"/>
      <text x="115" y="150" class="trans-label" text-anchor="middle">create()</text>

      <line x1="310" y1="160" x2="420" y2="160" class="conn" marker-end="url(#arrow)"/>
      <text x="365" y="150" class="trans-label" text-anchor="middle">submit()</text>

      <line x1="510" y1="205" x2="510" y2="260" class="conn" marker-end="url(#arrow)"/>
      <text x="520" y="225" class="trans-label">reject()</text>

      <path d="M 420 300 H 230 V 205" class="conn-dash" marker-end="url(#arrow)"/>
      <text x="240" y="290" class="trans-label">edit()</text>

      <line x1="600" y1="160" x2="700" y2="160" class="conn" marker-end="url(#arrow)"/>
      <text x="650" y="150" class="trans-label" text-anchor="middle">approve()</text>

      <!-- States -->
      <!-- Start Circle -->
      <circle cx="70" cy="160" r="10" fill="#000000"/>

      <!-- DRAFT -->
      <g transform="translate(150, 125)">
        <rect width="160" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="80" y="25" class="state-name" text-anchor="middle">DRAFT</text>
        <line x1="0" y1="35" x2="160" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / createRecord()</text>
        <text x="10" y="75" class="state-desc">do / editMetadata()</text>
      </g>

      <!-- PENDING -->
      <g transform="translate(420, 115)">
        <rect width="180" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="90" y="25" class="state-name" text-anchor="middle">PENDING_REVIEW</text>
        <line x1="0" y1="35" x2="180" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / notifyCataloger()</text>
        <text x="10" y="75" class="state-desc">do / verifyCopyright()</text>
      </g>

      <!-- REJECTED -->
      <g transform="translate(420, 260)">
        <rect width="180" height="80" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="90" y="25" class="state-name" text-anchor="middle">REJECTED</text>
        <line x1="0" y1="35" x2="180" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / logErrors()</text>
      </g>

      <!-- IN_PROGRESS -->
      <g transform="translate(700, 115)">
        <rect width="150" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="75" y="25" class="state-name" text-anchor="middle">PUBLISHED</text>
        <line x1="0" y1="35" x2="150" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / indexElastic()</text>
        <text x="10" y="75" class="state-desc">do / enableAccess()</text>
      </g>

      <!-- Definitions -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
        </marker>
      </defs>
    </svg>
  `;
}

// 5b. State Diagram Phase 2
function getStateDiagramPhase2() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 450" width="900" height="450">
      <style>
        .title { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: bold; fill: #000000; }
        .state-name { font-family: 'Arial', sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
        .state-desc { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .trans-label { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .conn { stroke: #000000; stroke-width: 1.2; fill: none; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      <text x="30" y="35" class="title">STATE DIAGRAM - PHASE 2: VẬN HÀNH &amp; CẤP QUYỀN TRUY CẬP</text>
      <rect x="730" y="18" width="140" height="24" rx="12" fill="#000000" opacity="0.05"/>
      <text x="800" y="33" fill="#000000" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">ACCESS CONTROL</text>

      <!-- Connections -->
      <line x1="80" y1="160" x2="150" y2="160" class="conn" marker-end="url(#arrow)"/>

      <line x1="310" y1="160" x2="430" y2="160" class="conn" marker-end="url(#arrow)"/>

      <line x1="470" y1="160" x2="580" y2="160" class="conn" marker-end="url(#arrow)"/>
      <text x="525" y="150" class="trans-label" text-anchor="middle">[isConfidential]</text>

      <path d="M 450 180 V 315 H 580" class="conn" marker-end="url(#arrow)"/>
      <text x="460" y="240" class="trans-label">[isOutdated]</text>

      <path d="M 665 115 V 70 H 230 V 115" class="conn" marker-end="url(#arrow)"/>
      <text x="440" y="60" class="trans-label" text-anchor="middle">setPublic()</text>

      <line x1="665" y1="205" x2="665" y2="260" class="conn" marker-end="url(#arrow)"/>
      <text x="675" y="235" class="trans-label">deprecate()</text>

      <line x1="750" y1="305" x2="830" y2="305" class="conn" marker-end="url(#arrow)"/>
      <text x="790" y="295" class="trans-label" text-anchor="middle">archive()</text>

      <!-- States -->
      <!-- Start Circle -->
      <circle cx="70" cy="160" r="10" fill="#000000"/>

      <!-- PUBLISHED -->
      <g transform="translate(150, 115)">
        <rect width="160" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="80" y="25" class="state-name" text-anchor="middle">PUBLISHED</text>
        <line x1="0" y1="35" x2="160" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / indexElastic()</text>
        <text x="10" y="75" class="state-desc">do / enableAccess()</text>
      </g>

      <!-- Decision Guard Diamond -->
      <polygon points="450,140 470,160 450,180 430,160" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>

      <!-- RESTRICTED -->
      <g transform="translate(580, 115)">
        <rect width="170" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="85" y="25" class="state-name" text-anchor="middle">RESTRICTED</text>
        <line x1="0" y1="35" x2="170" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / disableAccess()</text>
        <text x="10" y="75" class="state-desc">do / showMetadataOnly()</text>
      </g>

      <!-- ARCHIVED -->
      <g transform="translate(580, 260)">
        <rect width="170" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="85" y="25" class="state-name" text-anchor="middle">ARCHIVED</text>
        <line x1="0" y1="35" x2="170" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / moveToColdStore()</text>
      </g>

      <!-- End State -->
      <g transform="translate(830, 295)">
        <circle cx="10" cy="10" r="10" fill="none" stroke="#000000" stroke-width="1.5"/>
        <circle cx="10" cy="10" r="6" fill="#000000"/>
      </g>

      <!-- Definitions -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
        </marker>
      </defs>
    </svg>
  `;
}

// 5c. State Diagram Phase 3
function getStateDiagramPhase3() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 480" width="1000" height="480">
      <style>
        .title { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: bold; fill: #000000; }
        .tab-text { font-family: 'Arial', sans-serif; font-size: 10px; font-weight: bold; fill: #000000; }
        .state-name { font-family: 'Arial', sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
        .state-desc { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .trans-label { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .conn { stroke: #000000; stroke-width: 1.2; fill: none; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      <text x="30" y="35" class="title">STATE DIAGRAM - PHASE 3: TIẾN TRÌNH XỬ LÝ TÀI LIỆU SỐ</text>
      <rect x="830" y="18" width="140" height="24" rx="12" fill="#000000" opacity="0.05"/>
      <text x="900" y="33" fill="#000000" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">FILE PROCESSING</text>

      <!-- Connections -->
      <line x1="60" y1="226" x2="120" y2="226" class="conn" marker-end="url(#arrow)"/>

      <!-- Inside Composite State Connections -->
      <line x1="190" y1="180" x2="240" y2="180" class="conn" marker-end="url(#arrow)"/>

      <line x1="360" y1="180" x2="420" y2="180" class="conn" marker-end="url(#arrow)"/>
      <text x="390" y="170" class="trans-label" text-anchor="middle">upload()</text>

      <line x1="560" y1="180" x2="620" y2="180" class="conn" marker-end="url(#arrow)"/>
      <text x="590" y="170" class="trans-label" text-anchor="middle">convertSuccess()</text>

      <line x1="695" y1="225" x2="695" y2="280" class="conn" marker-end="url(#arrow)"/>
      <text x="705" y="255" class="trans-label">scanSuccess()</text>

      <!-- Connection exiting composite state -->
      <line x1="770" y1="325" x2="860" y2="325" class="conn" marker-end="url(#arrow)"/>
      <text x="815" y="315" class="trans-label" text-anchor="middle">syncSuccess()</text>

      <!-- External Start Circle -->
      <circle cx="50" cy="226" r="10" fill="#000000"/>

      <!-- COMPOSITE STATE: FileProcessing -->
      <rect x="120" y="90" width="680" height="320" rx="12" ry="12" fill="none" stroke="#000000" stroke-width="1.5"/>
      <rect x="120" y="66" width="140" height="24" rx="4" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
      <text x="130" y="82" class="tab-text">FileProcessing</text>

      <!-- Inner Start Circle -->
      <circle cx="180" cy="180" r="10" fill="#000000"/>

      <!-- DRAFTING -->
      <g transform="translate(240, 135)">
        <rect width="120" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="60" y="25" class="state-name" text-anchor="middle">DRAFTING</text>
        <line x1="0" y1="35" x2="120" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / saveLocal()</text>
      </g>

      <!-- CONVERTING -->
      <g transform="translate(420, 135)">
        <rect width="140" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="70" y="25" class="state-name" text-anchor="middle">CONVERTING</text>
        <line x1="0" y1="35" x2="140" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">do / runLibreOffice()</text>
      </g>

      <!-- SCANNING -->
      <g transform="translate(620, 135)">
        <rect width="150" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="75" y="25" class="state-name" text-anchor="middle">SCANNING</text>
        <line x1="0" y1="35" x2="150" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">do / runGeminiScan()</text>
      </g>

      <!-- SYNCING -->
      <g transform="translate(620, 280)">
        <rect width="150" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="75" y="25" class="state-name" text-anchor="middle">SYNCING_DRIVE</text>
        <line x1="0" y1="35" x2="150" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">do / uploadToDrive()</text>
      </g>

      <!-- External Target State: ReadyForPublish -->
      <g transform="translate(860, 280)">
        <rect width="120" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="60" y="25" class="state-name" text-anchor="middle">READY</text>
        <line x1="0" y1="35" x2="120" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">do / setReadyFlag()</text>
      </g>

      <!-- Definitions -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
        </marker>
      </defs>
    </svg>
  `;
}

// 5d. State Diagram Phase 4
function getStateDiagramPhase4() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 950 400" width="950" height="400">
      <style>
        .title { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: bold; fill: #000000; }
        .state-name { font-family: 'Arial', sans-serif; font-size: 11px; font-weight: bold; fill: #000000; }
        .state-desc { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .trans-label { font-family: 'Arial', sans-serif; font-size: 9px; fill: #000000; }
        .conn { stroke: #000000; stroke-width: 1.2; fill: none; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      
      <!-- Header -->
      <rect width="100%" height="60" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      <text x="30" y="35" class="title">STATE DIAGRAM - PHASE 4: TRA CỨU &amp; TƯƠNG TÁC ĐỘC GIẢ</text>
      <rect x="780" y="18" width="140" height="24" rx="12" fill="#000000" opacity="0.05"/>
      <text x="850" y="33" fill="#000000" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">INTERACTION STAGE</text>

      <!-- Connections -->
      <line x1="80" y1="160" x2="150" y2="160" class="conn" marker-end="url(#arrow)"/>

      <line x1="280" y1="160" x2="360" y2="160" class="conn" marker-end="url(#arrow)"/>
      <text x="320" y="150" class="trans-label" text-anchor="middle">select()</text>

      <line x1="520" y1="160" x2="600" y2="160" class="conn" marker-end="url(#arrow)"/>
      <text x="560" y="150" class="trans-label" text-anchor="middle">bookmark()</text>

      <line x1="420" y1="205" x2="420" y2="260" class="conn" marker-end="url(#arrow)"/>
      <text x="410" y="235" class="trans-label" text-anchor="end">download()</text>

      <line x1="460" y1="260" x2="460" y2="205" class="conn" marker-end="url(#arrow)"/>
      <text x="470" y="235" class="trans-label" text-anchor="start">done()</text>

      <path d="M 680 115 V 75 H 440 V 115" class="conn" marker-end="url(#arrow)"/>
      <text x="560" y="65" class="trans-label" text-anchor="middle">view()</text>

      <path d="M 440 115 V 50 H 850 V 150" class="conn" marker-end="url(#arrow)"/>
      <text x="650" y="40" class="trans-label" text-anchor="middle">close()</text>

      <!-- States -->
      <!-- Start Circle -->
      <circle cx="70" cy="160" r="10" fill="#000000"/>

      <!-- AVAILABLE -->
      <g transform="translate(150, 115)">
        <rect width="130" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="65" y="25" class="state-name" text-anchor="middle">AVAILABLE</text>
        <line x1="0" y1="35" x2="130" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / logPublish()</text>
      </g>

      <!-- VIEWING -->
      <g transform="translate(360, 115)">
        <rect width="160" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="80" y="25" class="state-name" text-anchor="middle">VIEWING</text>
        <line x1="0" y1="35" x2="160" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / incViews()</text>
        <text x="10" y="75" class="state-desc">do / renderFlipbook()</text>
      </g>

      <!-- BOOKMARKED -->
      <g transform="translate(600, 115)">
        <rect width="160" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="80" y="25" class="state-name" text-anchor="middle">BOOKMARKED</text>
        <line x1="0" y1="35" x2="160" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / addToFavs()</text>
      </g>

      <!-- DOWNLOADING -->
      <g transform="translate(360, 260)">
        <rect width="160" height="90" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="80" y="25" class="state-name" text-anchor="middle">DOWNLOADING</text>
        <line x1="0" y1="35" x2="160" y2="35" stroke="#000000" stroke-width="1"/>
        <text x="10" y="55" class="state-desc">entry / logDownload()</text>
        <text x="10" y="75" class="state-desc">do / streamFile()</text>
      </g>

      <!-- End State -->
      <g transform="translate(840, 150)">
        <circle cx="10" cy="10" r="10" fill="none" stroke="#000000" stroke-width="1.5"/>
        <circle cx="10" cy="10" r="6" fill="#000000"/>
      </g>

      <!-- Definitions -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
        </marker>
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
    { name: 'state_diagram_phase1_proposal', content: getStateDiagramPhase1() },
    { name: 'state_diagram_phase2_plagiarism', content: getStateDiagramPhase2() },
    { name: 'state_diagram_phase3_sync_review', content: getStateDiagramPhase3() },
    { name: 'state_diagram_phase4_defense', content: getStateDiagramPhase4() }
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
