# 🎓 eThesis — Nền tảng Quản lý Khóa luận Tốt nghiệp & Đề tài Nghiên cứu Khoa học

> **Đồ án tốt nghiệp đại học** · Ngành Công nghệ Thông tin · Trường Đại học Kinh tế - Tài chính TP.HCM (UEF)

---

## 📌 Tổng quan đề tài

Trong bối cảnh chuyển đổi số giáo dục đại học diễn ra mạnh mẽ trên toàn cầu, hầu hết các quy trình quản lý khóa luận tốt nghiệp tại các trường đại học Việt Nam vẫn đang được thực hiện thủ công hoặc phân tán trên nhiều nền tảng khác nhau — từ email đính kèm file Word, bảng tính Excel theo dõi tiến độ, đến các nhóm chat Zalo/Messenger để trao đổi giữa sinh viên và giảng viên. Sự phân mảnh này gây ra hàng loạt vấn đề nghiêm trọng trong thực tiễn học thuật:

- **Mất dữ liệu và thiếu truy xuất nguồn gốc:** Các phiên bản bản thảo khóa luận được gửi qua email không có hệ thống kiểm soát phiên bản, dẫn đến tình trạng giảng viên và sinh viên không đồng bộ về phiên bản mới nhất.
- **Thiếu minh bạch trong chấm điểm:** Điểm số và nhận xét từ hội đồng phản biện thường không được lưu trữ tập trung, khó tra cứu về sau khi có khiếu nại hoặc kiểm định chất lượng.
- **Không kiểm soát được đạo văn:** Không có cơ chế tự động so sánh bài nộp với các đề tài đã bảo vệ trước đó hoặc với nguồn tài liệu học thuật, tạo ra kẽ hở nghiêm trọng về tính liêm chính học thuật.
- **Thư viện đề tài lãng phí tiềm năng:** Hàng nghìn khóa luận xuất sắc sau khi bảo vệ bị "chôn vùi" trong ổ cứng của phòng ban, không được khai thác để làm tài liệu tham khảo cho các thế hệ sinh viên tiếp theo.
- **Gánh nặng hành chính cho giảng viên:** Mỗi giảng viên hướng dẫn có thể quản lý 5–15 sinh viên khóa luận mỗi kỳ, việc theo dõi tiến độ, nhắc nhở mốc thời gian và tổng hợp báo cáo tốn rất nhiều thời gian.

**eThesis** được xây dựng nhằm giải quyết toàn diện các vấn đề trên thông qua một nền tảng web tập trung, hiện đại, được thiết kế riêng cho bối cảnh học thuật Việt Nam. Hệ thống tích hợp **Trí tuệ nhân tạo (Gemini AI)**, **thuật toán tìm kiếm ngữ nghĩa BM25/Elasticsearch**, **kiến trúc microservices bất đồng bộ** và một giao diện người dùng tinh tế sử dụng công nghệ React 19 tiên tiến nhất hiện nay.

---

## 🎯 Mục tiêu & Phạm vi hệ thống

### Mục tiêu tổng quát
Xây dựng một nền tảng phần mềm web toàn diện, tích hợp trí tuệ nhân tạo, phục vụ số hóa và tự động hóa toàn bộ vòng đời quản lý khóa luận tốt nghiệp tại các cơ sở giáo dục đại học — từ giai đoạn đăng ký đề tài ban đầu đến khi đề tài được xuất bản vào thư viện số học thuật.

### Mục tiêu cụ thể
1. **Số hóa quy trình:** Loại bỏ hoàn toàn việc dùng email/giấy tờ trong tất cả các bước: đăng ký đề tài, nộp bản thảo, phản biện, chấm điểm và phê duyệt.
2. **Phát hiện đạo văn tự động:** Triển khai pipeline 7 bước kiểm tra trùng lặp sử dụng Elasticsearch + BM25 kết hợp phát hiện nội dung do AI tạo ra (AI-generated content detection).
3. **Xây dựng thư viện học thuật số:** Tạo kho tàng đề tài có thể tìm kiếm toàn văn, phục vụ học thuật lâu dài cho toàn thể sinh viên và giảng viên.
4. **Hỗ trợ học tập chủ động:** Tích hợp môi trường luyện tập soạn thảo chương khóa luận theo định dạng chuẩn A4, giúp sinh viên làm quen với quy chuẩn trình bày trước khi nộp bài chính thức.
5. **Tăng trải nghiệm người dùng:** Xây dựng giao diện hiện đại, responsive, có micro-animations và hệ thống thông báo thời gian thực, đồng thời tích hợp khu vực giải trí (Mini-game Arena) để tạo sự cân bằng học tập — nghỉ ngơi cho sinh viên.

### Phạm vi hệ thống
Hệ thống phục vụ **3 nhóm người dùng chính** với quyền hạn và giao diện riêng biệt:

| Đối tượng | Vai trò | Số lượng tính năng chính |
|---|---|:---:|
| **Sinh viên (Student)** | Người dùng cuối — đăng ký, nộp bài, theo dõi tiến độ | 12 |
| **Giảng viên (Advisor/Lecturer)** | Hướng dẫn, phản biện, chấm điểm, quản lý thực hành | 9 |
| **Quản trị viên (Admin)** | Quản lý toàn hệ thống, cấu hình chính sách | 6 |

---

## 🔄 Vòng đời của một Khóa luận (Thesis Lifecycle)

