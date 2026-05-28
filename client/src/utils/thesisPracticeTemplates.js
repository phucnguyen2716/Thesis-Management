const TEMPLATE_KEY = 'thesisPracticeTemplates';
const SUBMISSIONS_KEY = 'thesisPracticeSubmissions';

export const DEFAULT_TEMPLATES = [
  {
    id: 'master_ch',
    chapterTag: 'Tất cả',
    label: 'Đồ án mẫu hoàn chỉnh (3 Chương)',
    description: 'Mẫu cấu trúc toàn diện bao gồm: Mở đầu, Chương 1 (Cơ sở lý thuyết), Chương 2 (Phân tích hệ thống), Chương 3 (Kết quả thực nghiệm) và Kết luận.',
    html: `<h1 style="text-align:center">MỞ ĐẦU</h1>
<p><strong>1. Lý do chọn đề tài</strong></p>
<p>Trong bối cảnh chuyển đổi số và sự phát triển mạnh mẽ của công nghệ hiện nay, việc quản lý...</p>
<p><strong>2. Mục tiêu nghiên cứu</strong></p>
<p>Nghiên cứu được thực hiện nhằm đạt được các mục tiêu sau:</p>
<ol>
  <li><strong>Mục tiêu tổng quát:</strong> Xây dựng hệ thống quản lý khoa học hiệu quả.</li>
  <li><strong>Mục tiêu cụ thể:</strong>
    <ol>
      <li>Phân tích quy trình hiện tại.</li>
      <li>Thiết kế cơ sở dữ liệu tối ưu.</li>
      <li>Triển khai giao diện thân thiện với người dùng.</li>
    </ol>
  </li>
</ol>
<p><strong>3. Đối tượng và Phạm vi nghiên cứu</strong></p>
<p>Đối tượng nghiên cứu là quy trình quản lý sáng kiến khoa học. Phạm vi áp dụng tại các trường đại học.</p>

<hr style="margin: 40px 0; border: none; border-top: 2px dashed #115e59; opacity: 0.3;" />

<h1 style="text-align:center">CHƯƠNG 1. CƠ SỞ LÝ THUYẾT</h1>
<p><strong>1.1. Khái quát về hệ thống thông tin quản lý</strong></p>
<p>Trình bày định nghĩa, cấu trúc và vai trò của hệ thống thông tin đối với các tổ chức...</p>
<p><strong>1.2. Các công nghệ và nền tảng phát triển</strong></p>
<p>Nội dung phân tích các công nghệ chính sẽ được áp dụng trong đề tài:</p>
<ol>
  <li>Nền tảng React và sự ưu việt của mô hình Single Page Application.</li>
  <li>Nền tảng ASP.NET Core Web API cho hệ thống microservices.
    <ol>
      <li>Cơ chế Authentication và Authorization sử dụng JWT.</li>
      <li>Cơ chế giao tiếp qua RESTful APIs.</li>
    </ol>
  </li>
</ol>
<p><strong>1.3. Khảo sát các giải pháp tương tự</strong></p>
<p>Tổng quan về các phần mềm quản lý đang có mặt trên thị trường và những hạn chế cần khắc phục...</p>

<hr style="margin: 40px 0; border: none; border-top: 2px dashed #115e59; opacity: 0.3;" />

<h1 style="text-align:center">CHƯƠNG 2. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG</h1>
<p><strong>2.1. Phân tích yêu cầu hệ thống</strong></p>
<p><strong>2.1.1. Yêu cầu chức năng:</strong> Hệ thống cần cung cấp các chức năng quản lý, tìm kiếm, đánh giá...</p>
<p><strong>2.1.2. Yêu cầu phi chức năng:</strong> Đảm bảo tính bảo mật, hiệu năng cao và khả năng mở rộng.</p>
<p><strong>2.2. Thiết kế cơ sở dữ liệu</strong></p>
<p>Trình bày mô hình thực thể liên kết ERD và cấu trúc các bảng trong cơ sở dữ liệu hệ thống...</p>
<p><strong>2.3. Sơ đồ UML và kiến trúc hệ thống</strong></p>
<p>Mô tả chi tiết bằng sơ đồ Use Case tổng quát và các sơ đồ tuần tự (Sequence Diagram) cho các chức năng cốt lõi:</p>
<ol>
  <li>Quy trình nộp sáng kiến của sinh viên.</li>
  <li>Quy trình chấm điểm và phê duyệt của giảng viên.</li>
</ol>

<hr style="margin: 40px 0; border: none; border-top: 2px dashed #115e59; opacity: 0.3;" />

<h1 style="text-align:center">CHƯƠNG 3. KẾT QUẢ THỰC NGHIỆM</h1>
<p><strong>3.1. Môi trường cài đặt và cấu hình</strong></p>
<p>Cấu hình máy chủ, hệ điều hành, cơ sở dữ liệu và phiên bản phần mềm được sử dụng để chạy thực nghiệm...</p>
<p><strong>3.2. Demo các chức năng chính của hệ thống</strong></p>
<p>Trình bày các ảnh chụp màn hình, mô tả giao diện người dùng và cách thức tương tác của các tác nhân...</p>
<p><strong>3.3. Đánh giá và kiểm thử kết quả</strong></p>
<p>Báo cáo các kịch bản kiểm thử (Test Cases), tỷ lệ lỗi phát hiện và mức độ hài lòng của người dùng thử nghiệm:</p>
<ol>
  <li>Kiểm thử chức năng đăng nhập và bảo mật.</li>
  <li>Kiểm thử hiệu năng xử lý dữ liệu quy mô lớn.</li>
</ol>

<hr style="margin: 40px 0; border: none; border-top: 2px dashed #115e59; opacity: 0.3;" />

<h1 style="text-align:center">KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN</h1>
<p><strong>1. Những kết quả đạt được</strong></p>
<p>Sau thời gian nghiên cứu và hoàn thiện, đề tài đã đạt được các mục tiêu ban đầu đề ra bao gồm...</p>
<p><strong>2. Những mặt hạn chế còn tồn tại</strong></p>
<p>Mặc dù hệ thống đã hoạt động ổn định nhưng vẫn còn một số điểm cần cải tiến về mặt giao diện...</p>
<p><strong>3. Hướng phát triển trong tương lai</strong></p>
<p>Đề xuất mở rộng nghiên cứu sang tích hợp trí tuệ nhân tạo để phân loại sáng kiến tự động...</p>`,
    minWords: 900,
    requiredSections: ['Mở đầu', 'Lý do chọn đề tài', 'Mục tiêu nghiên cứu', 'CHƯƠNG 1', 'Cơ sở lý thuyết', '1.1', '1.2', '1.3', 'CHƯƠNG 2', '2.1', '2.2', '2.3', 'CHƯƠNG 3', '3.1', '3.2', '3.3', 'KẾT LUẬN']
  },
  {
    id: 'intro',
    chapterTag: 'Chương Mở đầu',
    label: 'Mẫu Chương Mở đầu',
    description: 'Chứa các nội dung giới thiệu tính cấp thiết, mục tiêu và phạm vi của đề tài đồ án.',
    html: `<h1 style="text-align:center">MỞ ĐẦU</h1>
<p><strong>1. Lý do chọn đề tài</strong></p>
<p>Trong thời đại số hóa hiện nay, các cơ sở giáo dục đại học đối mặt với thử thách quản lý quy trình lớn. Việc ứng dụng công nghệ giúp tự động hóa và nâng cao năng suất hoạt động...</p>
<p><strong>2. Mục tiêu nghiên cứu</strong></p>
<p>Mục tiêu cốt lõi của đề tài này bao gồm các định hướng cụ thể sau:</p>
<ol>
  <li><strong>Mục tiêu tổng quát:</strong> Tối ưu hóa quy trình quản lý bằng phần mềm.</li>
  <li><strong>Mục tiêu cụ thể:</strong>
    <ol>
      <li>Nghiên cứu các lý thuyết liên quan.</li>
      <li>Khảo sát trực quan quy trình thực tế.</li>
      <li>Lập trình demo giao diện ứng dụng.</li>
    </ol>
  </li>
</ol>
<p><strong>3. Đối tượng và Phạm vi nghiên cứu</strong></p>
<p>Đối tượng nghiên cứu là quy trình quản lý hoạt động đào tạo. Phạm vi nghiên cứu giới hạn trong học kỳ hiện tại tại Khoa CNTT.</p>`,
    minWords: 200,
    requiredSections: ['Mở đầu', 'Lý do chọn đề tài', 'Mục tiêu nghiên cứu', 'Đối tượng và Phạm vi']
  },
  {
    id: 'chapter1',
    chapterTag: 'Chương 1',
    label: 'Mẫu Chương 1: Cơ sở lý thuyết',
    description: 'Phân tích các cơ sở lý thuyết, công nghệ và khảo sát giải pháp tương tự.',
    html: `<h1 style="text-align:center">CHƯƠNG 1. CƠ SỞ LÝ THUYẾT</h1>
<p><strong>1.1. Khái quát về lý thuyết nền tảng</strong></p>
<p>Nội dung này trình bày các định nghĩa cơ bản, quy trình kỹ thuật cốt lõi và các mô hình toán học hoặc lý luận được áp dụng làm xương sống cho đề tài...</p>
<p><strong>1.2. Công nghệ phát triển đề xuất</strong></p>
<p>Dựa trên các phân tích lý thuyết, các công nghệ sau được lựa chọn để phát triển hệ thống:</p>
<ol>
  <li>Kiến trúc SPA (Single Page Application) sử dụng React.js ở phía Client.</li>
  <li>Kiến trúc RESTful API sử dụng ASP.NET Core làm cầu nối dữ liệu.
    <ol>
      <li>Hệ quản trị cơ sở dữ liệu quan hệ SQL Server.</li>
      <li>Cơ chế phân quyền người dùng JWT token bảo mật cao.</li>
    </ol>
  </li>
</ol>
<p><strong>1.3. Khảo sát các giải pháp liên quan</strong></p>
<p>Tiến hành khảo sát, so sánh ưu và nhược điểm của các hệ thống đã có trên thị trường nhằm đúc kết kinh nghiệm thiết kế thực tế...</p>`,
    minWords: 300,
    requiredSections: ['CHƯƠNG 1', 'Cơ sở lý thuyết', '1.1', '1.2', '1.3']
  },
  {
    id: 'chapter2',
    chapterTag: 'Chương 2',
    label: 'Mẫu Chương 2: Phân tích & Thiết kế',
    description: 'Bản phân tích yêu cầu chức năng, thiết kế cơ sở dữ liệu và sơ đồ UML.',
    html: `<h1 style="text-align:center">CHƯƠNG 2. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG</h1>
<p><strong>2.1. Phân tích yêu cầu hệ thống</strong></p>
<p><strong>2.1.1. Yêu cầu chức năng:</strong> Hệ thống cần đáp ứng các tác vụ đăng nhập, quản lý hồ sơ, gửi báo cáo và chấm điểm trực tuyến...</p>
<p><strong>2.1.2. Yêu cầu phi chức năng:</strong> Hệ thống hoạt động ổn định, phản hồi dưới 2 giây và giao diện responsive tương thích mọi thiết bị.</p>
<p><strong>2.2. Thiết kế cơ sở dữ liệu</strong></p>
<p>Trình bày mô hình thực thể liên kết ERD (Entity Relationship Diagram) chi tiết thể hiện liên kết giữa các bảng chính như Users, Classes, Submissions...</p>
<p><strong>2.3. Sơ đồ UML và kiến trúc hệ thống</strong></p>
<p>Mô tả luồng hoạt động thông qua sơ đồ Use Case tổng quát và sơ đồ tuần tự (Sequence Diagram):</p>
<ol>
  <li>Sơ đồ Use Case phân quyền Sinh viên, Giảng viên và Quản trị viên.</li>
  <li>Sơ đồ tuần tự cho tính năng gửi bài và chấm bài tự động.</li>
</ol>`,
    minWords: 350,
    requiredSections: ['CHƯƠNG 2', 'Phân tích và thiết kế', '2.1', '2.2', '2.3']
  },
  {
    id: 'chapter3',
    chapterTag: 'Chương 3',
    label: 'Mẫu Chương 3: Thực nghiệm',
    description: 'Trình bày kết quả cài đặt thực nghiệm, ảnh giao diện demo và kiểm thử.',
    html: `<h1 style="text-align:center">CHƯƠNG 3. KẾT QUẢ THỰC NGHIỆM</h1>
<p><strong>3.1. Môi trường cài đặt và cấu hình</strong></p>
<p>Đặc tả thông số máy chủ thử nghiệm, phiên bản Node.js, SDK .NET, hệ điều hành Windows Server và hệ quản trị dữ liệu SQL Server sử dụng...</p>
<p><strong>3.2. Demo các chức năng giao diện chính</strong></p>
<p>Trình bày các hình ảnh giao diện thực tế của ứng dụng kèm mô tả chi tiết thao tác tương tác của sinh viên và giảng viên...</p>
<p><strong>3.3. Đánh giá và kiểm thử hệ thống</strong></p>
<p>Kịch bản kiểm thử (Test Cases) thực tế được chạy để kiểm nghiệm phần mềm:</p>
<ol>
  <li>Kiểm thử hộp đen các trường hợp nhập sai định dạng mật khẩu.</li>
  <li>Kiểm thử hiệu năng tải trang khi có 100 kết nối đồng thời.</li>
</ol>`,
    minWords: 300,
    requiredSections: ['CHƯƠNG 3', 'Kết quả thực nghiệm', '3.1', '3.2', '3.3']
  },
  {
    id: 'conclusion',
    chapterTag: 'Chương Kết luận',
    label: 'Mẫu Kết luận & Hướng đi',
    description: 'Tóm tắt các kết quả đạt được, hạn chế và đề xuất hướng phát triển tương lai.',
    html: `<h1 style="text-align:center">KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN</h1>
<p><strong>1. Những kết quả đạt được</strong></p>
<p>Sau quá trình triển khai thực hiện, đồ án đã hoàn thành đầy đủ mục tiêu thiết kế và cài đặt hệ thống ứng dụng quản lý hoạt động...</p>
<p><strong>2. Những mặt hạn chế còn tồn tại</strong></p>
<p>Hệ thống vẫn còn tồn tại một số điểm hạn chế như chưa tích hợp thanh toán tự động và bộ lọc dữ liệu lớn chưa tối ưu hóa hiệu năng...</p>
<p><strong>3. Hướng phát triển trong tương lai</strong></p>
<p>Nghiên cứu áp dụng công nghệ học máy để dự báo kết quả học tập của sinh viên và nâng cấp lên hệ thống microservices toàn diện.</p>`,
    minWords: 150,
    requiredSections: ['KẾT LUẬN', 'Những kết quả đạt được', 'Hướng phát triển']
  }
];

