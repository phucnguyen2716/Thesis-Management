# TÀI LIỆU CHI TIẾT 30 LUỒNG QUY TRÌNH HỆ THỐNG THƯ VIỆN SỐ (ETHESIS PORTAL)

Tài liệu này mô tả chi tiết từng bước (Workflow) của 30 luồng quy trình nghiệp vụ và hệ thống trong ứng dụng Cổng tra cứu và Quản lý thư viện Khóa luận eThesis.

---

## NHÓM 1: TRA CỨU & ĐỌC TÀI LIỆU (LUỒNG 1 - 10)

### Luồng 1: Đăng nhập và xác thực tài khoản độc giả
* **Actor**: Sinh viên, Giảng viên, Thủ thư.
* **Mô tả**: Xác thực tài khoản người dùng và phân quyền truy cập hệ thống.
* **Các bước thực hiện**:
  1. Người dùng nhập Email và Mật khẩu tại trang `/login`.
  2. Frontend gửi request POST `/api/auth/login`.
  3. Backend kiểm tra tài khoản trong Database PostgreSQL, so sánh hash mật khẩu BCrypt.
  4. Nếu hợp lệ, Backend sinh mã JWT token và trả về Frontend.
  5. Frontend lưu token vào LocalStorage và chuyển hướng về trang chủ.
* **Kết quả**: Đăng nhập thành công.

### Luồng 2: Đăng xuất và kết thúc phiên làm việc
* **Actor**: Độc giả.
* **Mô tả**: Xóa phiên làm việc hiện tại để bảo mật tài khoản.
* **Các bước thực hiện**:
  1. Người dùng bấm nút "Đăng xuất" trên menu.
  2. Frontend client xóa JWT token khỏi LocalStorage.
  3. Frontend chuyển hướng người dùng về trang `/login`.
* **Kết quả**: Kết thúc phiên làm việc thành công.

### Luồng 3: Tìm kiếm khóa luận bằng Elasticsearch
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Tìm kiếm nhanh các khóa luận bằng từ khóa trên trang tra cứu.
* **Các bước thực hiện**:
  1. Độc giả nhập từ khóa tại thanh tìm kiếm trên trang `/lookup`.
  2. Frontend client gửi request GET `/api/theses/search`.
  3. Elasticsearch thực hiện tìm kiếm full-text search trên index khóa luận.
  4. Frontend nhận kết quả và hiển thị danh sách khóa luận khớp từ khóa.
* **Kết quả**: Hiển thị kết quả tìm kiếm tức thời.

### Luồng 4: Lọc khóa luận theo Chuyên ngành & Giảng viên
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Thu hẹp phạm vi tìm kiếm bằng các bộ lọc chuyên môn.
* **Các bước thực hiện**:
  1. Độc giả chọn Chuyên ngành hoặc tên Giảng viên hướng dẫn trên thanh bộ lọc.
  2. Frontend gửi API request kèm theo các tham số query (major, advisor).
  3. Backend thực hiện truy vấn cơ sở dữ liệu PostgreSQL để lọc bản ghi khóa luận.
  4. Frontend cập nhật lại danh sách hiển thị tương ứng.
* **Kết quả**: Hiển thị danh sách khóa luận đã lọc.

### Luồng 5: Xem chi tiết thông tin khóa luận
* **Actor**: Độc giả.
* **Mô tả**: Xem thông tin metadata đầy đủ và tóm tắt đề tài của khóa luận.
* **Các bước thực hiện**:
  1. Độc giả bấm vào tiêu đề khóa luận trên kết quả tìm kiếm.
  2. Frontend chuyển hướng đến trang chi tiết `/thesis/{id}`.
  3. Backend tải metadata (tên SV, GVHD, chuyên ngành, abstract, từ khóa).
  4. Frontend hiển thị thông tin chi tiết và liên kết đọc/tải.
* **Kết quả**: Màn hình thông tin chi tiết khóa luận hiển thị đầy đủ.