Đây là trung tâm nghiệp vụ cốt lõi của toàn hệ thống. Mỗi khóa luận đi qua **7 trạng thái** được quản lý chặt chẽ bởi hệ thống máy trạng thái (State Machine) tích hợp trong backend:

```
  [Sinh viên tạo đề tài]
          │
          ▼
     ① PENDING          ← Đăng ký đề tài, chờ Admin phân công giảng viên
          │
          │  Admin assign Advisor
          ▼
    ② IN PROGRESS       ← Đang thực hiện. Sinh viên nộp bản thảo tiến độ,
          │                GV nhận xét, trao đổi qua hệ thống Comment
          │  Sinh viên bấm "Nộp chính thức"
          ▼
    ③ SUBMITTED         ← Bản nộp cuối cùng đã được ghi nhận
          │
          │  Hệ thống tự động đưa vào Queue kiểm tra đạo văn
          ▼
    ④ UNDER REVIEW      ← GV/Hội đồng đang chấm điểm, hệ thống BM25/ES
          │                đang chạy pipeline 7 bước kiểm tra trùng lặp
          │
          ├──────────────────────────────────────┐
          │ GV phê duyệt (Score ≥ ngưỡng)        │ GV từ chối hoặc
          ▼                                      │ yêu cầu sửa lại
    ⑤ APPROVED          ← Đạt, lưu vào thư viện  ▼
          │                                 ⑥ REJECTED / ⑦ REVISION
          ▼                                      │
   [Xuất bản Thư viện số]           [Sinh viên sửa bài → quay lại ③]
```

**Chi tiết các trạng thái:**
- `Pending` → Đề tài vừa được tạo, Admin chưa phân công giảng viên hướng dẫn.
- `InProgress` → Đề tài đang trong giai đoạn thực hiện. Sinh viên có thể upload nhiều bản thảo tiến độ, giảng viên comment và review từng bản.
- `Submitted` → Sinh viên đã bấm xác nhận nộp bài chính thức. Thời gian nộp (`SubmittedAt`) được ghi lại vào cơ sở dữ liệu.
- `UnderReview` → Bài đang trong hàng đợi kiểm duyệt. Hệ thống tự động chạy BM25/Elasticsearch trong nền qua RabbitMQ Queue.
- `Approved` → Hội đồng đã thông qua. Thời gian phê duyệt (`ApprovedAt`) được lưu. Đề tài được đưa vào Thư viện số.
- `Rejected` → Bị từ chối kèm lý do cụ thể (`RejectReason`). Sinh viên nhận thông báo và có thể nộp đề tài mới.
- `Revision` → Hội đồng yêu cầu sửa đổi. Sinh viên sửa bài và nộp lại để qua vòng review tiếp theo.

---

## 👥 Chi tiết các Phân hệ Người dùng

### 🧑‍🎓 Sinh viên (Student Portal)

Giao diện sinh viên được thiết kế theo phong cách **học thuật hiện đại (Academic-modern)**, ưu tiên sự rõ ràng, dễ điều hướng và khả năng tiếp cận thông tin nhanh chóng. Giao diện chính bao gồm:

**① Bảng điều khiển (Dashboard)**
Trang chủ Hero Banner hiển thị bộ sưu tập "Kho tàng Sáng kiến UEF". Tích hợp Bento Grid 4 thẻ hành động nhanh (Tra cứu, Chấm điểm, Gemini AI, Quản trị). Phần Tin tức & Thông báo lấy dữ liệu trực tiếp từ Admin Social Module, tự động cập nhật realtime qua `CustomEvent`.

**② Danh sách & Chi tiết Khóa luận (Thesis List & Detail)**
Tra cứu toàn bộ danh sách đề tài của bản thân kèm bộ lọc theo trạng thái và tìm kiếm theo tên. Trang chi tiết đề tài hiển thị toàn bộ lịch sử bình luận (Comments), các lần đánh giá (Reviews) của giảng viên và tất cả các phiên bản file đã nộp (Submissions).

**③ Tra cứu Thư viện số (Thesis Lookup)**
Tìm kiếm toàn văn trong kho đề tài của toàn trường. Bộ lọc thông minh theo: năm học, chuyên ngành, giảng viên hướng dẫn, trạng thái, điểm số. Tích hợp tính năng "Đọc nhanh" xem trích đoạn tóm tắt đề tài mà không cần tải file về.

**④ Phân tích & Thống kê (Analysis Page)**
Trang phân tích sử dụng biểu đồ Recharts hiển thị: xu hướng đề tài theo chuyên ngành qua các năm, phân bố điểm số, tỷ lệ đề tài được phê duyệt/từ chối/yêu cầu sửa, bản đồ nhiệt hoạt động nộp bài theo học kỳ.

**⑤ Thư viện cá nhân & Yêu thích (Favorites)**
Hệ thống đánh dấu và lưu trữ các đề tài tham khảo yêu thích, giúp sinh viên xây dựng danh sách tài liệu tham khảo cá nhân cho quá trình viết khóa luận.

**⑥ Cẩm nang học thuật (Guidelines Page)**
Bộ tài liệu hướng dẫn chuẩn hóa định dạng khóa luận: quy cách căn lề, font chữ Times New Roman 13pt, giãn dòng 1.5, chuẩn trích dẫn APA/IEEE, biểu mẫu bìa khóa luận, mẫu trang nhận xét giảng viên.