// Trình kích hoạt sự kiện đồng bộ
const triggerEvent = (name) => {
  try {
    window.dispatchEvent(new Event(name));
  } catch (e) {
    /* ignore */
  }
};

export const loadTemplates = () => {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let modified = false;
      const updated = parsed.map(t => {
        const def = DEFAULT_TEMPLATES.find(d => d.id === t.id);
        if (def && !t.chapterTag) {
          modified = true;
          return { ...t, chapterTag: def.chapterTag };
        }
        if (!t.chapterTag) {
          modified = true;
          return { ...t, chapterTag: 'Tất cả' };
        }
        return t;
      });
      if (modified) {
        localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated));
      }
      return updated;
    }
  } catch {
    /* ignore */
  }
  // Nếu chưa có, lưu mặc định
  try {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
  } catch {
    /* ignore */
  }
  return DEFAULT_TEMPLATES;
};

export const saveTemplates = (templates) => {
  try {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
    triggerEvent('practice-templates-updated');
  } catch (e) {
    console.error('Failed to save templates', e);
  }
};

export const loadPracticeSubmissions = () => {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
};

export const savePracticeSubmission = (submission) => {
  try {
    const submissions = loadPracticeSubmissions();
    const index = submissions.findIndex(s => s.id === submission.id);
    const data = {
      ...submission,
      updatedAt: Date.now()
    };
    if (index >= 0) {
      submissions[index] = data;
    } else {
      submissions.push(data);
    }
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
    triggerEvent('practice-submissions-updated');
    return data;
  } catch (e) {
    console.error('Failed to save practice submission', e);
    return null;
  }
};

export const deletePracticeSubmission = (id) => {
  try {
    const submissions = loadPracticeSubmissions();
    const filtered = submissions.filter(s => s.id !== id);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));
    triggerEvent('practice-submissions-updated');
  } catch (e) {
    console.error('Failed to delete practice submission', e);
  }
};

export const gradePracticeSubmission = (id, gradingData) => {
  try {
    const submissions = loadPracticeSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index >= 0) {
      submissions[index] = {
        ...submissions[index],
        teacherGraded: true,
        teacherGrade: Number(gradingData.teacherGrade),
        teacherFeedback: gradingData.teacherFeedback,
        teacherRubric: gradingData.teacherRubric || { content: 8, method: 8, originality: 8, presentation: 8 },
        gradedAt: Date.now()
      };
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
      triggerEvent('practice-submissions-updated');
      return submissions[index];
    }
  } catch (e) {
    console.error('Failed to grade practice submission', e);
  }
  return null;
};