### Luồng 6: Đọc trực tuyến bằng tài liệu Flipbook 3D
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Đọc trực tiếp báo cáo khóa luận trên trình duyệt qua giao diện lật sách 3D.
* **Các bước thực hiện**:
  1. Độc giả bấm nút "Đọc trực tuyến" trên trang chi tiết khóa luận.
  2. Frontend gọi API để lấy link file PDF tạm thời.
  3. Trình xem Flipbook trên Frontend thực hiện render các trang tài liệu dạng 3D.
* **Kết quả**: Đọc tài liệu trực tuyến thành công.

### Luồng 7: Tải file tài liệu PDF gốc về máy
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Tải file báo cáo PDF gốc về thiết bị cá nhân.
* **Các bước thực hiện**:
  1. Độc giả bấm nút "Tải xuống báo cáo" trên giao diện chi tiết.
  2. Backend kiểm tra quyền tải của tài khoản (dựa trên phân loại tài liệu).
  3. Dịch vụ lưu trữ Google Drive stream file PDF về trình duyệt.
  4. Frontend tiến hành lưu file trực tiếp vào thiết bị của người dùng.
* **Kết quả**: File PDF được tải xuống thành công.

### Luồng 8: Đánh dấu lưu tài liệu yêu thích
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Lưu trữ khóa luận hữu ích vào thư viện cá nhân để xem lại sau.
* **Các bước thực hiện**:
  1. Độc giả bấm nút hình Trái tim tại trang chi tiết hoặc danh sách.
  2. Frontend gửi yêu cầu POST `/api/favorites` kèm Thesis ID.
  3. Backend tạo bản ghi liên kết mới trong bảng `Favorites`.
  4. Frontend chuyển trạng thái nút lưu thành màu đỏ để báo hiệu thành công.
* **Kết quả**: Khóa luận được đánh dấu lưu thành công.

### Luồng 9: Xem danh sách khóa luận đã đánh dấu lưu
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Truy cập và xem lại toàn bộ các khóa luận đã bookmark trước đó.
* **Các bước thực hiện**:
  1. Độc giả bấm vào mục "Tài liệu đã lưu" (`/favorites`).
  2. Backend truy vấn các bản ghi yêu thích liên kết với User ID.
  3. Frontend hiển thị danh sách khóa luận đã lưu dạng card.
* **Kết quả**: Hiển thị danh sách khóa luận yêu thích cá nhân.

### Luồng 10: Chia sẻ liên kết khóa luận
* **Actor**: Độc giả.
* **Mô tả**: Chia sẻ liên kết của khóa luận cho người khác.
* **Các bước thực hiện**:
  1. Độc giả bấm nút "Chia sẻ" tại trang chi tiết.
  2. Frontend client tự động sao chép URL của trang chi tiết vào Clipboard.
  3. Frontend hiển thị thông báo đã sao chép liên kết thành công.
* **Kết quả**: Sao chép liên kết thành công.

---

## NHÓM 2: ĐỀ XUẤT & CÁ NHÂN HÓA (LUỒNG 11 - 20)

### Luồng 11: Xem hồ sơ học tập cá nhân độc giả
* **Actor**: Sinh viên / Độc giả.
* **Mô tả**: Xem thông tin tài khoản cá nhân, niên khóa, ngành học.
* **Các bước thực hiện**:
  1. Độc giả vào mục Hồ sơ cá nhân (`/profile`).
  2. Backend tải dữ liệu chi tiết người dùng từ cơ sở dữ liệu.
  3. Frontend hiển thị họ tên, email, khoa, chuyên ngành học.
* **Kết quả**: Hiển thị hồ sơ cá nhân độc giả.

### Luồng 12: Phân tích sở thích đọc (Interest Profile)
* **Actor**: Hệ thống / Frontend client.
* **Mô tả**: Phân tích hành vi xem và lưu khóa luận để hiểu xu hướng học tập của sinh viên.
* **Các bước thực hiện**:
  1. Hệ thống thu thập thống kê lượt tương tác (xem, tải, lưu) của độc giả.
  2. Frontend tổng hợp số lượt theo chuyên ngành và theo các thẻ từ khóa (tags).
  3. Hiển thị biểu đồ phân tích sở thích (Interest Profile) giúp sinh viên nhận biết thế mạnh học tập.