**⑦ Luyện tập soạn thảo (Practice Page)**
Sinh viên chọn một trong các Template chương khóa luận do giảng viên tạo sẵn (Chương 1, 2, 3...) và tập viết trong một **trình soạn thảo giả lập trang A4** với đúng font, cỡ chữ và lề theo chuẩn học thuật. Sau khi nộp, AI tự động chấm điểm sơ bộ (số từ, cấu trúc đề mục, văn phong) và giảng viên sẽ chấm điểm chính thức.

**⑧ Mini-game Arena**
Khu vực giải trí với 4 trò chơi trí tuệ: Cờ Vua vs AI (3 cấp độ Minimax), Nối Chữ Học Thuật (20 cấp), Solitaire Klondike và Tetris Blitz. Có nhạc nền, hiệu ứng âm thanh và hoạt hình kết quả ván đấu.

**⑨ Hồ sơ cá nhân & Kho tài liệu (Profile & File Vault)**
Trang hồ sơ tích hợp: thông tin cá nhân, ảnh đại diện, thống kê hoạt động học tập theo tuần/tháng, lưu trữ và quản lý tài liệu cá nhân (CV, chứng chỉ, đề cương nghiên cứu).

---

### 👩‍🏫 Giảng viên (Lecturer & Advisor Portal)

Giao diện Giảng viên sử dụng theme màu **Teal (xanh mòng két đậm)** — màu sắc học thuật trung tính, chuyên nghiệp. Tổ chức theo sidebar điều hướng cố định, tối ưu cho màn hình rộng và làm việc lâu dài.

**① Controller — Phân tích & Chấm điểm Đồ án (Thesis Analysis & Evaluation)**
Đây là trang nghiệp vụ quan trọng nhất của phân hệ Giảng viên. Giao diện 3 cột: (1) Hàng đợi chấm bài (Grading Queue) với bộ lọc trạng thái, (2) Khu vực phân tích đầy đủ với Bento Grid (Similarity Ring, Heatmap 10×6, So khớp song song), (3) Form chấm điểm Rubric 4 tiêu chí + Gemini AI gợi ý nhận xét tự động.

**② Quản lý Đề tài Sinh viên (Lecturer Theses)**
Danh sách toàn bộ đề tài của sinh viên đang được hướng dẫn. Chức năng phê duyệt/từ chối/yêu cầu sửa đổi đề tài đăng ký. Xem lịch sử trao đổi và file nộp của từng sinh viên.

**③ Thư viện Tài liệu Giảng viên (Lecturer Library)**
Quản lý kho tài liệu tham khảo phục vụ hướng dẫn: upload giáo trình, tài liệu nghiên cứu, bài báo khoa học. Phân loại theo chuyên ngành và mức độ phù hợp.

**④ Quản lý Luyện tập (Practice Manager)**
Tạo và quản lý các **Template chương khóa luận** dưới dạng HTML có cấu trúc sẵn (tiêu đề, đề mục bắt buộc, số từ tối thiểu). Xem và chấm điểm toàn bộ bài luyện tập sinh viên đã nộp. Giao diện chấm điểm hiển thị bài viết trên khung A4 giả lập song song với bảng rubric chấm điểm.

**⑤ Đề xuất Sự kiện (Event Proposal)**
Form đề xuất các sự kiện học thuật: đăng ký lịch bảo vệ thử, hội thảo chuyên đề, buổi seminar định kỳ. Admin xem xét và phê duyệt lịch.

**⑥ Báo cáo & Thống kê (Reports)**
Biểu đồ tổng hợp kết quả hướng dẫn khóa luận: phân bố điểm số, tỷ lệ đề tài đạt/không đạt, bảng xếp hạng Major Thesis Ranking — các đề tài xuất sắc nhất của khoa theo từng kỳ học.

---

### 👑 Quản trị viên (Admin Portal)

Giao diện Admin sử dụng theme **Dark (tối — nền slate-900)** nhất quán, mang cảm giác quyền lực và kiểm soát cao. Tất cả các thay đổi cấu hình có hiệu lực realtime trên toàn hệ thống.

**① Quản lý Người dùng & Phân quyền (User Management)**
CRUD đầy đủ cho toàn bộ tài khoản người dùng hệ thống. Lọc riêng theo vai trò (Sinh viên/Giảng viên). Kích hoạt/vô hiệu hóa tài khoản (`IsActive`). Phân công giảng viên hướng dẫn cho từng đề tài sinh viên (`AssignAdvisor`). Quản lý thành phần Hội đồng chấm (`Committee & CommitteeMembers`).

**② Cổng thông tin Học thuật & Mạng xã hội (Social Media / News Portal)**
Admin tạo và quản lý các bài đăng tin tức/thông báo hiển thị trên Portal sinh viên và đa kênh (Facebook, LinkedIn, Zalo). Đề tài xuất sắc sau khi được phê duyệt sẽ tự động gợi ý Admin tạo bài công bố.

**③ Cấu hình Quy trình Kiểm duyệt Đạo văn (Plagiarism Flow Config)**
Admin toàn quyền điều chỉnh Pipeline kiểm tra đạo văn: bật/tắt từng bước trong 7 bước, điều chỉnh các ngưỡng % cảnh báo (similarityReview, similarityFlag, aiReview, aiFlag), bật/tắt engine (BM25, Elasticsearch, Heatmap, So khớp song song), thiết lập thời gian tự động quét lại.

**④ Nhật ký Bảo mật (Login & Audit Logs)**
Ghi nhận toàn bộ lịch sử đăng nhập của tất cả người dùng (thời gian, IP, thiết bị). Theo dõi các hành động thay đổi dữ liệu quan trọng (xóa đề tài, thay đổi điểm số, phân quyền). Phục vụ kiểm định chất lượng và điều tra sự cố.

