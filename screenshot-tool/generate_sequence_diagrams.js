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

const sequenceFlows = [
  {
    id: 1,
    title: "1. Đăng nhập và xác thực tài khoản độc giả (Login Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Nhập email & mật khẩu" },
      { from: "front", to: "api", text: "2. POST /api/auth/login" },
      { from: "api", to: "db", text: "3. Query User & check BCrypt" },
      { from: "db", to: "api", text: "4. Trả về thông tin User", isReturn: true },
      { from: "api", to: "api", text: "5. Sinh mã JWT token", isSelf: true },
      { from: "api", to: "front", text: "6. Trả JWT token", isReturn: true },
      { from: "front", to: "user", text: "7. Đăng nhập thành công", isReturn: true }
    ]
  },
  {
    id: 2,
    title: "2. Đăng xuất tài khoản độc giả (Logout Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Bấm nút Đăng xuất" },
      { from: "front", to: "front", text: "2. Xóa token khỏi LocalStorage", isSelf: true },
      { from: "front", to: "user", text: "3. Chuyển hướng về trang login", isReturn: true }
    ]
  },
  {
    id: 3,
    title: "3. Tìm kiếm khóa luận bằng Elasticsearch (Search Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "elastic", name: "Elasticsearch" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Nhập từ khóa tại LookupPage" },
      { from: "front", to: "api", text: "2. GET /api/theses/search?q=..." },
      { from: "api", to: "elastic", text: "3. Query full-text index" },
      { from: "elastic", to: "api", text: "4. Trả kết quả tìm kiếm", isReturn: true },
      { from: "api", to: "front", text: "5. Trả danh sách khóa luận", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị kết quả lên giao diện", isReturn: true }
    ]
  },
  {
    id: 4,
    title: "4. Lọc khóa luận theo Chuyên ngành & Giảng viên (Filter Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Chọn lọc Major/GVHD" },
      { from: "front", to: "api", text: "2. GET /api/theses?major=..." },
      { from: "api", to: "db", text: "3. Query Postgres lọc DB" },
      { from: "db", to: "api", text: "4. Trả danh sách bản ghi", isReturn: true },
      { from: "api", to: "front", text: "5. Trả kết quả lọc", isReturn: true },
      { from: "front", to: "user", text: "6. Cập nhật giao diện hiển thị", isReturn: true }
    ]
  },
  {
    id: 5,
    title: "5. Xem chi tiết thông tin khóa luận (Thesis Detail Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Click chọn khóa luận" },
      { from: "front", to: "api", text: "2. GET /api/theses/{id}" },
      { from: "api", to: "db", text: "3. Truy vấn Metadata & Abstract" },
      { from: "db", to: "api", text: "4. Trả thông tin chi tiết", isReturn: true },
      { from: "api", to: "front", text: "5. Trả dữ liệu JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị trang chi tiết", isReturn: true }
    ]
  },
  {
    id: 6,
    title: "6. Đọc trực tuyến bằng Flipbook 3D (Read Flipbook Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "drive", name: "Google Drive" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Bấm 'Đọc trực tuyến'" },
      { from: "front", to: "api", text: "2. GET /api/theses/{id}/pdf-link" },
      { from: "api", to: "drive", text: "3. Lấy link stream tài liệu" },
      { from: "drive", to: "api", text: "4. Trả link URL tạm thời", isReturn: true },
      { from: "api", to: "front", text: "5. Trả link PDF", isReturn: true },
      { from: "front", to: "front", text: "6. Khởi tạo Flipbook 3D", isSelf: true },
      { from: "front", to: "user", text: "7. Render giao diện lật trang", isReturn: true }
    ]
  },
  {
    id: 7,
    title: "7. Tải file tài liệu PDF gốc về máy (Download PDF Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "drive", name: "Google Drive" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Bấm 'Tải báo cáo'" },
      { from: "front", to: "api", text: "2. GET /api/theses/{id}/download" },
      { from: "api", to: "api", text: "3. Kiểm tra quyền download", isSelf: true },
      { from: "api", to: "drive", text: "4. Stream file PDF từ Drive" },
      { from: "drive", to: "api", text: "5. Trả file stream", isReturn: true },
      { from: "api", to: "front", text: "6. Stream file về client", isReturn: true },
      { from: "front", to: "user", text: "7. Tải file PDF về máy", isReturn: true }
    ]
  },
  {
    id: 8,
    title: "8. Đánh dấu lưu tài liệu yêu thích (Add Favorite Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Bấm nút hình Trái tim" },
      { from: "front", to: "api", text: "2. POST /api/favorites?id=..." },
      { from: "api", to: "db", text: "3. Insert bản ghi vào bảng Favorites" },
      { from: "db", to: "api", text: "4. Xác nhận lưu thành công", isReturn: true },
      { from: "api", to: "front", text: "5. Trả mã trạng thái 201", isReturn: true },
      { from: "front", to: "user", text: "6. Đổi màu biểu tượng Trái tim", isReturn: true }
    ]
  },
  {
    id: 9,
    title: "9. Xem danh sách tài liệu đã lưu (View Favorites Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Vào FavoritesPage" },
      { from: "front", to: "api", text: "2. GET /api/favorites" },
      { from: "api", to: "db", text: "3. Query các khóa luận đã lưu" },
      { from: "db", to: "api", text: "4. Trả danh sách khóa luận", isReturn: true },
      { from: "api", to: "front", text: "5. Trả dữ liệu JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị lưới tài liệu lưu", isReturn: true }
    ]
  },
  {
    id: 10,
    title: "10. Chia sẻ liên kết tài liệu (Share Link Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Bấm nút 'Chia sẻ'" },
      { from: "front", to: "front", text: "2. Copy URL vào Clipboard", isSelf: true },
      { from: "front", to: "user", text: "3. Hiển thị thông báo thành công", isReturn: true }
    ]
  },
  {
    id: 11,
    title: "11. Xem hồ sơ học tập cá nhân độc giả (Profile Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Vào mục Profile cá nhân" },
      { from: "front", to: "api", text: "2. GET /api/profile" },
      { from: "api", to: "db", text: "3. Tải ngành học & niên khóa" },
      { from: "db", to: "api", text: "4. Trả dữ liệu người dùng", isReturn: true },
      { from: "api", to: "front", text: "5. Trả thông tin Profile JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị thông tin cá nhân", isReturn: true }
    ]
  },
  {
    id: 12,
    title: "12. Phân tích sở thích đọc (Interest Profile Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Mở trang thống kê sở thích" },
      { from: "front", to: "front", text: "2. Đếm lượt xem/tải theo tags", isSelf: true },
      { from: "front", to: "front", text: "3. Tính tỷ lệ chuyên ngành", isSelf: true },
      { from: "front", to: "user", text: "4. Vẽ biểu đồ tròn phân tích", isReturn: true }
    ]
  },
  {
    id: 13,
    title: "13. Gợi ý khóa luận thông minh (Recommendation Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "elastic", name: "Elasticsearch" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Mở trang yêu thích/gợi ý" },
      { from: "front", to: "api", text: "2. GET /api/theses/recommend" },
      { from: "api", to: "elastic", text: "3. Query matching tags & major" },
      { from: "elastic", to: "api", text: "4. Trả tài liệu tương đồng", isReturn: true },
      { from: "api", to: "front", text: "5. Trả danh sách đề xuất", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị tài liệu đề xuất", isReturn: true }
    ]
  },
  {
    id: 14,
    title: "14. Tra cứu tài liệu theo Giảng viên hướng dẫn (Advisor Theses Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Click chọn tên Giảng viên" },
      { from: "front", to: "api", text: "2. GET /api/theses?advisorId=..." },
      { from: "api", to: "db", text: "3. Query các khóa luận của Advisor" },
      { from: "db", to: "api", text: "4. Trả danh sách khóa luận", isReturn: true },
      { from: "api", to: "front", text: "5. Trả dữ liệu JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị danh sách đề tài của GV", isReturn: true }
    ]
  },
  {
    id: 15,
    title: "15. Xem hướng dẫn sử dụng thư viện (Guidelines Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Vào mục Hướng dẫn (Guidelines)" },
      { from: "front", to: "front", text: "2. Tải & render markdown file", isSelf: true },
      { from: "front", to: "user", text: "3. Hiển thị bài hướng dẫn tra cứu", isReturn: true }
    ]
  },
  {
    id: 16,
    title: "16. Hỏi đáp tìm kiếm qua Chatbot AI (Chatbot AI Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "gemini", name: "Gemini AI" },
      { id: "elastic", name: "Elasticsearch" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Gửi câu hỏi tìm kiếm" },
      { from: "front", to: "api", text: "2. POST /api/chatbot/query" },
      { from: "api", to: "gemini", text: "3. Gửi câu hỏi phân tích từ khóa" },
      { from: "gemini", to: "api", text: "4. Trả từ khóa đề xuất", isReturn: true },
      { from: "api", to: "elastic", text: "5. Search tài liệu trong index" },
      { from: "elastic", to: "api", text: "6. Trả kết quả tìm kiếm", isReturn: true },
      { from: "api", to: "front", text: "7. Trả phản hồi kèm link đề xuất", isReturn: true },
      { from: "front", to: "user", text: "8. Hiển thị phản hồi Chatbot", isReturn: true }
    ]
  },
  {
    id: 17,
    title: "17. Gửi yêu cầu hỗ trợ tài liệu lên thủ thư (Support Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" },
      { id: "email", name: "Email Service" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Gửi form liên hệ thủ thư" },
      { from: "front", to: "api", text: "2. POST /api/support" },
      { from: "api", to: "db", text: "3. Insert bản ghi SupportRequest" },
      { from: "db", to: "api", text: "4. Xác nhận thành công", isReturn: true },
      { from: "api", to: "email", text: "5. Gửi email thông báo thủ thư" },
      { from: "email", to: "api", text: "6. Xác nhận đã gửi mail", isReturn: true },
      { from: "api", to: "front", text: "7. Trả mã trạng thái 200", isReturn: true },
      { from: "front", to: "user", text: "8. Báo gửi yêu cầu thành công", isReturn: true }
    ]
  },
  {
    id: 18,
    title: "18. Lịch hoạt động thư viện số (View Schedule Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Click chọn Lịch hoạt động" },
      { from: "front", to: "api", text: "2. GET /api/schedule" },
      { from: "api", to: "db", text: "3. Tải danh sách sự kiện" },
      { from: "db", to: "api", text: "4. Trả dữ liệu sự kiện", isReturn: true },
      { from: "api", to: "front", text: "5. Trả danh sách JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị sự kiện lên lịch", isReturn: true }
    ]
  },
  {
    id: 19,
    title: "19. Xem tin tức học thuật mới xuất bản (News List Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Xem trang chủ tin tức" },
      { from: "front", to: "api", text: "2. GET /api/news" },
      { from: "api", to: "db", text: "3. Query bài viết tin tức mới" },
      { from: "db", to: "api", text: "4. Trả danh sách bài viết", isReturn: true },
      { from: "api", to: "front", text: "5. Trả dữ liệu JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị lưới tin tức", isReturn: true }
    ]
  },
  {
    id: 20,
    title: "20. Xem chi tiết một bài viết tin tức (News Detail Sequence)",
    lifelines: [
      { id: "user", name: "Độc giả", isActor: true },
      { id: "front", name: "Frontend Client" },
      { id: "api", name: "Backend API" },
      { id: "db", name: "PostgreSQL DB" }
    ],
    messages: [
      { from: "user", to: "front", text: "1. Click bài viết chỉ định" },
      { from: "front", to: "api", text: "2. GET /api/news/{id}" },
      { from: "api", to: "db", text: "3. Tải nội dung bài viết tin tức" },
      { from: "db", to: "api", text: "4. Trả nội dung chi tiết", isReturn: true },
      { from: "api", to: "front", text: "5. Trả dữ liệu JSON", isReturn: true },
      { from: "front", to: "user", text: "6. Hiển thị bài viết đầy đủ", isReturn: true }
    ]
  }
];