* **Kết quả**: Biểu đồ sở thích hiển thị thành công.

### Luồng 13: Gợi ý khóa luận thông minh (Recommendation)
* **Actor**: Hệ thống / Frontend client.
* **Mô tả**: Tự động đề xuất các khóa luận phù hợp với sở thích đọc của độc giả.
* **Các bước thực hiện**:
  1. Frontend gửi dữ liệu sở thích (Interest Profile) của người dùng lên API.
  2. Backend gọi Elasticsearch thực hiện tìm kiếm các tài liệu liên quan đến tags/chuyên ngành yêu thích.
  3. Frontend hiển thị danh sách gợi ý cá nhân hóa tại trang chủ hoặc trang yêu thích.
* **Kết quả**: Danh sách khóa luận gợi ý hiển thị thành công.

### Luồng 14: Tra cứu khóa luận theo giảng viên hướng dẫn
* **Actor**: Độc giả.
* **Mô tả**: Tìm kiếm các khóa luận được hướng dẫn bởi một giảng viên cụ thể.
* **Các bước thực hiện**:
  1. Độc giả bấm chọn tên Giảng viên hướng dẫn tại trang thông tin chi tiết.
  2. Backend thực hiện truy vấn cơ sở dữ liệu lọc các đề tài có Advisor ID tương ứng.
  3. Frontend cập nhật giao diện hiển thị danh sách các đề tài của giảng viên đó.
* **Kết quả**: Hiển thị danh sách đề tài của giảng viên.

### Luồng 15: Xem tài liệu hướng dẫn sử dụng thư viện
* **Actor**: Độc giả.
* **Mô tả**: Xem hướng dẫn tra cứu tài liệu và quy định sử dụng thư viện số.
* **Các bước thực hiện**:
  1. Độc giả bấm vào mục "Hướng dẫn sử dụng" (`/guidelines`).
  2. Frontend tải file markdown nội dung hướng dẫn từ máy chủ.
  3. Giao diện render nội dung hướng dẫn trực quan cho người dùng.
* **Kết quả**: Xem tài liệu hướng dẫn thành công.

### Luồng 16: Hỏi đáp gợi ý tài liệu qua Chatbot AI
* **Actor**: Độc giả / Chatbot AI.
* **Mô tả**: Hỏi đáp tự nhiên với AI để tìm kiếm tài liệu thay vì tìm kiếm thủ công.
* **Các bước thực hiện**:
  1. Độc giả gửi câu hỏi yêu cầu tìm kiếm (ví dụ: "Tìm các bài nghiên cứu về Machine Learning").
  2. Backend gọi API Gemini AI để phân tích ý định và các từ khóa cốt lõi.
  3. Hệ thống truy vấn Elasticsearch lấy ra các khóa luận phù hợp nhất.
  4. Trả câu trả lời tự nhiên kèm liên kết của các khóa luận đề xuất.
* **Kết quả**: Nhận được phản hồi gợi ý thông minh từ Chatbot AI.

### Luồng 17: Gửi yêu cầu hỗ trợ tài liệu lên thủ thư
* **Actor**: Độc giả / Thủ thư.
* **Mô tả**: Yêu cầu hỗ trợ tìm kiếm tài liệu đặc thù hoặc báo lỗi hệ thống.
* **Các bước thực hiện**:
  1. Độc giả điền form yêu cầu tại mục Support.
  2. Backend lưu thông tin yêu cầu vào bảng `SupportRequests` với trạng thái Chờ phản hồi.
  3. Hệ thống gửi email tự động thông báo cho thủ thư thư viện.
* **Kết quả**: Gửi yêu cầu thành công, chờ phản hồi từ thủ thư.