**⑤ Kiểm duyệt Thư viện số (Digital Library Manager)**
Phê duyệt hoặc hủy phê duyệt việc đưa một đề tài lên Thư viện công khai. Kiểm soát metadata hiển thị: ẩn/hiện tên sinh viên, giới hạn quyền tải file toàn văn.

---

## 🌟 Tính năng nổi bật (Key Features)

### 🧑‍🎓 Phân hệ Sinh viên (Student Portal)
- **Bảng điều khiển trực quan (Dashboard):** Theo dõi tiến trình làm khóa luận theo thời gian thực, xem các thông báo mới nhất và các mốc thời gian quan trọng (timeline).
- **Đăng ký & Nộp đề tài (Thesis Submission):** Đăng ký tên đề tài trực tuyến, tải lên các file báo cáo tiến độ/bản thảo khóa luận và nhận phản hồi trực tiếp từ giảng viên.
- **Tra cứu thư viện số (Thesis Lookup & Library):** Tra cứu và xem các đề tài xuất sắc từ những năm học trước với các bộ lọc thông minh (theo năm học, giảng viên hướng dẫn, chuyên ngành).
- **Phân tích số liệu (Analytics & Insights):** Biểu đồ trực quan hóa xu hướng nghiên cứu khoa học và thống kê điểm số qua các năm học bằng Recharts.
- **Khu vực giải trí (Mini-game Arena):** Trò chơi cờ vua (Chess) được tích hợp trực tiếp giúp sinh viên giải trí, rèn luyện tư duy chiến thuật ngay trên nền tảng.
- **Cẩm nang viết khóa luận (Academic Guidelines):** Cung cấp các tài liệu, biểu mẫu chuẩn mực để sinh viên dễ dàng định dạng và trình bày khóa luận đúng quy chuẩn.

### 👩‍🏫 Phân hệ Giảng viên (Lecturer & Advisor Portal)
- **Duyệt đăng ký đề tài:** Phê duyệt, góp ý hoặc định hướng lại đề tài đăng ký từ sinh viên.
- **Đánh giá & Chấm điểm (Reviews & Comments):** Cho điểm tiến độ, viết nhận xét phản biện và chấm điểm hội đồng một cách hệ thống.
- **Đề xuất sự kiện (Event Proposal):** Đăng ký lịch bảo vệ thử, hội thảo khoa học hoặc các cuộc họp thảo luận định kỳ.
- **Quản lý thực hành (Practice Manager):** Phân chia nhiệm vụ cụ thể cho từng sinh viên hướng dẫn, theo dõi chi tiết khối lượng công việc hoàn thành.
- **Xuất báo cáo tự động (Report Generator):** Tổng hợp và xuất báo cáo kết quả hướng dẫn khóa luận của toàn bộ sinh viên phụ trách dưới dạng bảng biểu chuyên nghiệp.

### 👑 Phân hệ Quản trị viên (Administrator Portal)
- **Quản lý người dùng (User & Role Management):** Thêm mới, phân quyền và quản lý danh sách toàn bộ Sinh viên, Giảng viên và phân công Hội đồng chấm khóa luận.
- **Kiểm soát đạo văn (Plagiarism Check Flow):** Quy trình kiểm duyệt và tích hợp check đạo văn thông minh cho các bản thảo báo cáo cuối cùng trước khi đưa ra hội đồng.
- **Lưu vết hệ thống (Login & Audit Logs):** Giám sát bảo mật, ghi nhận lịch sử truy cập và mọi hoạt động thay đổi cấu hình dữ liệu của người dùng.
- **Quản lý thư viện xuất bản (Digital Library Manager):** Quản lý trạng thái công bố rộng rãi đối với các đề tài đạt điểm giỏi trở lên lên cổng thông tin khoa học của trường.

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### 🎨 Frontend
- **Core Library:** React 19 (Phiên bản mới nhất)
- **Build Tool:** Vite (Tối ưu tốc độ tải và xây dựng dự án siêu nhanh)
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4 + PostCSS (Thiết kế hiện đại, mượt mà, hỗ trợ Responsive tuyệt đối)
- **Animations:** Framer Motion (Các chuyển động mượt mà và hiệu ứng micro-interactions cao cấp)
- **Data Visualization:** Recharts (Vẽ biểu đồ thống kê chuyên nghiệp)
- **Icons:** Lucide React
- **Mini-game:** Chess.js & React-Chessboard

### ⚙️ Backend & Database
- **Framework:** ASP.NET Core 8.0 Web API
- **Architecture:** Thiết kế theo kiến trúc dịch vụ sạch (Clean Service-Oriented Architecture), chia nhỏ dự án thành các module độc lập bao gồm `PlatformAdmin` (Cốt lõi), `Notification` (Thông báo) và `SocialMedia` (Tương tác học thuật).
- **ORM:** Entity Framework Core (Code First approach)
- **Databases:** 
  - **Microsoft SQL Server (LocalDB)** - Cấu hình mặc định cho môi trường phát triển cục bộ.
  - **PostgreSQL** - Hỗ trợ chuyển đổi nhanh chóng qua cấu hình `Provider` trong file settings.
