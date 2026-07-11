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

const flows = [
  {
    id: 1,
    title: "1. Đăng nhập và xác thực tài khoản độc giả",
    steps: [
      { actor: "Sinh viên/Thủ thư", text: "Nhập email & mật khẩu tại trang đăng nhập" },
      { actor: "Frontend client", text: "Gửi request POST /api/auth/login" },
      { actor: "Backend API", text: "Kiểm tra Hash mật khẩu BCrypt trong Database" },
      { actor: "Backend API", text: "Trả về JWT token chứa quyền truy cập" },
      { actor: "Frontend client", text: "Lưu token vào LocalStorage & chuyển hướng" }
    ]
  },
  {
    id: 2,
    title: "2. Đăng xuất và kết thúc phiên làm việc",
    steps: [
      { actor: "Độc giả", text: "Bấm nút Đăng xuất trên menu tài khoản" },
      { actor: "Frontend client", text: "Xóa JWT token khỏi LocalStorage" },
      { actor: "Frontend client", text: "Chuyển hướng về trang đăng nhập" }
    ]
  },
  {
    id: 3,
    title: "3. Tìm kiếm khóa luận bằng Elasticsearch",
    steps: [
      { actor: "Sinh viên", text: "Nhập từ khóa tìm kiếm tại LookupPage" },
      { actor: "Frontend client", text: "Gửi request GET /api/theses/search" },
      { actor: "Elasticsearch", text: "Truy vấn index khóa luận với tốc độ cao" },
      { actor: "Frontend client", text: "Hiển thị danh sách kết quả phù hợp" }
    ]
  },
  {
    id: 4,
    title: "4. Lọc khóa luận theo Chuyên ngành & Giảng viên",
    steps: [
      { actor: "Sinh viên", text: "Chọn bộ lọc Chuyên ngành hoặc GVHD" },
      { actor: "Frontend client", text: "Gửi request API kèm tham số query" },
      { actor: "Backend API", text: "Truy vấn DB PostgreSQL lọc theo khóa ngoại" },
      { actor: "Frontend client", text: "Cập nhật danh sách hiển thị trên màn hình" }
    ]
  },
  {
    id: 5,
    title: "5. Xem chi tiết thông tin khóa luận",
    steps: [
      { actor: "Sinh viên", text: "Bấm vào thẻ khóa luận bất kỳ" },
      { actor: "Frontend client", text: "Chuyển hướng đến trang chi tiết" },
      { actor: "Backend API", text: "Tải Metadata, tóm tắt và từ khóa" },
      { actor: "Frontend client", text: "Hiển thị thông tin & nút đọc Flipbook" }
    ]
  },
  {
    id: 6,
    title: "6. Đọc trực tuyến bằng tài liệu Flipbook 3D",
    steps: [
      { actor: "Sinh viên", text: "Bấm nút 'Đọc trực tuyến'" },
      { actor: "Frontend client", text: "Gọi API lấy link file PDF tạm thời" },
      { actor: "Frontend client", text: "Render giao diện lật trang bằng HTML5" }
    ]
  },
  {
    id: 7,
    title: "7. Tải file tài liệu PDF gốc về máy",
    steps: [
      { actor: "Sinh viên", text: "Bấm nút 'Tải xuống báo cáo'" },
      { actor: "Backend API", text: "Xác thực quyền tải của tài khoản" },
      { actor: "Drive Service", text: "Stream file PDF từ Google Drive về client" },
      { actor: "Frontend client", text: "Lưu file PDF vào máy người dùng" }
    ]
  },
  {
    id: 8,
    title: "8. Đánh dấu lưu tài liệu yêu thích",
    steps: [
      { actor: "Sinh viên", text: "Bấm nút lưu (Biểu tượng trái tim)" },
      { actor: "Frontend client", text: "Gửi request POST /api/favorites" },
      { actor: "Backend API", text: "Lưu bản ghi vào bảng Favorites" },
      { actor: "Frontend client", text: "Cập nhật trạng thái nút lưu thành màu đỏ" }
    ]
  },
  {
    id: 9,
    title: "9. Xem danh sách khóa luận đã đánh dấu lưu",
    steps: [
      { actor: "Sinh viên", text: "Truy cập vào trang FavoritesPage" },
      { actor: "Backend API", text: "Tải danh sách các khóa luận đã bookmark" },
      { actor: "Frontend client", text: "Hiển thị danh sách khóa luận yêu thích" }
    ]
  },
  {
    id: 10,
    title: "10. Chia sẻ liên kết khóa luận",
    steps: [
      { actor: "Độc giả", text: "Bấm nút 'Chia sẻ khóa luận'" },
      { actor: "Frontend client", text: "Tự động sao chép liên kết vào Clipboard" },
      { actor: "Frontend client", text: "Hiển thị thông báo đã sao chép" }
    ]
  },
  {
    id: 11,
    title: "11. Xem hồ sơ học tập cá nhân độc giả",
    steps: [
      { actor: "Sinh viên", text: "Vào mục Profile cá nhân" },
      { actor: "Backend API", text: "Tải thông tin ngành học & niên khóa" },
      { actor: "Frontend client", text: "Hiển thị thông tin cá nhân của sinh viên" }
    ]
  },
  {
    id: 12,
    title: "12. Phân tích sở thích đọc (Interest Profile)",
    steps: [
      { actor: "Frontend client", text: "Đếm lượt xem/tải theo chuyên ngành và tags" },
      { actor: "Frontend client", text: "Tính toán tỷ lệ sở thích cá nhân" },
      { actor: "Frontend client", text: "Hiển thị biểu đồ phân tích sở thích" }
    ]
  },
  {
    id: 13,
    title: "13. Gợi ý khóa luận thông minh (Recommendation)",
    steps: [
      { actor: "Frontend client", text: "Gửi Interest Profile của user lên API" },
      { actor: "Backend API", text: "Truy vấn Elasticsearch tìm các bài liên quan" },
      { actor: "Frontend client", text: "Hiển thị mục 'Khóa luận đề xuất cho bạn'" }
    ]
  },
  {
    id: 14,
    title: "14. Tra cứu khóa luận theo giảng viên hướng dẫn",
    steps: [
      { actor: "Sinh viên", text: "Bấm vào tên Giảng viên ở trang chi tiết" },
      { actor: "Backend API", text: "Tìm các khóa luận có AdvisorId tương ứng" },
      { actor: "Frontend client", text: "Hiển thị danh sách các đề tài của giảng viên" }
    ]
  },
  {
    id: 15,
    title: "15. Xem tài liệu hướng dẫn sử dụng thư viện",
    steps: [
      { actor: "Độc giả", text: "Truy cập mục Hướng dẫn (Guidelines)" },
      { actor: "Frontend client", text: "Tải file markdown hướng dẫn từ server" },
      { actor: "Frontend client", text: "Hiển thị bài hướng dẫn tra cứu" }
    ]
  },
  {
    id: 16,
    title: "16. Hỏi đáp gợi ý tài liệu qua Chatbot AI",
    steps: [
      { actor: "Độc giả", text: "Gửi câu hỏi yêu cầu gợi ý tài liệu" },
      { actor: "Backend API", text: "Gọi mô hình Gemini AI phân tích câu hỏi" },
      { actor: "Elasticsearch", text: "Tìm các tài liệu phù hợp từ khóa gợi ý" },
      { actor: "Backend API", text: "Trả câu trả lời kèm link khóa luận đề xuất" }
    ]
  },
  {
    id: 17,
    title: "17. Gửi yêu cầu hỗ trợ tài liệu lên thủ thư",
    steps: [
      { actor: "Độc giả", text: "Điền form yêu cầu tại mục Support" },
      { actor: "Backend API", text: "Lưu yêu cầu hỗ trợ vào bảng SupportRequests" },
      { actor: "PostgreSQL DB", text: "Cập nhật bản ghi trạng thái chờ phản hồi" },
      { actor: "Backend API", text: "Gửi email thông báo cho thủ thư thư viện" }
    ]
  },
  {
    id: 18,
    title: "18. Theo dõi lịch hoạt động của thư viện số",
    steps: [
      { actor: "Độc giả", text: "Truy cập trang Lịch hoạt động (Schedule)" },
      { actor: "Backend API", text: "Tải các sự kiện học thuật & bảo trì hệ thống" },
      { actor: "Frontend client", text: "Hiển thị dạng lịch tháng tương tác" }
    ]
  },
  {
    id: 19,
    title: "19. Xem tin tức học thuật mới xuất bản",
    steps: [
      { actor: "Độc giả", text: "Truy cập trang chủ tin tức thư viện" },
      { actor: "Backend API", text: "Tải danh sách tin tức phân trang" },
      { actor: "Frontend client", text: "Hiển thị các bài viết tin tức mới nhất" }
    ]
  },
  {
    id: 20,
    title: "20. Xem chi tiết bài viết tin tức thư viện",
    steps: [
      { actor: "Độc giả", text: "Bấm vào bài viết tin tức cụ thể" },
      { actor: "Backend API", text: "Tải nội dung bài viết theo NewsId" },
      { actor: "Frontend client", text: "Hiển thị bài viết tin tức đầy đủ" }
    ]
  },
  {
    id: 21,
    title: "21. Đăng nhập trang quản trị thư viện",
    steps: [
      { actor: "Thủ thư/Admin", text: "Nhập tài khoản admin tại màn hình đăng nhập" },
      { actor: "Backend API", text: "Xác thực quyền Admin/Librarian" },
      { actor: "Frontend client", text: "Chuyển hướng vào Admin Dashboard" }
    ]
  },
  {
    id: 22,
    title: "22. Xem báo cáo thống kê thư viện số",
    steps: [
      { actor: "Admin", text: "Vào trang tổng quan AdminDashboard" },
      { actor: "Backend API", text: "Tính số tài liệu, lượt đọc, lượt tải" },
      { actor: "Frontend client", text: "Vẽ biểu đồ thống kê tương tác độc giả" }
    ]
  },
  {
    id: 23,
    title: "23. Tìm kiếm và quản trị tài khoản độc giả",
    steps: [
      { actor: "Admin", text: "Vào trang Quản lý tài khoản" },
      { actor: "Backend API", text: "Tìm kiếm tài khoản theo mã SV/Email" },
      { actor: "PostgreSQL DB", text: "Cập nhật kích hoạt/khóa tài khoản" }
    ]
  },
  {
    id: 24,
    title: "24. Thêm tài liệu khóa luận mới thủ công",
    steps: [
      { actor: "Admin", text: "Nhập thông tin khóa luận tại form thêm mới" },
      { actor: "Backend API", text: "Tạo bản ghi khóa luận với trạng thái PUBLISHED" },
      { actor: "Elasticsearch", text: "Đẩy dữ liệu khóa luận mới vào Search Index" }
    ]
  },
  {
    id: 25,
    title: "25. Nhập danh sách tài liệu hàng loạt từ Excel",
    steps: [
      { actor: "Admin", text: "Tải file Excel lên hệ thống" },
      { actor: "Backend API", text: "Phân tích file & kiểm tra trùng lặp" },
      { actor: "PostgreSQL DB", text: "Bulk insert hàng trăm bản ghi khóa luận" }
    ]
  },
  {
    id: 26,
    title: "26. Cập nhật thông tin tài liệu đã đăng",
    steps: [
      { actor: "Admin", text: "Chỉnh sửa tiêu đề/mô tả khóa luận" },
      { actor: "Backend API", text: "Cập nhật PostgreSQL & Elasticsearch" },
      { actor: "Frontend client", text: "Hiển thị thông tin mới sau khi lưu" }
    ]
  },
  {
    id: 27,
    title: "27. Gỡ bỏ tài liệu khỏi thư viện số",
    steps: [
      { actor: "Admin", text: "Bấm nút xóa tài liệu khóa luận" },
      { actor: "Backend API", text: "Ẩn tài liệu (Soft Delete)" },
      { actor: "Elasticsearch", text: "Xóa tài liệu khỏi Search Index" }
    ]
  },
  {
    id: 28,
    title: "28. Tự động đồng bộ tài liệu từ Google Drive",
    steps: [
      { actor: "Hangfire Scheduler", text: "Kích hoạt DriveSyncJob định kỳ" },
      { actor: "Drive Service", text: "Quét thư mục Google Drive tìm file mới" },
      { actor: "Backend API", text: "Thêm bản ghi metadata vào DB PostgreSQL" }
    ]
  },
  {
    id: 29,
    title: "29. Quản trị viên trigger đồng bộ thủ công",
    steps: [
      { actor: "Admin", text: "Bấm nút 'Đồng bộ ngay' trên Admin Panel" },
      { actor: "Backend API", text: "Gửi job đồng bộ vào Hangfire Queue" },
      { actor: "Hangfire Worker", text: "Thực thi job quét và tải file Drive" }
    ]
  },
  {
    id: 30,
    title: "30. Xem nhật ký hoạt động hệ thống",
    steps: [
      { actor: "Admin", text: "Vào mục Nhật ký hệ thống (Audit Logs)" },
      { actor: "Backend API", text: "Tải nhật ký các thao tác của người dùng" },
      { actor: "Frontend client", text: "Hiển thị danh sách audit log chi tiết" }
    ]
  }
];