### Luồng 18: Theo dõi lịch hoạt động của thư viện số
* **Actor**: Độc giả.
* **Mô tả**: Theo dõi lịch làm việc, lịch giới thiệu đề tài, hoặc lịch bảo trì hệ thống.
* **Các bước thực hiện**:
  1. Độc giả truy cập trang Lịch hoạt động (`/schedule`).
  2. Backend tải các sự kiện của thư viện đã được Admin cập nhật từ trước.
  3. Frontend hiển thị giao diện lịch biểu tương tác trực quan.
* **Kết quả**: Xem lịch hoạt động thành công.

### Luồng 19: Xem tin tức học thuật mới xuất bản
* **Actor**: Độc giả.
* **Mô tả**: Theo dõi các tin tức và thông báo mới nhất từ ban quản lý thư viện.
* **Các bước thực hiện**:
  1. Độc giả vào mục Tin tức (`/news`).
  2. Backend tải danh sách bài viết tin tức mới nhất từ cơ sở dữ liệu.
  3. Frontend hiển thị tin tức dạng lưới kèm ảnh minh họa.
* **Kết quả**: Xem danh sách tin tức thành công.

### Luồng 20: Xem chi tiết bài viết tin tức thư viện
* **Actor**: Độc giả.
* **Mô tả**: Đọc toàn bộ nội dung của một bài viết tin tức cụ thể.
* **Các bước thực hiện**:
  1. Độc giả bấm vào tiêu đề bài viết tin tức trên trang danh sách.
  2. Backend tải nội dung chi tiết bài viết dựa trên News ID.
  3. Frontend hiển thị nội dung bài viết đầy đủ kèm định dạng hình ảnh.
* **Kết quả**: Hiển thị bài viết chi tiết thành công.

---

## NHÓM 3: QUẢN TRỊ THƯ VIỆN & ĐỒNG BỘ (LUỒNG 21 - 30)

### Luồng 21: Đăng nhập trang quản trị thư viện
* **Actor**: Thủ thư / Admin.
* **Mô tả**: Đăng nhập tài khoản quản trị để vào trang quản trị nghiệp vụ.
* **Các bước thực hiện**:
  1. Thủ thư nhập tài khoản tại màn hình đăng nhập.
  2. Backend xác thực người dùng và kiểm tra role là Admin hoặc Librarian.
  3. Frontend lưu quyền truy cập và chuyển hướng thủ thư vào trang `/admin/dashboard`.
* **Kết quả**: Vào trang Dashboard thành công.

### Luồng 22: Xem báo cáo thống kê thư viện số
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Theo dõi mức độ tương tác của độc giả đối với kho tài nguyên thư viện.
* **Các bước thực hiện**:
  1. Admin mở trang Thống kê tại Admin Dashboard.
  2. Backend tính tổng số tài liệu, đếm lượt xem, lượt tải và số lượng người dùng.
  3. Frontend vẽ các biểu đồ trực quan (cột, tròn, đường) thể hiện xu hướng sử dụng thư viện.
* **Kết quả**: Xem báo cáo trực quan thành công.

### Luồng 23: Tìm kiếm và quản trị tài khoản độc giả
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Kiểm soát thông tin tài khoản độc giả, khóa hoặc mở khóa tài khoản.
* **Các bước thực hiện**:
  1. Admin mở trang Quản lý người dùng (`/admin/users`).
  2. Tìm kiếm tài khoản theo mã sinh viên, họ tên hoặc email.
  3. Thực hiện sửa đổi vai trò hoặc thay đổi trạng thái hoạt động (kích hoạt/khóa).
* **Kết quả**: Cập nhật trạng thái người dùng thành công.

### Luồng 24: Thêm tài liệu khóa luận mới thủ công
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Cập nhật khóa luận mới vào cơ sở dữ liệu thông qua giao diện quản trị.
* **Các bước thực hiện**:
  1. Admin nhập thông tin khóa luận (tiêu đề, tác giả, giảng viên, tóm tắt, liên kết file PDF).
  2. Backend tạo bản ghi khóa luận mới trong PostgreSQL với trạng thái PUBLISHED.
  3. Đẩy thông tin khóa luận mới vào index của Elasticsearch để sẵn sàng cho tra cứu.