- **Search Engine:** Tích hợp sẵn ElasticSearch (tùy chọn) để hỗ trợ tìm kiếm toàn văn (full-text search) tài liệu khóa luận với hiệu suất tối đa.
- **Bảo mật & Xác thực:** JWT Token Bearer Authentication, băm mật khẩu bảo mật bằng thư viện BCrypt.NET.
- **Tài liệu API:** Swagger Open API (hỗ trợ kiểm thử trực tiếp các RESTful Endpoint).

---

## 📂 Cấu trúc mã nguồn (Folder Structure)
```text
Thesis Management/
├── client/                     # Mã nguồn Frontend (React SPA)
│   ├── public/                 # Các tài nguyên tĩnh công khai (logo, ảnh minh họa)
│   ├── src/
│   │   ├── components/         # Layout chung và các Custom Component tái sử dụng
│   │   ├── pages/              # Các phân hệ trang chính
│   │   │   ├── admin/          # Trang quản trị của Admin (Users, Audit, Plagiarism, Library)
│   │   │   └── lecturer/       # Trang quản trị của Giảng viên (Controller, Library, Practice)
│   │   ├── services/           # Service kết nối API và xử lý gọi Axios Axios
│   │   ├── index.css           # Cấu hình Tailwind CSS và Design Tokens
│   │   └── App.jsx             # Cấu hình định tuyến (React Router)
│   └── package.json            # Quản lý dependencies của Frontend
│
├── src/                        # Mã nguồn Backend (ASP.NET Core 8 Web API)
│   ├── PlatformAdmin/          # Dịch vụ lõi quản lý thông tin chính của hệ thống
│   │   ├── Controllers/        # Các API Controller xử lý Request/Response
│   │   ├── Data/               # Cấu hình DbContext và seeding dữ liệu mẫu
│   │   ├── Entities/           # Lớp thực thể ánh xạ xuống cơ sở dữ liệu
│   │   ├── Services/           # Logic nghiệp vụ xử lý chính (Auth, Theses, Reviews)
│   │   └── appsettings.json    # File cấu hình Database Connection và JWT
│   │
│   ├── Notification/           # Module chuyên biệt quản lý và gửi thông báo
│   └── SocialMedia/            # Module tương tác, bình luận, mạng xã hội học thuật
│
└── eThesis.sln                 # File giải pháp Visual Studio Solution của dự án
```

---

## 🔑 Tài khoản dùng thử (Seeded Accounts)
Hệ thống đi kèm cơ chế tự động gieo dữ liệu mẫu (Database Seeding) khi khởi chạy lần đầu tiên. Bạn có thể sử dụng các tài khoản kiểm thử sau để trải nghiệm đầy đủ các góc nhìn phân quyền khác nhau:

| Vai trò (Role) | Email đăng nhập | Mật khẩu (Password) | Tính năng trải nghiệm nổi bật |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@ethesis.edu.vn` | `admin123` | Phân quyền tài khoản, xem Audit Logs đăng nhập, chạy quy trình Plagiarism, kiểm duyệt thư viện. |
| **Giảng viên (Advisor)** | `advisor@ethesis.edu.vn` | `advisor123` | Phê duyệt đề tài sinh viên đăng ký, chấm điểm tiến độ, chấm điểm hội đồng, giao bài thực hành. |
| **Sinh viên (Student)** | `student@ethesis.edu.vn` | `student123` | Đăng ký đề tài mới, nộp tài liệu khóa luận, kiểm tra hướng dẫn viết tài liệu, chơi game cờ vua. |

---

## 🚀 Hướng dẫn khởi chạy dự án (Getting Started)

### 1. Khởi chạy Backend (ASP.NET Core API)

**Yêu cầu:** Đã cài đặt [ .NET 8 SDK ](https://dotnet.microsoft.com/download/dotnet/8.0).

1. Mở Terminal mới tại thư mục gốc của dự án.
2. Di chuyển vào thư mục của dịch vụ chính:
   ```bash
   cd src/PlatformAdmin
   ```
3. Cấu hình cơ sở dữ liệu mong muốn trong `appsettings.json`:
   - Mặc định, hệ thống được cấu hình chạy trên **SQL Server LocalDB**: `Server=(localdb)\mssqllocaldb;Database=eThesisProjectDb;Trusted_Connection=True;...`
   - Nếu muốn chuyển sang **PostgreSQL**, thay đổi giá trị `"Provider": "PostgreSQL"` tại dòng 10 và cập nhật thông tin đăng nhập Postgres của bạn trong `"PostgreSqlConnection"`.
4. Áp dụng Database Migration để khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu:
   ```bash
   dotnet ef database update
   ```
5. Chạy dự án:
   ```bash
   dotnet run
   ```
6. API sẽ khởi chạy thành công tại địa chỉ mặc định `https://localhost:7198` hoặc `http://localhost:5221`. Bạn có thể truy cập ngay `https://localhost:7198/swagger/index.html` để khám phá và thử nghiệm trực quan tài liệu API.

---

### 2. Khởi chạy Frontend (React SPA)

