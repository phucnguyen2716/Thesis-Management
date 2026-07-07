const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { flows } = require('./generate_40_diagrams.js');

function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const actorColors = {
  "Sinh viên": "#a78bfa",        // purple
  "Giảng viên": "#f59e0b",       // orange
  "Admin": "#f87171",            // rose
  "Người dùng": "#e2e8f0",       // slate
  "Frontend": "#38bdf8",         // sky
  "Backend API": "#10b981",      // emerald
  "PostgreSQL DB": "#34d399",    // light emerald
  "Queue Service": "#818cf8",    // indigo
  "RabbitMQ Worker": "#f43f5e",   // rose dark
  "Drive Service": "#fb7185",     // rose light
  "LibreOffice Service": "#fbbf24", // amber
  "System OS": "#94a3b8",        // slate-400
  "Gemini AI API": "#c084fc",     // purple light
  "System Security": "#22d3ee",   // cyan
  "Hangfire Scheduler": "#fda4af", // rose light
  "Hangfire Worker": "#f43f5e"
};

// -------------------------------------------------------------
// CUSTOM FLOW 1: Auth flow with Decision & Loopback
// -------------------------------------------------------------
function generateFlow1SVG(flow) {
  const width = 600;
  const height = 550;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#f59e0b" opacity="0.15"/>
      <text x="510" y="28" fill="#f59e0b" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">COMPLEX DECISION</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      <text x="300" y="60" fill="#38bdf8" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">START</text>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 1: Input details -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Người dùng"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Người dùng"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">NGƯỜI DÙNG</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Nhập Email/Mật khẩu đăng nhập</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 2: Call Login API -->
      <g transform="translate(150, 200)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Backend API"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">BACKEND API</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">2. Gửi POST /api/auth/login &amp; Check BCrypt</text>
      </g>

      <line x1="300" y1="250" x2="300" y2="280" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(280, 280)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      </g>
      
      <!-- Loopback path (invalid credentials) -->
      <path d="M 280 300 H 90 V 145 H 150" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
      <text x="80" y="220" fill="#f43f5e" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" transform="rotate(-90 80 220)" text-anchor="middle">[SAI THÔNG TIN / KHÔNG HỢP LỆ]</text>

      <!-- Valid Credentials path -->
      <line x1="300" y1="320" x2="300" y2="360" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="310" y="345" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="900">[HỢP LỆ]</text>

      <!-- Step 3: Success -->
      <g transform="translate(150, 360)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Backend API"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">BACKEND API</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">3. Sinh JWT Token &amp; Lưu LocalStorage</text>
      </g>

      <line x1="300" y1="410" x2="300" y2="440" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 4: Redirect -->
      <g transform="translate(150, 440)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Frontend"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Frontend"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">FRONTEND</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">4. Đăng nhập thành công, chuyển hướng</text>
      </g>

      <line x1="300" y1="490" x2="300" y2="515" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      
      <circle cx="300" cy="525" r="12" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="525" r="7" fill="#f43f5e"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 5: Advisor approval with Decision branches
// -------------------------------------------------------------
function generateFlow5SVG(flow) {
  const width = 600;
  const height = 550;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#38bdf8" opacity="0.15"/>
      <text x="510" y="28" fill="#38bdf8" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">DECISION FLOW</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 1: Review -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Giảng viên"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Giảng viên"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">GIẢNG VIÊN HƯỚNG DẪN</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Xem xét hồ sơ đề xuất tại /requests</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(280, 200)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      </g>
      
      <!-- Branch: Rejected -->
      <path d="M 280 220 H 130 V 270" fill="none" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="200" y="212" fill="#f43f5e" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[TỪ CHỐI]</text>
      
      <g transform="translate(20, 270)">
        <rect width="220" height="60" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="15" y="20" fill="#f43f5e" font-size="7.5" font-weight="bold">STATUS = REJECTED</text>
        <text x="15" y="40" fill="#ffffff" font-size="10" font-weight="bold">Cập nhật Rejected &amp; ghi lý do</text>
      </g>

      <!-- Branch: Approved -->
      <path d="M 320 220 H 470 V 270" fill="none" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="400" y="212" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[PHÊ DUYỆT]</text>
      
      <g transform="translate(360, 270)">
        <rect width="220" height="60" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" fill="#10b981" font-size="7.5" font-weight="bold">STATUS = INPROGRESS</text>
        <text x="15" y="40" fill="#ffffff" font-size="10" font-weight="bold">Cập nhật InProgress &amp; ApprovedAt</text>
      </g>

      <!-- Merge Diamond -->
      <path d="M 130 330 V 380 H 280" fill="none" stroke="#64748b" stroke-width="1.5"/>
      <path d="M 470 330 V 380 H 320" fill="none" stroke="#64748b" stroke-width="1.5"/>
      
      <g transform="translate(280, 360)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
      </g>

      <line x1="300" y1="400" x2="300" y2="430" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Notification Action -->
      <g transform="translate(150, 430)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Backend API"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">BACKEND API</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">3. Lưu thông báo &amp; Đồng bộ trạng thái</text>
      </g>

      <line x1="300" y1="480" x2="300" y2="505" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <circle cx="300" cy="515" r="10" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="515" r="6" fill="#f43f5e"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 12: File Submission & Concurrency Fork/Join
// -------------------------------------------------------------
function generateFlow12SVG(flow) {
  const width = 600;
  const height = 550;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#a78bfa" opacity="0.15"/>
      <text x="510" y="28" fill="#a78bfa" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">FORK &amp; JOIN FLOW</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Input Step -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Sinh viên"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Sinh viên"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">SINH VIÊN</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Nộp bản thảo đồ án tốt nghiệp (.docx)</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="195" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- UML Fork Bar -->
      <rect x="80" y="195" width="440" height="8" fill="#000000" rx="3" stroke="#475569" stroke-width="1"/>

      <!-- Fork Arrow Left -->
      <path d="M 180 203 V 230" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <!-- Action Left: Sync to Drive -->
      <g transform="translate(30, 230)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="${actorColors["Drive Service"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["Drive Service"]}" font-size="7.5" font-weight="bold">DRIVE SERVICE</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Đồng bộ tự động &amp; Lưu record</text>
      </g>

      <!-- Fork Arrow Right -->
      <path d="M 420 203 V 230" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <!-- Action Right: Convert Docx to PDF -->
      <g transform="translate(330, 230)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="${actorColors["LibreOffice Service"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["LibreOffice Service"]}" font-size="7.5" font-weight="bold">LIBREOFFICE CONVERTER</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Convert Word sang PDF không đầu</text>
      </g>

      <!-- Path Left to Join -->
      <path d="M 150 290 V 335" fill="none" stroke="#64748b" stroke-width="2"/>
      <!-- Path Right to Join -->
      <path d="M 450 290 V 335" fill="none" stroke="#64748b" stroke-width="2"/>

      <!-- UML Join Bar -->
      <rect x="80" y="335" width="440" height="8" fill="#000000" rx="3" stroke="#475569" stroke-width="1"/>

      <!-- Arrow out of Join -->
      <path d="M 300 343 V 375" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Final Action -->
      <g transform="translate(150, 375)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Queue Service"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Queue Service"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">QUEUE SERVICE</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">Kích hoạt xếp hàng quét đạo văn</text>
      </g>

      <line x1="300" y1="425" x2="300" y2="455" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <circle cx="300" cy="465" r="10" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="465" r="6" fill="#f43f5e"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 21: Plagiarism Scan Fork & Branch
// -------------------------------------------------------------
function generateFlow21SVG(flow) {
  const width = 600;
  const height = 550;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#ec4899" opacity="0.15"/>
      <text x="510" y="28" fill="#ec4899" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">PLAGIARISM CHECK</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Input Step -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["RabbitMQ Worker"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["RabbitMQ Worker"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">RABBITMQ WORKER</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Trích xuất plain text từ file PDF nộp</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="195" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- UML Fork Bar -->
      <rect x="80" y="195" width="440" height="8" fill="#000000" rx="3" stroke="#475569" stroke-width="1"/>

      <!-- Fork Arrow Left -->
      <path d="M 180 203 V 230" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <!-- Action Left: Gemini AI API -->
      <g transform="translate(30, 230)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="${actorColors["Gemini AI API"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["Gemini AI API"]}" font-size="7.5" font-weight="bold">GEMINI AI SERVICE</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">So khớp tương đồng ngữ nghĩa</text>
      </g>

      <!-- Fork Arrow Right -->
      <path d="M 420 203 V 230" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <!-- Action Right: Local Search -->
      <g transform="translate(330, 230)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["Backend API"]}" font-size="7.5" font-weight="bold">LOCAL INDEX SEARCH (BM25)</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Quét thư viện đề tài nội bộ</text>
      </g>

      <!-- Path Left to Join -->
      <path d="M 150 290 V 335" fill="none" stroke="#64748b" stroke-width="2"/>
      <!-- Path Right to Join -->
      <path d="M 450 290 V 335" fill="none" stroke="#64748b" stroke-width="2"/>

      <!-- UML Join Bar -->
      <rect x="80" y="335" width="440" height="8" fill="#000000" rx="3" stroke="#475569" stroke-width="1"/>

      <!-- Arrow out of Join -->
      <path d="M 300 343 V 375" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Final Action -->
      <g transform="translate(150, 375)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["PostgreSQL DB"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["PostgreSQL DB"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">POSTGRESQL DB</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">Lưu PlagiarismReports &amp; Nguồn copy</text>
      </g>

      <line x1="300" y1="425" x2="300" y2="455" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <circle cx="300" cy="465" r="10" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="465" r="6" fill="#f43f5e"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 29: Advisor grading and Plagiarism Check flow
// -------------------------------------------------------------
function generateFlow29SVG(flow) {
  const width = 600;
  const height = 650;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#ec4899" opacity="0.15"/>
      <text x="510" y="28" fill="#ec4899" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">ADVISOR REVIEW</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      <text x="300" y="60" fill="#38bdf8" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">START</text>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 1: Phân tích Đồ án -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Giảng viên"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Giảng viên"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">GIẢNG VIÊN</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Phân tích Đồ án / Khóa luận</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 2: Tóm tắt & Check đạo văn -->
      <g transform="translate(150, 200)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Gemini AI API"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Gemini AI API"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">GEMINI AI / HỆ THỐNG</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">2. Dùng Gemini tóm tắt &amp; kiểm tra đạo văn</text>
      </g>

      <line x1="300" y1="250" x2="300" y2="280" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(280, 280)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      </g>
      
      <!-- Branch: High Plagiarism Rate (Right) -->
      <path d="M 320 300 H 460 V 340" fill="none" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="390" y="292" fill="#f43f5e" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">TỈ LỆ ĐẠO VĂN CAO</text>
      
      <!-- Step 3a: Check sources -->
      <g transform="translate(340, 340)">
        <rect width="230" height="60" rx="10" fill="#1e293b" stroke="${actorColors["Giảng viên"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["Giảng viên"]}" font-size="7.5" font-weight="bold">GIẢNG VIÊN</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Kiểm tra nguồn &amp; đồ án liên quan</text>
      </g>

      <line x1="455" y1="400" x2="455" y2="450" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 4a: Reject -->
      <g transform="translate(340, 450)">
        <rect width="230" height="60" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="15" y="20" fill="#f43f5e" font-size="7.5" font-weight="bold">GIẢNG VIÊN</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Từ chối và đưa ra lý do phù hợp</text>
      </g>

      <!-- Branch: Low Plagiarism Rate (Down) -->
      <line x1="300" y1="320" x2="300" y2="360" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="310" y="340" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="900">TỈ LỆ ĐẠO VĂN THẤP</text>

      <!-- Step 3b: Gemini suggest score -->
      <g transform="translate(30, 360)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="${actorColors["Gemini AI API"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["Gemini AI API"]}" font-size="7.5" font-weight="bold">GEMINI AI SERVICE</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Đề xuất điểm phù hợp cho đồ án</text>
      </g>

      <line x1="150" y1="420" x2="150" y2="450" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 4b: Update score -->
      <g transform="translate(30, 450)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="${actorColors["Giảng viên"]}" stroke-width="1.5"/>
        <text x="15" y="20" fill="${actorColors["Giảng viên"]}" font-size="7.5" font-weight="bold">GIẢNG VIÊN</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Cập nhật điểm vào hệ thống</text>
      </g>

      <!-- Merge path to End -->
      <path d="M 150 510 V 550 H 300" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M 455 510 V 550 H 300" fill="none" stroke="#64748b" stroke-width="2"/>

      <line x1="300" y1="550" x2="300" y2="580" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- End Node -->
      <circle cx="300" cy="595" r="12" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="595" r="7" fill="#f43f5e"/>
      <text x="300" y="625" fill="#f43f5e" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">END</text>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 32: Formatting evaluation & Word Count Check Loop
// -------------------------------------------------------------
function generateFlow32SVG(flow) {
  const width = 600;
  const height = 550;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#10b981" opacity="0.15"/>
      <text x="510" y="28" fill="#10b981" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">AI EVALUATION</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 1: Count words & check segments -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Backend API"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">BACKEND API</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Phân tách HTML, đếm từ &amp; check đề mục</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(280, 200)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      </g>

      <!-- Branch: Word Count or Chapters Missing -->
      <path d="M 280 220 H 130 V 270" fill="none" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="200" y="212" fill="#f43f5e" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[THIẾU ĐỀ MỤC / &lt;100 TỪ]</text>
      
      <g transform="translate(20, 270)">
        <rect width="220" height="60" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="15" y="20" fill="#f43f5e" font-size="7.5" font-weight="bold">ABORT EVALUATION</text>
        <text x="15" y="40" fill="#ffffff" font-size="10" font-weight="bold">Báo lỗi định dạng trực tiếp</text>
      </g>

      <!-- Branch: Format check passed -->
      <path d="M 320 220 H 470 V 270" fill="none" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="400" y="212" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[HỢP LỆ]</text>
      
      <g transform="translate(360, 270)">
        <rect width="220" height="60" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" fill="#10b981" font-size="7.5" font-weight="bold">CALL GEMINI API</text>
        <text x="15" y="40" fill="#ffffff" font-size="10" font-weight="bold">Phân tích lỗi chính tả &amp; ngữ pháp</text>
      </g>

      <!-- Merge Diamond -->
      <path d="M 130 330 V 380 H 280" fill="none" stroke="#64748b" stroke-width="1.5"/>
      <path d="M 470 330 V 380 H 320" fill="none" stroke="#64748b" stroke-width="1.5"/>
      
      <g transform="translate(280, 360)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
      </g>

      <line x1="300" y1="400" x2="300" y2="430" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Show Result -->
      <g transform="translate(150, 430)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Frontend"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Frontend"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">FRONTEND</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">3. Hiển thị modal lỗi &amp; Điểm số đánh giá</text>
      </g>

      <line x1="300" y1="480" x2="300" y2="505" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <circle cx="300" cy="515" r="10" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="515" r="6" fill="#f43f5e"/>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 39: Security Audit Log (Success / Fail Branch)
// -------------------------------------------------------------
function generateFlow39SVG(flow) {
  const width = 600;
  const height = 650;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#22d3ee" opacity="0.15"/>
      <text x="510" y="28" fill="#22d3ee" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">AUDIT LOG FLOW</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      <text x="300" y="60" fill="#38bdf8" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">START</text>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 1: Intercept Action -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["System Security"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["System Security"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">SYSTEM SECURITY</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Đánh giá hành động quản trị (Login/Delete)</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="200" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(280, 200)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      </g>
      
      <!-- Branch: Success (Left) -->
      <path d="M 280 220 H 150 V 270" fill="none" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="210" y="212" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[THÀNH CÔNG]</text>
      
      <g transform="translate(30, 270)">
        <rect width="230" height="60" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" fill="#10b981" font-size="7.5" font-weight="bold">LOG: SUCCESS = TRUE</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Ghi nhận thông tin &amp; IP kết nối</text>
      </g>

      <!-- Branch: Failure (Right) -->
      <path d="M 320 220 H 450 V 270" fill="none" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="390" y="212" fill="#f43f5e" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[THẤT BẠI / NGUY HIỂM]</text>
      
      <g transform="translate(340, 270)">
        <rect width="230" height="60" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="15" y="20" fill="#f43f5e" font-size="7.5" font-weight="bold">LOG: SUCCESS = FALSE</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Cảnh cáo đỏ &amp; ghi vết xâm nhập</text>
      </g>

      <!-- Merge Diamond -->
      <path d="M 145 330 V 380 H 280" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M 455 330 V 380 H 320" fill="none" stroke="#64748b" stroke-width="2"/>
      
      <g transform="translate(280, 360)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
      </g>

      <line x1="300" y1="400" x2="300" y2="430" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Save DB -->
      <g transform="translate(150, 430)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["PostgreSQL DB"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["PostgreSQL DB"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">POSTGRESQL DB</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">2. Lưu bản ghi vào bảng AuditLogs</text>
      </g>

      <line x1="300" y1="480" x2="300" y2="510" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Dashboard View -->
      <g transform="translate(150, 510)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Admin"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Admin"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">ADMINISTRATOR</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">3. Admin truy cập /audit &amp; xem log bảng</text>
      </g>

      <line x1="300" y1="560" x2="300" y2="585" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <circle cx="300" cy="595" r="12" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="595" r="7" fill="#f43f5e"/>
      <text x="300" y="625" fill="#f43f5e" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">END</text>
    </svg>
  `;
}

// -------------------------------------------------------------
// CUSTOM FLOW 40: Docker Container Status Monitoring (Fork/Join/Decision)
// -------------------------------------------------------------
function generateFlow40SVG(flow) {
  const width = 600;
  const height = 650;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#818cf8" opacity="0.15"/>
      <text x="510" y="28" fill="#818cf8" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">MONITORING FLOW</text>

      <!-- Start -->
      <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
      
      <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Input Step -->
      <g transform="translate(150, 120)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Admin"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Admin"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">ADMINISTRATOR</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">1. Admin truy cập Tab Vận hành</text>
      </g>

      <line x1="300" y1="170" x2="300" y2="195" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- UML Fork Bar -->
      <rect x="30" y="195" width="540" height="8" fill="#000000" rx="3" stroke="#475569" stroke-width="1"/>

      <!-- Fork Arrow 1 -->
      <path d="M 95 203 V 220" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <g transform="translate(40, 220)">
        <rect width="110" height="50" rx="8" fill="#1e293b" stroke="${actorColors["PostgreSQL DB"]}" stroke-width="1.5"/>
        <text x="55" y="22" fill="${actorColors["PostgreSQL DB"]}" font-size="7.5" font-weight="bold" text-anchor="middle">DATABASE</text>
        <text x="55" y="37" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle">Ping Port 5432</text>
      </g>

      <!-- Fork Arrow 2 -->
      <path d="M 225 203 V 220" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <g transform="translate(170, 220)">
        <rect width="110" height="50" rx="8" fill="#1e293b" stroke="${actorColors["Queue Service"]}" stroke-width="1.5"/>
        <text x="55" y="22" fill="${actorColors["Queue Service"]}" font-size="7.5" font-weight="bold" text-anchor="middle">RABBITMQ</text>
        <text x="55" y="37" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle">Ping Port 5672</text>
      </g>

      <!-- Fork Arrow 3 -->
      <path d="M 355 203 V 220" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <g transform="translate(300, 220)">
        <rect width="110" height="50" rx="8" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="1.5"/>
        <text x="55" y="22" fill="${actorColors["Backend API"]}" font-size="7.5" font-weight="bold" text-anchor="middle">ELASTICSEARCH</text>
        <text x="55" y="37" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle">Ping Port 9200</text>
      </g>

      <!-- Fork Arrow 4 -->
      <path d="M 485 203 V 220" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <g transform="translate(430, 220)">
        <rect width="110" height="50" rx="8" fill="#1e293b" stroke="${actorColors["System OS"]}" stroke-width="1.5"/>
        <text x="55" y="22" fill="${actorColors["System OS"]}" font-size="7.5" font-weight="bold" text-anchor="middle">MEDIA API</text>
        <text x="55" y="37" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle">Ping Port 5145</text>
      </g>

      <!-- Paths to Join -->
      <path d="M 95 270 V 300" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M 225 270 V 300" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M 355 270 V 300" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M 485 270 V 300" fill="none" stroke="#64748b" stroke-width="2"/>

      <!-- UML Join Bar -->
      <rect x="30" y="300" width="540" height="8" fill="#000000" rx="3" stroke="#475569" stroke-width="1"/>

      <!-- Arrow out of Join -->
      <path d="M 300 308 V 335" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Process Result -->
      <g transform="translate(150, 335)">
        <rect width="300" height="50" rx="12" ry="12" fill="#1e293b" stroke="${actorColors["Backend API"]}" stroke-width="2"/>
        <text x="20" y="18" fill="${actorColors["Backend API"]}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900">BACKEND API</text>
        <text x="20" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">Tổng hợp trạng thái các container</text>
      </g>

      <line x1="300" y1="385" x2="300" y2="415" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Decision Diamond -->
      <g transform="translate(280, 415)">
        <polygon points="20,0 40,20 20,40 0,20" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      </g>

      <!-- Branch: All Online (Left) -->
      <path d="M 280 435 H 150 V 470" fill="none" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="210" y="427" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[TẤT CẢ ONLINE]</text>
      
      <g transform="translate(30, 470)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/>
        <text x="15" y="20" fill="#10b981" font-size="7.5" font-weight="bold">SYSTEM HEALTHY</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Hiển thị dashboard trạng thái xanh</text>
      </g>

      <!-- Branch: Any Offline (Right) -->
      <path d="M 320 435 H 450 V 470" fill="none" stroke="#f43f5e" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="390" y="427" fill="#f43f5e" font-size="9" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">[CÓ CONTAINER SỰ CỐ]</text>
      
      <g transform="translate(330, 470)">
        <rect width="240" height="60" rx="10" fill="#1e293b" stroke="#f43f5e" stroke-width="1.5"/>
        <text x="15" y="20" fill="#f43f5e" font-size="7.5" font-weight="bold">ALERT DISPATCHED</text>
        <text x="15" y="40" fill="#ffffff" font-size="9.5" font-weight="bold">Nhấp nháy đỏ &amp; Gửi thông báo sự cố</text>
      </g>

      <!-- Merge path to End -->
      <path d="M 150 530 V 570 H 300" fill="none" stroke="#64748b" stroke-width="2"/>
      <path d="M 450 530 V 570 H 300" fill="none" stroke="#64748b" stroke-width="2"/>

      <line x1="300" y1="570" x2="300" y2="590" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- End Node -->
      <circle cx="300" cy="602" r="12" fill="none" stroke="#f43f5e" stroke-width="2"/>
      <circle cx="300" cy="602" r="7" fill="#f43f5e"/>
      <text x="300" y="632" fill="#f43f5e" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">END</text>
    </svg>
  `;
}

// -------------------------------------------------------------
// STANDARD FLOW: Generic Vertical Activity Diagram Flowchart
// -------------------------------------------------------------
function generateActivitySVG(flow) {
  const width = 600;
  const height = 110 + (flow.steps.length * 90) + 70;
  const boxWidth = 320;
  const boxHeight = 50;

  let stepsSVG = '';
  let arrowsSVG = '';
  
  // Start Node (UML Solid circle)
  stepsSVG += `
    <!-- Start Node -->
    <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
    <text x="300" y="60" fill="#38bdf8" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">START</text>
  `;
  
  // Arrow from start to first step
  arrowsSVG += `
    <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
  `;

  flow.steps.forEach((step, idx) => {
    const y = 120 + idx * 90;
    const color = actorColors[step.actor] || "#10b981";
    
    // Step box (UML Action State)
    stepsSVG += `
      <g transform="translate(${300 - boxWidth/2}, ${y})">
        <!-- Action Glow Shadow -->
        <rect width="${boxWidth}" height="${boxHeight}" rx="12" ry="12" fill="#1e293b" stroke="${color}" stroke-width="2" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));"/>
        
        <!-- Step Number badge -->
        <circle cx="18" cy="25" r="9" fill="${color}" opacity="0.2"/>
        <circle cx="18" cy="25" r="7" fill="${color}"/>
        <text x="18" y="28" fill="#0f172a" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">${idx + 1}</text>
        
        <!-- Actor name indicator -->
        <text x="38" y="16" fill="${color}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900" style="text-transform: uppercase; letter-spacing: 0.5px;">${escapeXML(step.actor)}</text>
        
        <!-- Action Text -->
        <text x="38" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">${escapeXML(step.text)}</text>
      </g>
    `;
    
    // Connective Flow Arrows (UML Control Flow)
    if (idx < flow.steps.length - 1) {
      arrowsSVG += `
        <line x1="300" y1="${y + boxHeight}" x2="300" y2="${y + 90}" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      `;
    } else {
      const endY = y + boxHeight + 45;
      arrowsSVG += `
        <line x1="300" y1="${y + boxHeight}" x2="300" y2="${endY - 14}" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      `;
      // End Node (UML Double circle)
      stepsSVG += `
        <!-- End Node -->
        <circle cx="300" cy="${endY}" r="14" fill="none" stroke="#f43f5e" stroke-width="2"/>
        <circle cx="300" cy="${endY}" r="8" fill="#f43f5e"/>
        <text x="300" y="${endY + 28}" fill="#f43f5e" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">END</text>
      `;
    }
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <!-- Marker for control flow arrowheads -->
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      
      <!-- Premium Canvas Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Top Swimlane/Process Title Block -->
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#38bdf8" opacity="0.15"/>
      <text x="510" y="28" fill="#38bdf8" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">ACTIVITY FLOW</text>
      
      ${arrowsSVG}
      ${stepsSVG}
      
      <!-- Footer Copyright Label -->
      <text x="300" y="${height - 15}" fill="#475569" font-size="8" font-family="Inter, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1.5">UEF ETHESIS PORTAL DIAGRAM GENERATOR</text>
    </svg>
  `;
}

async function generateAll() {
  const outputDir = path.join(__dirname, '..', 'flows', 'activity_diagram');
  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads', 'activity_diagram');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`Starting generation of 40 technical UML Activity Diagrams...`);

  for (const flow of flows) {
    try {
      let svgContent;
      
      // Select appropriate renderer based on flow type
      if (flow.id === 1) {
        svgContent = generateFlow1SVG(flow);
      } else if (flow.id === 5) {
        svgContent = generateFlow5SVG(flow);
      } else if (flow.id === 12) {
        svgContent = generateFlow12SVG(flow);
      } else if (flow.id === 21) {
        svgContent = generateFlow21SVG(flow);
      } else if (flow.id === 29) {
        svgContent = generateFlow29SVG(flow);
      } else if (flow.id === 32) {
        svgContent = generateFlow32SVG(flow);
      } else if (flow.id === 39) {
        svgContent = generateFlow39SVG(flow);
      } else if (flow.id === 40) {
        svgContent = generateFlow40SVG(flow);
      } else {
        svgContent = generateActivitySVG(flow);
      }

      const fileName = `flow_${flow.id}`;
      
      const svgPath = path.join(outputDir, `${fileName}.svg`);
      const pngPath = path.join(outputDir, `${fileName}.png`);
      
      const dlSvgPath = path.join(downloadsDir, `${fileName}.svg`);
      const dlPngPath = path.join(downloadsDir, `${fileName}.png`);

      // 1. Write SVG file
      fs.writeFileSync(svgPath, svgContent);
      fs.writeFileSync(dlSvgPath, svgContent);
      
      // 2. Convert to PNG using sharp
      const svgBuffer = Buffer.from(svgContent);
      await sharp(svgBuffer)
        .png()
        .toFile(pngPath);
        
      await sharp(svgBuffer)
        .png()
        .toFile(dlPngPath);

      console.log(`[Generated] Activity Flow ${flow.id}: ${flow.title}`);
    } catch (err) {
      console.error(`Error generating diagram for flow ${flow.id}:`, err);
    }
  }

  console.log(`Successfully generated 40 Activity Diagrams in flows/activity_diagram directory!`);
}

generateAll();