* **Kết quả**: Khóa luận mới được xuất bản thành công trên hệ thống.

### Luồng 25: Nhập danh sách tài liệu hàng loạt từ Excel
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Thêm hàng loạt khóa luận mới vào thư viện thông qua file dữ liệu Excel.
* **Các bước thực hiện**:
  1. Admin chuẩn bị file Excel theo định dạng mẫu và tải lên trang quản trị.
  2. Backend phân tích file dữ liệu, kiểm tra tính hợp lệ và loại bỏ các bản ghi trùng.
  3. Thực hiện Bulk Insert các bản ghi khóa luận mới vào Database PostgreSQL.
* **Kết quả**: Nhập danh sách khóa luận hàng loạt thành công.

### Luồng 26: Cập nhật thông tin tài liệu đã đăng
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Chỉnh sửa thông tin metadata của khóa luận đang hiển thị trên thư viện.
* **Các bước thực hiện**:
  1. Admin bấm nút Chỉnh sửa trên khóa luận cụ thể.
  2. Cập nhật các thông tin cần sửa đổi và bấm Lưu.
  3. Backend cập nhật PostgreSQL và đồng bộ dữ liệu mới lên Elasticsearch.
* **Kết quả**: Metadata khóa luận được cập nhật thành công.

### Luồng 27: Gỡ bỏ tài liệu khỏi thư viện số
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Gỡ bỏ hoặc tạm ẩn một khóa luận khỏi cổng tra cứu công khai.
* **Các bước thực hiện**:
  1. Admin chọn xóa tài liệu khóa luận chỉ định.
  2. Backend cập nhật trường trạng thái ẩn (Soft Delete) trong PostgreSQL.
  3. Hệ thống xóa bản ghi khóa luận tương ứng khỏi Search Index của Elasticsearch.
* **Kết quả**: Khóa luận không còn hiển thị đối với độc giả.

### Luồng 28: Tự động đồng bộ tài liệu từ Google Drive
* **Actor**: Hệ thống (Hangfire Job) / Google Drive API.
* **Mô tả**: Quét định kỳ thư mục Google Drive chung để tự động nạp các tệp khóa luận mới tải lên vào DB.
* **Các bước thực hiện**:
  1. Hangfire Scheduler kích hoạt Job đồng bộ định kỳ (ví dụ: mỗi 1 phút).
  2. Hệ thống gọi Drive Service để quét toàn bộ file mới tải lên thư mục Google Drive chỉ định.
  3. Trích xuất metadata và tạo bản ghi lưu trữ tự động vào PostgreSQL.
* **Kết quả**: Tài liệu mới trên Drive được nạp tự động vào hệ thống.

### Luồng 29: Quản trị viên trigger đồng bộ thủ công
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Yêu cầu hệ thống quét và đồng bộ từ Google Drive ngay lập tức thay vì chờ đến chu kỳ Hangfire.
* **Các bước thực hiện**:
  1. Admin bấm nút "Đồng bộ Drive ngay" trên Admin Panel.
  2. Backend nhận yêu cầu và xếp công việc đồng bộ vào Hangfire Queue.
  3. Hangfire Worker lập tức thực hiện quét và tải metadata từ Drive về DB.
* **Kết quả**: Đồng bộ Drive tức thời thành công.

### Luồng 30: Xem nhật ký hoạt động hệ thống
* **Actor**: Admin / Thủ thư.
* **Mô tả**: Theo dõi lịch sử hoạt động và các thay đổi dữ liệu của hệ thống để phục vụ kiểm toán bảo mật.
* **Các bước thực hiện**:
  1. Admin mở mục Nhật ký hoạt động (`/admin/audit-logs`).
  2. Backend tải các bản ghi nhật ký hoạt động gần đây.
  3. Giao diện hiển thị chi tiết: Thời gian, Actor, Thao tác, Địa chỉ IP.
* **Kết quả**: Xem nhật ký hệ thống thành công.