**Yêu cầu:** Đã cài đặt [ Node.js ](https://nodejs.org/) (Khuyến nghị phiên bản LTS v18 trở lên).

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục client:
   ```bash
   cd client
   ```
2. Thực hiện cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động môi trường phát triển local:
   ```bash
   npm run dev
   ```
4. Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:5173`. Truy cập địa chỉ này trên trình duyệt web của bạn và đăng nhập bằng một trong ba tài khoản dùng thử ở trên để bắt đầu trải nghiệm!

---

## 🧠 Kiến trúc kỹ thuật chuyên sâu (Technical Architecture Deep-Dive)

Phần này giải thích chi tiết dòng chảy nghiệp vụ, thuật toán cốt lõi và cách thức xử lý của 4 phân hệ kỹ thuật quan trọng nhất trong hệ thống.

---

### 1. 🔍 Cơ chế Tìm kiếm & So khớp Trùng lặp — Elasticsearch & BM25

Khi sinh viên nộp tài liệu khóa luận, hệ thống không dùng tìm kiếm từ khóa thông thường mà kết hợp **Elasticsearch** làm kho chỉ mục phân tán và chạy thuật toán xếp hạng **BM25 (Best Matching 25)** để phát hiện đạo văn một cách chính xác và có trọng số ngữ nghĩa.

#### 📐 Thuật toán BM25 — Cách tính điểm tương đồng

BM25 là thuật toán xếp hạng nâng cấp từ TF-IDF truyền thống, tính toán mức độ tương đồng dựa trên 3 thành phần:

**a) Tần suất thuật ngữ có kiểm soát bão hòa (Saturated Term Frequency)**

Ở TF-IDF thông thường, một từ xuất hiện 100 lần ghi điểm cao gấp 100 lần một từ xuất hiện 1 lần — dễ bị lạm dụng. BM25 kiểm soát bằng tham số `k1` (thường `1.2 – 2.0`): sau khi tần suất vượt ngưỡng, điểm số bão hòa và không tăng thêm.

**b) Tần suất tài liệu nghịch đảo (Inverse Document Frequency)**

Những từ xuất hiện ở quá nhiều tài liệu trong kho (`"nghiên cứu"`, `"kết quả"`, `"đề tài"`) bị giảm trọng số nặng. Ngược lại, các cụm từ kỹ thuật chuyên sâu và đặc thù (`"sparse attention mechanism"`, `"contrastive learning"`) được chấm điểm tương đồng rất cao khi xuất hiện trùng lặp.

**c) Chuẩn hóa độ dài tài liệu (Document Length Normalization)**

Tài liệu dài có xác suất chứa nhiều từ trùng lặp hơn tài liệu ngắn. BM25 dùng tham số `b` (thường `0.75`) để phạt điểm các khóa luận quá dài so với độ dài trung bình của kho tài liệu, đảm bảo sự công bằng giữa các đề tài có độ dài khác nhau.

#### 🔄 Luồng xử lý truy vấn tìm kiếm

```
[Tài liệu nộp vào]
        │
        ▼
[Phân tích cú pháp & Tách từ (Tokenization)]
   - Chuẩn hóa Unicode, bỏ dấu câu
   - Tách câu thành các n-gram (2–4 từ liên tiếp)
   - Lọc Stop Words tiếng Việt & tiếng Anh
        │
        ▼
[Gửi truy vấn đa luồng lên Elasticsearch Cluster]
   - Chia tài liệu thành các phân đoạn (chunks) 512 token
   - Chạy song song N truy vấn BM25 lên chỉ mục kho khóa luận
        │
        ▼
[Tổng hợp kết quả & Tính điểm tương đồng tổng thể]
   - Lấy Top-K nguồn trùng khớp cao nhất
   - Tính tỷ lệ % trùng lặp tổng thể
   - Lập danh sách nguồn đối chiếu (source list)
        │
        ▼
[Trả về Similarity Score, Heatmap Data, Source List]
```

#### 📊 Bản đồ nhiệt trùng lặp (Similarity Heatmap 10×6)

Kết quả BM25 được trực quan hóa thành bản đồ nhiệt **10 cột × 6 hàng (60 ô)** trên giao diện phân tích của Giảng viên. Toàn bộ tài liệu được chia đều thành 60 phân đoạn tương ứng với 60 ô. Độ đậm màu Teal (`rgba(17, 94, 89, opacity)`) của mỗi ô biểu thị trực tiếp tỷ lệ trùng lặp của phân đoạn đó — nhìn vào Heatmap, Giảng viên lập tức biết sinh viên chép văn bản tập trung ở phần nào của khóa luận (ví dụ: ô đầu tiên tối màu = Chương 1 Lý thuyết bị sao chép nặng; các ô cuối sáng màu = Chương thực nghiệm tự viết).

---

### 2. 📨 Xử lý Bất đồng bộ & Hàng đợi Tác vụ — RabbitMQ

Việc xử lý một file khóa luận lớn (đọc PDF/DOCX, tách từ, gửi hàng nghìn truy vấn lên Elasticsearch, phân tích AI) tốn nhiều CPU/RAM và mất từ 10 giây đến vài phút. Nếu xử lý đồng bộ (Synchronous) trực tiếp trên API Request, người dùng bị nghẽn và server có nguy cơ sập khi nhiều sinh viên nộp bài cùng lúc vào mùa cao điểm.

**RabbitMQ** đóng vai trò **Message Broker** tách biệt hoàn toàn luồng nhận yêu cầu khỏi luồng xử lý nặng:

```
┌─────────────────────────────────────────────────────────────┐
│                   LUỒNG NHẬN YÊU CẦU (Tức thì)             │
│                                                             │
│  Sinh viên ──► PlatformAdmin API ──► Lưu DB (Chờ quét)     │
│                       │                                     │
│                       └──► Đẩy Message vào RabbitMQ Queue  │
│                       │                                     │
│                       └──► Phản hồi ngay: "Nộp thành công" │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (Bất đồng bộ - Async)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 LUỒNG XỬ LÝ NỀN (Worker Service)           │
│                                                             │
│  RabbitMQ Queue                                             │
│       │                                                     │
│       ├──► Worker lấy Message ra xử lý                     │
│       │         │                                           │
│       │         ├──► Đọc file PDF/DOCX                     │
│       │         ├──► Tách từ & Chuẩn hóa văn bản           │
│       │         ├──► Chạy BM25 / Elasticsearch             │
│       │         ├──► Phát hiện AI-generated content        │
│       │         └──► Cập nhật kết quả vào Database         │
│       │                                                     │
│       └──► Notification Service gửi Push Notification      │
│                 tới Giảng viên & Sinh viên (SignalR/WS)     │
└─────────────────────────────────────────────────────────────┘
```

**Lợi ích kiến trúc:**
- **High Availability:** Hệ thống không bao giờ bị timeout ở phía người dùng, dù tác vụ xử lý mất bao lâu.
- **Horizontal Scaling:** Khi vào mùa cao điểm nộp bài (cuối kỳ), chỉ cần tăng số lượng Worker consumer để giải quyết hàng đợi nhanh hơn mà không cần thay đổi code.
- **Fault Tolerance:** Nếu Worker bị lỗi giữa chừng, RabbitMQ tự động đẩy lại Message vào queue (Dead Letter Queue) để xử lý lại, đảm bảo không bao giờ mất dữ liệu.
- **Auto Recheck:** Hệ thống được cấu hình tự động quét lại bài nộp sau một khoảng thời gian định kỳ (mặc định 24 giờ) để cập nhật so sánh với các khóa luận mới được thêm vào kho.

---

### 3. 🛡️ Quy trình Kiểm duyệt Đạo văn 7 bước (Plagiarism Detection Pipeline)

Toàn bộ quy trình kiểm duyệt được quản lý bởi Admin thông qua trang cấu hình Pipeline và thực thi tại giao diện phân tích của Giảng viên (Controller Page).

#### 📋 7 Bước Pipeline

| # | Bước | Mô tả kỹ thuật |
|---|------|----------------|
| 1 | **Nộp bài** | Sinh viên upload PDF/DOCX. File được lưu vào thư mục `/uploads` qua Static Files middleware của ASP.NET Core. |
| 2 | **Hàng đợi** | API tạo record `ThesisSubmission` với trạng thái `pending`, đẩy Message `{submissionId}` vào RabbitMQ. Giảng viên thấy bài xuất hiện trong "Hàng đợi chấm". |
| 3 | **BM25 / ES** | Worker đọc file, tách văn bản thành chunks 512 token, gửi truy vấn BM25 lên Elasticsearch index `ethesis-theses`, lấy Top-K nguồn tương đồng nhất. |
| 4 | **Heatmap** | Tính tỷ lệ trùng lặp từng phân đoạn, dựng mảng 60 giá trị `opacity` để render lưới nhiệt 10×6. |
| 5 | **So khớp song song** | Hiển thị giao diện so sánh 2 cột: bên trái là văn bản của sinh viên (tô màu đoạn bị phát hiện), bên phải là đoạn trích nguồn gốc tương ứng. |
| 6 | **AI Detect** | Phân tích 2 chỉ số: **Perplexity** (văn bản AI có độ phức tạp thấp, từ ngữ đều đặn) và **Burstiness** (văn bản người có sự đột biến về độ dài câu). Trả về `aiPercent` (%). |
| 7 | **Chấm điểm** | Giảng viên chấm theo Rubric 4 tiêu chí (Nội dung, Phương pháp, Tính mới, Trình bày). Gemini AI tự động gợi ý nhận xét phản biện dựa trên kết quả phân tích. |

#### 🚥 Tự động phân loại trạng thái theo ngưỡng cấu hình

Admin cấu hình các ngưỡng % trực tiếp trên giao diện quản trị. Hệ thống tự động áp nhãn trạng thái:

| Trạng thái | Điều kiện | Hành động tự động |
|---|---|---|
| `pending` | Vừa nộp, chưa quét | Đưa vào RabbitMQ Queue |
| `acceptable` | Trùng lặp < 25% & AI < 35% | Cho phép tiến hành bảo vệ |
| `review` | Trùng lặp 25–40% hoặc AI 35–60% | Yêu cầu Giảng viên xem xét thủ công |
| `flagged` | Trùng lặp > 40% hoặc AI > 60% | Khóa đề tài, thông báo sinh viên phải sửa lại |

> **Lưu ý về tính linh hoạt:** Tất cả các ngưỡng % (similarityReview, similarityFlag, aiReview, aiFlag) đều có thể chỉnh sửa realtime bởi Admin. Thay đổi có hiệu lực ngay lập tức trên trang phân tích của tất cả Giảng viên nhờ cơ chế `window.addEventListener('admin-content-updated', ...)` đồng bộ qua LocalStorage.

---

### 4. 🎮 Phân hệ Mini-game Arena — Giải trí Tích hợp cho Sinh viên

Nhằm tăng khả năng gắn bó người dùng (User Retention) và tạo không gian nghỉ ngơi khỏi áp lực học thuật, hệ thống tích hợp 4 trò chơi trí tuệ có âm thanh và hiệu ứng hoạt hình ngay trong trang cá nhân sinh viên, không cần rời khỏi nền tảng.

#### ♟️ Game 1: Cờ Vua vs AI (3 cấp độ Minimax)

Game cờ vua được xây dựng thuần túy bằng React và `chess.js`, **không phụ thuộc bất kỳ thư viện đồ họa bàn cờ nặng** nào:

**Kiến trúc kỹ thuật:**
- **Điều phối luật chơi:** Thư viện `chess.js` quản lý toàn bộ trạng thái bàn cờ qua ký pháp FEN (Forsyth-Edwards Notation), tự động kiểm tra hợp lệ 100% các nước đi đặc biệt: nhập thành, bắt tốt qua đường (en passant), phong tốt, chiếu bí, hòa cờ (Stalemate, 50-move rule, Triple Repetition).
- **Giao diện render tùy biến:** Bàn cờ được render bằng CSS Grid thuần (`8×8 div`), quân cờ hiển thị bằng ký tự Unicode cổ điển (`♔♕♖♗♘♙♚♛♜♝♞♟`). Khi người chơi chọn quân, hệ thống hiển thị **gợi ý nước đi hợp lệ** bằng chấm tròn màu xanh (nước đi bình thường) hoặc vòng tròn viền (nước đi ăn quân).
- **Đồng hồ đếm ngược:** Người chơi có 15 phút (900 giây). Khi hết giờ, trận đấu kết thúc ngay lập tức với kết quả thua cuộc.

**Cơ chế 3 cấp độ AI:**

| Cấp độ | Thuật toán | Mô tả |
|---|---|---|
| **Dễ** | Random | Bot lấy toàn bộ nước đi hợp lệ, chọn ngẫu nhiên 1 nước bằng `Math.random()`. Phù hợp cho người mới học. |
| **Trung bình** | Greedy Evaluation | Bot duyệt qua toàn bộ nước đi, chọn nước nào ăn được quân cờ có giá trị điểm cao nhất (Tốt: 10, Mã/Tượng: 30, Xe: 50, Hậu: 90, Vua: 900). |
| **Chuyên nghiệp** | Minimax Depth-2 | Bot xây dựng cây quyết định tìm kiếm sâu 2 lớp. Ở mỗi nhánh, Bot tối đa hóa điểm số của mình trong khi giả định người chơi sẽ tối thiểu hóa điểm đó (chiến lược đối kháng tối ưu). Gần như không thể thắng. |

```
Minimax(depth=2):
  Bot tính tất cả nước đi của mình (lớp 1)
    └── Với mỗi nước đi đó, tính các nước đáp trả của người chơi (lớp 2)
          └── Đánh giá bàn cờ sau 2 lớp bằng hàm evalBoard()
  Bot chọn nước đi dẫn đến trạng thái tốt nhất sau khi người chơi
  đã đáp trả thông minh nhất có thể.
```

**Hệ thống âm thanh đa giác quan:** Mỗi sự kiện trong game kích hoạt một âm thanh phản hồi riêng biệt: tiếng di chuyển quân (`chessMove`), tiếng ăn quân (`chessCapture`), tiếng chuông chiếu tướng (`chessCheck`), nhạc chiến thắng (`chessWin`), và nhạc thất bại (`chessLose`). Nhạc nền riêng cho phân hệ cờ vua được phát suốt ván đấu qua `startGameMusic('chess')`.

---

#### 🔤 Game 2: Nối Chữ Học Thuật (Academic Word Chain)

- Sinh viên thi đấu với hệ thống bằng cách nối các từ tiếng Anh chuyên ngành. Ví dụ: *Algorithm* ➔ *Machine* ➔ *Evaluation* ➔ *Network* ➔ *Knowledge*...
- Hệ thống sử dụng bộ từ điển lưu sẵn gồm hàng nghìn thuật ngữ nghiên cứu khoa học, giúp sinh viên vừa giải trí vừa ôn luyện từ vựng học thuật phục vụ viết Abstract khóa luận bằng tiếng Anh.
- Có **20 cấp độ** với tốc độ đếm ngược tăng dần theo cấp.

---

#### 🃏 Game 3: Solitaire Klondike (Chill Mode)

- Trò chơi xếp bài cổ điển Klondike với đầy đủ luật chơi: 7 cột Tableau, 4 ô Foundation (sắp xếp theo suit từ Ace đến King), và bộ bài Stock.
- Không có giới hạn thời gian — chế độ **"Chill Mode"** cho sinh viên thư giãn hoàn toàn sau các buổi viết luận căng thẳng.

---

#### 🟦 Game 4: Tetris Blitz (10 cấp độ tốc độ)

- Tetris với cơ chế tính điểm theo combo: xóa 1 hàng = 100 điểm, xóa 4 hàng cùng lúc (Tetris) = 800 điểm × level multiplier.
- **10 cấp độ** với tốc độ rơi khối tăng theo cấp số nhân — thử thách phản xạ và khả năng tư duy không gian 3D của sinh viên.

---

#### 📊 Ghi nhận Hoạt động Game vào Thống kê Cá nhân

Mỗi khi sinh viên mở bất kỳ trò chơi nào, hệ thống tự động ghi nhận hoạt động thông qua hàm `logStudentActivity('game_play', { game: id })`. Dữ liệu này được tổng hợp vào biểu đồ **"Thống kê hoạt động"** trên trang Hồ sơ cá nhân, giúp sinh viên theo dõi sự cân bằng giữa thời gian học tập và thời gian nghỉ ngơi trong quá trình làm khóa luận.

---

*Chúc bạn có những trải nghiệm tuyệt vời và nghiên cứu khoa học hiệu quả cùng **eThesis**!* 🎓🚀