function generateSVG(diag) {
  const width = 1000;
  const height = 480;
  const lifelinesCount = diag.lifelines.length;
  
  const boxWidth = 140;
  const boxHeight = 36;
  const startX = 80;
  
  const gap = (width - 160 - (lifelinesCount * boxWidth)) / (lifelinesCount - 1 || 1);

  // Lifelines map for coordinates
  const lifelineXMap = {};
  const lifelineNames = {};
  
  diag.lifelines.forEach((ll, idx) => {
    const x = startX + idx * (boxWidth + gap);
    lifelineXMap[ll.id] = x + boxWidth / 2;
    lifelineNames[ll.id] = ll.name;
  });

  // Render Lifelines (Header Box & Line)
  const lifelinesSVG = diag.lifelines.map((ll, idx) => {
    const x = startX + idx * (boxWidth + gap);
    const cx = x + boxWidth / 2;
    
    return `
      <!-- Lifeline ${ll.id} -->
      <g>
        <!-- Lifeline box -->
        <rect x="${x}" y="70" width="${boxWidth}" height="${boxHeight}" rx="4" ry="4" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <text x="${cx}" y="92" fill="#000000" font-size="9.5" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">${escapeXML(ll.name)}</text>
        
        <!-- Dashed line -->
        <line x1="${cx}" y1="106" x2="${cx}" y2="430" stroke="#000000" stroke-dasharray="4 4" stroke-width="1"/>
      </g>
    `;
  }).join('\n');

  // Draw activation boxes
  const activationBarsSVG = diag.lifelines.map((ll) => {
    if (ll.isActor) return ''; 
    const cx = lifelineXMap[ll.id];
    return `<rect x="${cx - 6}" y="120" width="12" height="295" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>`;
  }).join('\n');

  // Render Messages
  let messagesSVG = '';
  let currentY = 135;
  const ySpacing = 38;

  diag.messages.forEach((msg) => {
    const x1 = lifelineXMap[msg.from];
    const x2 = lifelineXMap[msg.to];
    const isReturn = msg.isReturn || false;
    const isSelf = msg.isSelf || false;

    if (isSelf) {
      // Draw self loop
      messagesSVG += `
        <!-- Self message on ${msg.from} -->
        <path d="M ${x1 + 6} ${currentY} H ${x1 + 50} V ${currentY + 20} H ${x1 + 6}" fill="none" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
        <text x="${x1 + 56}" y="${currentY + 14}" fill="#000000" font-size="8.5" font-family="Arial, sans-serif" text-anchor="start">${escapeXML(msg.text)}</text>
      `;
      currentY += ySpacing + 5;
    } else {
      const isLeftToRight = x1 < x2;
      const startXLoc = isLeftToRight ? x1 + 6 : x1 - 6;
      const endXLoc = isLeftToRight ? x2 - 6 : x2 + 6;
      const textX = (x1 + x2) / 2;
      
      const lineStyle = isReturn ? 'stroke-dasharray="3 3"' : '';

      messagesSVG += `
        <!-- Message from ${msg.from} to ${msg.to} -->
        <line x1="${startXLoc}" y1="${currentY}" x2="${endXLoc}" y2="${currentY}" stroke="#000000" stroke-width="1.2" ${lineStyle} marker-end="url(#arrow)"/>
        <text x="${textX}" y="${currentY - 6}" fill="#000000" font-size="8.5" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">${escapeXML(msg.text)}</text>
      `;
      currentY += ySpacing;
    }
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <!-- Marker for right arrows (Standard UML Style) -->
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
        </marker>
      </defs>
      
      <!-- Background (White Canvas) -->
      <rect width="100%" height="100%" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      
      <!-- Header Title -->
      <rect x="0" y="0" width="100%" height="55" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="16"/>
      <text x="30" y="34" fill="#000000" font-size="13" font-family="Arial, sans-serif" font-weight="bold" style="text-transform: uppercase;">${escapeXML(diag.title)}</text>
      
      <!-- Flow Category Tag -->
      <rect x="830" y="16" width="140" height="24" rx="12" fill="#000000" opacity="0.05"/>
      <text x="900" y="31" fill="#000000" font-size="8.5" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="0.5">SEQUENCE DIAGRAM</text>

      <!-- Lifelines Background Dashed Lines -->
      ${lifelinesSVG}
      
      <!-- Activation Bars -->
      ${activationBarsSVG}

      <!-- Messages & Returns -->
      ${messagesSVG}
      
      <!-- Footer Brand -->
      <text x="500" y="460" fill="#64748b" font-size="8" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1">UEF ETHESIS PORTAL - DIGITAL LIBRARY SEQUENCE FLOWS</text>
    </svg>
  `;
}

// Main execution function
async function generateAll() {
  const outputDir = path.join(__dirname, '..', 'flows');
  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads', 'flows');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`Starting generation of 20 technical sequence diagrams...`);

  for (const diag of sequenceFlows) {
    try {
      const svgContent = generateSVG(diag);
      const fileName = `sequence_${diag.id}`;
      
      const svgPath = path.join(outputDir, `${fileName}.svg`);
      const pngPath = path.join(outputDir, `${fileName}.png`);
      
      const dlSvgPath = path.join(downloadsDir, `${fileName}.svg`);
      const dlPngPath = path.join(downloadsDir, `${fileName}.png`);

      // Write SVGs
      fs.writeFileSync(svgPath, svgContent);
      fs.writeFileSync(dlSvgPath, svgContent);

      // Convert to PNGs using sharp
      const svgBuffer = Buffer.from(svgContent);
      await sharp(svgBuffer)
        .png()
        .toFile(pngPath);

      await sharp(svgBuffer)
        .png()
        .toFile(dlPngPath);

      console.log(`[Generated] Sequence Diagram ${diag.id}: ${diag.title}`);
    } catch (err) {
      console.error(`Error generating diagram for sequence ${diag.id}:`, err);
    }
  }

  console.log(`Successfully generated 20 sequence diagrams (both SVG and PNG)!`);
}

generateAll();