// Helper to generate SVG string for a flow
function generateSVG(flow) {
  const width = 900;
  const height = 280;
  const stepsCount = flow.steps.length;
  
  // Layout spacing for 1 single row
  const boxWidth = 140;
  const boxHeight = 70;
  const startY = 100;
  
  const gap = (width - 80 - (stepsCount * boxWidth)) / (stepsCount - 1 || 1);

  const stepsSVG = flow.steps.map((step, idx) => {
    const x = 40 + idx * (boxWidth + gap);
    const y = startY;
    
    // Wrap text into two lines if it's too long
    const words = step.text.split(' ');
    let line1 = '', line2 = '';
    for (let w of words) {
      if (line1.length + w.length < 20) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    }

    const escapedActor = escapeXML(step.actor);
    const escapedLine1 = escapeXML(line1);
    const escapedLine2 = escapeXML(line2);

    return `
      <!-- Step ${idx + 1} -->
      <g transform="translate(${x}, ${y})">
        <!-- Rounded Box (Classic UML Style: White background, black border) -->
        <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
        <!-- Divider separating actor name -->
        <line x1="0" y1="22" x2="${boxWidth}" y2="22" stroke="#000000" stroke-width="1"/>
        
        <!-- Actor Name (Centered, small uppercase text) -->
        <text x="${boxWidth/2}" y="14" fill="#000000" font-size="8.5" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" style="text-transform: uppercase;">${escapedActor}</text>
        
        <!-- Step Text (Centered) -->
        <text x="${boxWidth/2}" y="40" fill="#000000" font-size="9" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">${escapedLine1}</text>
        ${escapedLine2 ? `<text x="${boxWidth/2}" y="53" fill="#000000" font-size="9" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">${escapedLine2}</text>` : ''}
        
        <!-- Small step number badge inside the box -->
        <circle cx="12" cy="11" r="7" fill="#000000"/>
        <text x="12" y="14" fill="#ffffff" font-size="8" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">${idx + 1}</text>
      </g>
    `;
  }).join('\n');

  // Generate connection arrows between steps (all left-to-right)
  let arrowsSVG = '';
  for (let i = 0; i < stepsCount - 1; i++) {
    const x1 = 40 + i * (boxWidth + gap) + boxWidth;
    const y1 = startY + boxHeight / 2;
    const x2 = 40 + (i + 1) * (boxWidth + gap);
    const y2 = startY + boxHeight / 2;
    
    arrowsSVG += `<line x1="${x1}" y1="${y1}" x2="${x2 - 8}" y2="${y2}" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>`;
  }

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
      <text x="30" y="34" fill="#000000" font-size="13" font-family="Arial, sans-serif" font-weight="bold" style="text-transform: uppercase;">${escapeXML(flow.title)}</text>
      
      <!-- Flow Category Tag -->
      <rect x="730" y="16" width="140" height="24" rx="12" fill="#000000" opacity="0.05"/>
      <text x="800" y="31" fill="#000000" font-size="8.5" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="0.5">LIBRARY FLOW</text>

      ${arrowsSVG}
      ${stepsSVG}
      
      <!-- Footer Brand -->
      <text x="450" y="260" fill="#64748b" font-size="8" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1">UEF ETHESIS PORTAL - DIGITAL LIBRARY SYSTEMS</text>
    </svg>
  `;
}

// Main execution block to generate all 30 flow images
async function generateAll() {
  const outputDir = path.join(__dirname, '..', 'flows');
  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads', 'flows');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`Starting generation of 30 technical flow diagrams...`);

  for (const flow of flows) {
    try {
      const svgContent = generateSVG(flow);
      const fileName = `flow_${flow.id}`;
      
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

      console.log(`[Generated] Flow ${flow.id}: ${flow.title}`);
    } catch (err) {
      console.error(`Error generating diagram for flow ${flow.id}:`, err);
    }
  }

  console.log(`Successfully generated 30 flow diagrams (both SVG and PNG)!`);
}

generateAll();

module.exports = { flows };
