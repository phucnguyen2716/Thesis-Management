const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 40 Flows definition
const flows = [
  // Nhóm 1: Quản lý Đề tài & Đăng ký
  {
    id: 1,
    title: "Luồng 1: Đăng nhập và xác thực",
    steps: [
      { text: "Nhập Email/Mật khẩu", actor: "Người dùng" },
      { text: "Gửi POST /api/auth/login", actor: "Frontend" },
      { text: "Xác thực Hash BCrypt", actor: "PostgreSQL DB" },
      { text: "Sinh & trả về JWT Token", actor: "Backend API" },
      { text: "Lưu token, chuyển hướng", actor: "Frontend" }
    ]
  },
  {
    id: 2,
    title: "Luồng 2: Đăng xuất tài khoản",
    steps: [
      { text: "Bấm nút Đăng xuất", actor: "Người dùng" },
      { text: "Xóa Token khỏi localStorage", actor: "Frontend" },
      { text: "Chuyển hướng về /login", actor: "Frontend" }
    ]
  },
  {
    id: 3,
    title: "Luồng 3: Sinh viên xem đề tài gợi ý",
    steps: [
      { text: "Truy cập trang Tra cứu /lookup", actor: "Sinh viên" },
      { text: "Gọi GET /api/theses (filters)", actor: "Frontend" },
      { text: "Query DB & Elasticsearch", actor: "Backend API" },
      { text: "Hiển thị danh sách đề tài", actor: "Frontend" }
    ]
  },
  {
    id: 4,
    title: "Luồng 4: Sinh viên đăng ký đề tài mới",
    steps: [
      { text: "Điền form đề xuất đề tài", actor: "Sinh viên" },
      { text: "Gửi POST /api/theses", actor: "Frontend" },
      { text: "Tạo record (Status='Pending')", actor: "PostgreSQL DB" },
      { text: "Báo đăng ký thành công", actor: "Frontend" }
    ]
  },
  {
    id: 5,
    title: "Luồng 5: Duyệt/từ chối đăng ký đề tài",
    steps: [
      { text: "Xem yêu cầu tại /requests", actor: "Giảng viên" },
      { text: "Gửi PUT /api/theses/{id}/status", actor: "Frontend" },
      { text: "Cập nhật Status (InProgress/Rejected)", actor: "PostgreSQL DB" },
      { text: "Ghi nhận thời gian duyệt ApprovedAt", actor: "Backend API" }
    ]
  },
  {
    id: 6,
    title: "Luồng 6: Admin tạo mới đề tài và gán trực tiếp",
    steps: [
      { text: "Nhập thông tin gán đề tài", actor: "Admin" },
      { text: "Gửi POST /api/theses (Admin)", actor: "Frontend" },
      { text: "Tạo đề tài (Status='InProgress')", actor: "PostgreSQL DB" },
      { text: "Thông báo gán thành công", actor: "Frontend" }
    ]
  },
  {
    id: 7,
    title: "Luồng 7: Giảng viên cập nhật thông tin đề tài",
    steps: [
      { text: "Sửa thông tin tiêu đề/mô tả", actor: "Giảng viên" },
      { text: "Gửi PUT /api/theses/{id}", actor: "Frontend" },
      { text: "Xác thực quyền & update DB", actor: "Backend API" },
      { text: "Thông báo cập nhật thành công", actor: "Frontend" }
    ]
  },
  {
    id: 8,
    title: "Luồng 8: Sinh viên xem trạng thái đề tài",
    steps: [
      { text: "Vào trang Đề tài /my-thesis", actor: "Sinh viên" },
      { text: "Gọi GET /api/theses/my", actor: "Frontend" },
      { text: "Truy vấn tiến độ đề tài", actor: "PostgreSQL DB" },
      { text: "Hiển thị trạng thái hiện tại", actor: "Frontend" }
    ]
  },
  {
    id: 9,
    title: "Luồng 9: Sinh viên hủy đăng ký đề tài",
    steps: [
      { text: "Bấm Hủy đăng ký (khi chờ duyệt)", actor: "Sinh viên" },
      { text: "Gửi DELETE /api/theses/{id}", actor: "Frontend" },
      { text: "Kiểm tra Status='Pending' & xóa", actor: "Backend API" },
      { text: "Thông báo hủy thành công", actor: "Frontend" }
    ]
  },
  {
    id: 10,
    title: "Luồng 10: Admin import đề tài từ Excel/CSV",
    steps: [
      { text: "Upload file Excel/CSV", actor: "Admin" },
      { text: "Gửi file lên POST /api/theses/import", actor: "Frontend" },
      { text: "Đọc file & Bulk Insert vào DB", actor: "Backend API" },
      { text: "Hiển thị số lượng import thành công", actor: "Frontend" }
    ]
  },

  // Nhóm 2: Nộp bài & Đồng bộ Drive
  {
    id: 11,
    title: "Luồng 11: Sinh viên nộp bản thảo tài liệu lên hệ thống",
    steps: [
      { text: "Chọn & kéo thả file báo cáo", actor: "Sinh viên" },
      { text: "Gửi file POST /api/theses/{id}/submit", actor: "Frontend" },
      { text: "Lưu file vào thư mục /uploads", actor: "Backend API" },
      { text: "Cập nhật FilePath (Status='Submitted')", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 12,
    title: "Luồng 12: Đồng bộ tự động tài liệu lên Google Drive",
    steps: [
      { text: "Kích hoạt task ngầm sau nộp bài", actor: "Backend API" },
      { text: "Gửi message vào RabbitMQ", actor: "Queue Service" },
      { text: "Worker gọi Google Drive API", actor: "RabbitMQ Worker" },
      { text: "Upload file lên Drive theo thư mục Ngành", actor: "Drive Service" }
    ]
  },
  {
    id: 13,
    title: "Luồng 13: Chuyển đổi file Word sang PDF bằng LibreOffice",
    steps: [
      { text: "Nhận dạng file nộp dạng .docx", actor: "Backend API" },
      { text: "Gọi subprocess command LibreOffice", actor: "LibreOffice Service" },
      { text: "Chạy soffice headless convert", actor: "System OS" },
      { text: "Lưu file .pdf vào /temporary_pdf", actor: "Backend API" }
    ]
  },
  {
    id: 14,
    title: "Luồng 14: Lưu trữ bản ghi DriveFileRecords vào PostgreSQL",
    steps: [
      { text: "Lấy metadata upload (ID, Link Drive)", actor: "Drive Service" },
      { text: "Tạo bản ghi trong DriveFileRecords", actor: "Backend API" },
      { text: "Lưu đường dẫn LocalPdfPath & Link", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 15,
    title: "Luồng 15: Quét tìm tài liệu mới từ Google Drive",
    steps: [
      { text: "Chạy tác vụ định kỳ (Cron Job)", actor: "Hangfire Scheduler" },
      { text: "Gọi API quét thư mục Google Drive", actor: "Drive Service" },
      { text: "Nếu phát hiện file mới -> Sync về DB", actor: "Backend API" }
    ]
  },
  {
    id: 16,
    title: "Luồng 16: Sinh viên nộp lại bản thảo mới",
    steps: [
      { text: "Tải file mới lên ghi đè bài cũ", actor: "Sinh viên" },
      { text: "Backup file cũ & lưu đè file mới", actor: "Backend API" },
      { text: "Kích hoạt đồng bộ Google Drive", actor: "Queue Service" },
      { text: "Cập nhật bản ghi DriveFileRecords", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 17,
    title: "Luồng 17: Giảng viên tải xuống file tài liệu",
    steps: [
      { text: "Bấm nút Tải tài liệu sinh viên", actor: "Giảng viên" },
      { text: "Kiểm tra quyền truy cập đề tài", actor: "Backend API" },
      { text: "Tải từ local /uploads hoặc Drive", actor: "Backend API" },
      { text: "Nhận file báo cáo nguyên bản", actor: "Giảng viên" }
    ]
  },
  {
    id: 18,
    title: "Luồng 18: Admin kiểm tra nhất quán Drive và DB",
    steps: [
      { text: "Bấm nút Kiểm tra đồng bộ", actor: "Admin" },
      { text: "So sánh DriveFileRecords với Google Drive", actor: "Backend API" },
      { text: "Báo cáo các bản ghi bị lệch / lỗi", actor: "Backend API" }
    ]
  },
  {
    id: 19,
    title: "Luồng 19: Sinh viên cập nhật link tài liệu thủ công",
    steps: [
      { text: "Dán link Google Drive chia sẻ", actor: "Sinh viên" },
      { text: "Xác thực cú pháp URL Drive", actor: "Backend API" },
      { text: "Lưu link vào FilePath trong DB", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 20,
    title: "Luồng 20: Hệ thống tự động thử lại khi lỗi Drive",
    steps: [
      { text: "Upload Drive lỗi (Timeout/API limit)", actor: "Drive Service" },
      { text: "Đánh dấu trạng thái 'Failed' & lưu Queue", actor: "Backend API" },
      { text: "Worker quét & chạy lại sau 15 phút", actor: "Hangfire Worker" }
    ]
  },

  // Nhóm 3: Kiểm tra tương đồng & Đạo văn
  {
    id: 21,
    title: "Luồng 21: Kích hoạt quét đạo văn tự động qua RabbitMQ",
    steps: [
      { text: "Lưu file bản thảo hoàn tất", actor: "Backend API" },
      { text: "Gửi message (ThesisId) vào queue", actor: "Queue Service" },
      { text: "Worker nhận message để xử lý", actor: "RabbitMQ Worker" }
    ]
  },
  {
    id: 22,
    title: "Luồng 22: Đọc & giải mã dữ liệu nhị phân file PDF",
    steps: [
      { text: "Xác định đường dẫn file từ ThesisId", actor: "RabbitMQ Worker" },
      { text: "Đọc file nhị phân vào bộ nhớ", actor: "System OS" },
      { text: "Verify tính toàn vẹn (không hỏng)", actor: "Plagiarism Service" }
    ]
  },
  {
    id: 23,
    title: "Luồng 23: Trích xuất text từ tài liệu PDF",
    steps: [
      { text: "Đọc nội dung PDF bằng thư viện chuyên dụng", actor: "Plagiarism Service" },
      { text: "Trích xuất chuỗi ký tự theo trang", actor: "Plagiarism Service" },
      { text: "Chuẩn hóa text (bỏ khoảng trắng thừa)", actor: "Plagiarism Service" }
    ]
  },
  {
    id: 24,
    title: "Luồng 24: So khớp tương đồng sử dụng Gemini AI",
    steps: [
      { text: "Gửi Plain Text tài liệu lên Gemini API", actor: "Plagiarism Service" },
      { text: "Gemini phân tích đối chiếu ngữ nghĩa", actor: "Gemini AI API" },
      { text: "Trả về tỷ lệ % & các đoạn trùng lặp", actor: "Gemini AI API" }
    ]
  },
  {
    id: 25,
    title: "Luồng 25: Lưu kết quả phân tích vào PlagiarismReports",
    steps: [
      { text: "Tạo đối tượng PlagiarismReportEntity", actor: "Backend API" },
      { text: "Lưu ThesisId, %, JSON báo cáo chi tiết", actor: "Backend API" },
      { text: "Ghi dữ liệu vào PostgreSQL DB", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 26,
    title: "Luồng 26: Sinh viên xem báo cáo chi tiết tỷ lệ tương đồng",
    steps: [
      { text: "Bấm Xem báo cáo tương đồng", actor: "Sinh viên" },
      { text: "Gọi GET /api/theses/{id}/plagiarism-report", actor: "Frontend" },
      { text: "Hiển thị giao diện bôi đỏ đoạn trùng lặp", actor: "Frontend" }
    ]
  },
  {
    id: 27,
    title: "Luồng 27: Giảng viên xem lịch sử kiểm tra tương đồng của SV",
    steps: [
      { text: "Vào danh sách sinh viên đang hướng dẫn", actor: "Giảng viên" },
      { text: "Click khiên bảo mật xem lịch sử quét", actor: "Giảng viên" },
      { text: "Hiển thị tỷ lệ tương đồng qua các lần nộp", actor: "Frontend" }
    ]
  },
  {
    id: 28,
    title: "Luồng 28: Admin xem biểu đồ đạo văn toàn hệ thống",
    steps: [
      { text: "Truy cập Tab Kiểm tra tương đồng", actor: "Admin" },
      { text: "Tải dữ liệu phân bố tỉ lệ từ DB", actor: "Backend API" },
      { text: "Vẽ biểu đồ phân bố & cảnh báo đỏ (>60%)", actor: "Frontend" }
    ]
  },

  // Nhóm 4: Chấm điểm & Đánh giá
  {
    id: 29,
    title: "Luồng 29: Giảng viên chấm điểm và nhận xét bản thảo",
    steps: [
      { text: "Điền điểm (hệ 10) & nhận xét", actor: "Giảng viên" },
      { text: "Gửi request POST /api/theses/{id}/grade", actor: "Frontend" },
      { text: "Lưu vào ThesisReviews (Status='Approved')", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 30,
    title: "Luồng 30: Sinh viên xem điểm và nhận xét từ giảng viên",
    steps: [
      { text: "Nhận thông báo điểm / Vào mục kết quả", actor: "Sinh viên" },
      { text: "Tải kết quả từ ThesisReviews & Theses", actor: "Backend API" },
      { text: "Hiển thị điểm số & phê duyệt chính thức", actor: "Frontend" }
    ]
  },
  {
    id: 31,
    title: "Luồng 31: Kích hoạt tính năng AI đánh giá cấu trúc bài viết",
    steps: [
      { text: "Bấm nút 'AI Chấm' tại Word Playground", actor: "Sinh viên" },
      { text: "Gửi nội dung HTML lên POST /api/chatbot/evaluate", actor: "Frontend" },
      { text: "Khởi động tiến trình xử lý phân tích AI", actor: "Backend API" }
    ]
  },
  {
    id: 32,
    title: "Luồng 32: Gemini AI phân tích, đếm từ và chấm điểm định dạng",
    steps: [
      { text: "Đếm số từ & kiểm tra đề mục bắt buộc", actor: "Backend API" },
      { text: "Gửi Prompt yêu cầu kiểm tra cấu trúc", actor: "Backend API" },
      { text: "Gemini phân tích lỗi chính tả, chấm điểm", actor: "Gemini AI API" }
    ]
  },
  {
    id: 33,
    title: "Luồng 33: Lưu và hiển thị kết quả chấm điểm của AI",
    steps: [
      { text: "Trả về kết quả đánh giá (AI Score)", actor: "Backend API" },
      { text: "Hiển thị Modal liệt kê các lỗi định dạng", actor: "Frontend" },
      { text: "Sinh viên lưu nháp & sửa theo gợi ý", actor: "Frontend" }
    ]
  },
  {
    id: 34,
    title: "Luồng 34: Lập hội đồng bảo vệ và gán đề tài vào hội đồng",
    steps: [
      { text: "Tạo hội đồng (Tên, Phòng, Ngày giờ)", actor: "Admin" },
      { text: "Gán GV vào CommitteeMembers & gán đề tài", actor: "Admin" },
      { text: "Ghi nhận dữ liệu vào bảng Committees", actor: "PostgreSQL DB" },
      { text: "Thông báo lịch bảo vệ đến các tài khoản", actor: "Backend API" }
    ]
  },

  // Nhóm 5: Tương tác, Social & Vận hành
  {
    id: 35,
    title: "Luồng 35: Giảng viên và sinh viên trao đổi qua bình luận",
    steps: [
      { text: "Nhập bình luận thảo luận đề tài", actor: "Người dùng" },
      { text: "Gửi POST /api/theses/{id}/comments", actor: "Frontend" },
      { text: "Tạo record trong bảng ThesisComments", actor: "PostgreSQL DB" },
      { text: "Reload danh sách bình luận thời gian thực", actor: "Frontend" }
    ]
  },
  {
    id: 36,
    title: "Luồng 36: Chatbot AI hỗ trợ giải đáp thắc mắc cấu trúc",
    steps: [
      { text: "Nhập câu hỏi định dạng tại /chatbot", actor: "Sinh viên" },
      { text: "Gửi prompt lên POST /api/chatbot/chat", actor: "Frontend" },
      { text: "Gemini trả lời dựa trên tài liệu HD", actor: "Gemini AI API" },
      { text: "Lưu lịch sử chat vào bảng ChatHistory", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 37,
    title: "Luồng 37: Admin đăng bài viết thông báo mới lên bảng tin",
    steps: [
      { text: "Điền form thông báo & đính kèm ảnh", actor: "Admin" },
      { text: "Gửi request POST /api/social/posts", actor: "Frontend" },
      { text: "Lưu bài viết vào bảng SocialPosts", actor: "PostgreSQL DB" },
      { text: "Thông báo hiển thị trên Bảng tin chung", actor: "Frontend" }
    ]
  },
  {
    id: 38,
    title: "Luồng 38: Đồng bộ hóa ảnh thông báo lên Cloudinary",
    steps: [
      { text: "Nhận file ảnh thông báo mới", actor: "Backend API" },
      { text: "Gọi Cloudinary API upload file", actor: "Cloudinary Service" },
      { text: "Nhận link ảnh CDN bảo mật HTTPS", actor: "Cloudinary Service" },
      { text: "Lưu link CDN vào trường Image của SocialPosts", actor: "PostgreSQL DB" }
    ]
  },
  {
    id: 39,
    title: "Luồng 39: Admin theo dõi log đăng nhập (Audit Logs)",
    steps: [
      { text: "Lưu log đăng nhập tự động", actor: "System Security" },
      { text: "Admin truy cập mục Nhật ký hệ thống /audit", actor: "Admin" },
      { text: "Tải & hiển thị danh sách đăng nhập từ DB", actor: "Frontend" }
    ]
  },
  {
    id: 40,
    title: "Luồng 40: Admin kiểm tra trạng thái dịch vụ Docker",
    steps: [
      { text: "Truy cập Tab Vận hành trên dashboard", actor: "Admin" },
      { text: "Backend ping các port Postgres, ES, RabbitMQ", actor: "Backend API" },
      { text: "Hiển thị trạng thái Online/Offline & queues", actor: "Frontend" }
    ]
  }
];

function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to generate SVG string for a flow
function generateSVG(flow) {
  const width = 800;
  const height = 400;
  const stepsCount = flow.steps.length;
  
  // Layout spacing for 1 single row
  const boxWidth = 120;
  const boxHeight = 75;
  const startY = 162.5; // Center of the height
  
  const gap = (width - 80 - (stepsCount * boxWidth)) / (stepsCount - 1 || 1);
  
  // Colors mapped to actors
  const actorColors = {
    "Sinh viên": "#a78bfa", // purple
    "Giảng viên": "#f59e0b", // orange
    "Admin": "#f87171", // rose
    "Người dùng": "#e2e8f0", // slate
    "Frontend": "#38bdf8", // sky
    "Backend API": "#10b981", // emerald
    "PostgreSQL DB": "#34d399", // light emerald
    "Queue Service": "#818cf8", // indigo
    "RabbitMQ Worker": "#f43f5e", // rose dark
    "Drive Service": "#fb7185", // rose light
    "LibreOffice Service": "#fbbf24", // amber
    "System OS": "#94a3b8", // slate-400
    "Gemini AI API": "#c084fc", // purple light
    "System Security": "#22d3ee", // cyan
    "Hangfire Scheduler": "#fda4af", // rose light
    "Hangfire Worker": "#f43f5e"
  };

  const stepsSVG = flow.steps.map((step, idx) => {
    const x = 40 + idx * (boxWidth + gap);
    const y = startY;
    const color = actorColors[step.actor] || "#10b981";
    
    // Wrap text into two lines if it's too long
    const words = step.text.split(' ');
    let line1 = '', line2 = '';
    for (let w of words) {
      if (line1.length + w.length < 15) {
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
        <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" rx="8" ry="8" fill="#1e293b" stroke="${color}" stroke-width="2" filter="url(#glow)"/>
        <text x="${boxWidth/2}" y="24" fill="#94a3b8" font-size="8.5" font-family="Inter, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="0.5" style="text-transform: uppercase;">${escapedActor}</text>
        <text x="${boxWidth/2}" y="44" fill="#f8fafc" font-size="9.5" font-family="Inter, sans-serif" font-weight="bold" text-anchor="middle">${escapedLine1}</text>
        ${escapedLine2 ? `<text x="${boxWidth/2}" y="57" fill="#f8fafc" font-size="9.5" font-family="Inter, sans-serif" font-weight="bold" text-anchor="middle">${escapedLine2}</text>` : ''}
        <circle cx="12" cy="12" r="7" fill="${color}"/>
        <text x="12" y="15" fill="#0f172a" font-size="8" font-family="Inter, sans-serif" font-weight="black" text-anchor="middle">${idx + 1}</text>
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
    
    arrowsSVG += `<line x1="${x1}" y1="${y1}" x2="${x2 - 8}" y2="${y2}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <!-- Marker for right arrows -->
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
        <!-- Glow effect for neon borders -->
        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#38bdf8" flood-opacity="0.15"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Header Title -->
      <rect x="0" y="0" width="100%" height="55" fill="#1e293b" rx="16"/>
      <text x="30" y="34" fill="#ffffff" font-size="13" font-family="Inter, sans-serif" font-weight="800" letter-spacing="0.2" style="text-transform: uppercase;">${escapeXML(flow.title)}</text>
      
      <!-- Flow Category Tag -->
      <rect x="630" y="16" width="140" height="24" rx="12" fill="#3b82f6" opacity="0.2"/>
      <text x="700" y="32" fill="#38bdf8" font-size="9" font-family="Inter, sans-serif" font-weight="950" text-anchor="middle" letter-spacing="1">ETHESIS WORKFLOW</text>

      ${arrowsSVG}
      ${stepsSVG}
      
      <!-- Footer Brand -->
      <text x="400" y="380" fill="#475569" font-size="9" font-family="Inter, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1.5">UEF ETHESIS PORTAL DIAGRAM GENERATOR</text>
    </svg>
  `;
}

// Main execution block to generate all 40 flow images
async function generateAll() {
  const outputDir = path.join(__dirname, '..', 'flows');
  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads', 'flows');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`Starting generation of 40 technical flow diagrams...`);

  for (const flow of flows) {
    try {
      const svgContent = generateSVG(flow);
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

      console.log(`[Generated] Flow ${flow.id}: ${flow.title}`);
    } catch (err) {
      console.error(`Error generating diagram for flow ${flow.id}:`, err);
    }
  }

  console.log(`Successfully generated 40 flow diagrams (both SVG and PNG)!`);
}

generateAll();

module.exports = { flows };
