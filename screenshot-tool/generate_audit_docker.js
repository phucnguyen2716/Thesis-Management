const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
  "Admin": "#f87171",            // rose
  "Backend API": "#10b981",      // emerald
  "PostgreSQL DB": "#34d399",    // light emerald
  "Queue Service": "#818cf8",    // indigo
  "System OS": "#94a3b8",        // slate-400
  "System Security": "#22d3ee"   // cyan
};

// -------------------------------------------------------------
// CUSTOM FLOW 39: Security Audit Log (Success / Fail Branch)
// -------------------------------------------------------------
function generateFlow39SVG() {
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
      <text x="25" y="30" class="title">LUỒNG 39: ADMIN THEO DÕI LOG ĐĂNG NHẬP (AUDIT LOGS)</text>
      
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
function generateFlow40SVG() {
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
      <text x="25" y="30" class="title">LUỒNG 40: ADMIN KIỂM TRA TRẠNG THÁI DỊCH VỤ DOCKER</text>
      
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

async function run() {
  const outputDir = path.join(__dirname, '..', 'flows', 'activity_diagram');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate Flow 39
  const svg39 = generateFlow39SVG();
  fs.writeFileSync(path.join(outputDir, 'flow_39.svg'), svg39);
  await sharp(Buffer.from(svg39)).png().toFile(path.join(outputDir, 'flow_39.png'));
  console.log('Flow 39 generated successfully.');

  // Generate Flow 40
  const svg40 = generateFlow40SVG();
  fs.writeFileSync(path.join(outputDir, 'flow_40.svg'), svg40);
  await sharp(Buffer.from(svg40)).png().toFile(path.join(outputDir, 'flow_40.png'));
  console.log('Flow 40 generated successfully.');
}

run().catch(console.error);
