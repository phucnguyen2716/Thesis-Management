import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';

// Default categories/disciplines for lecturers to study
const DISCIPLINES = [
  'Tất cả',
  'Công nghệ thông tin & Khoa học dữ liệu',
  'Trí tuệ nhân tạo & Robot',
  'Kinh tế & Quản trị kinh doanh',
  'Phương pháp Nghiên cứu Khoa học',
  'Ngôn ngữ & Sư phạm học'
];

const PRESET_COVERS = [
  { name: 'Sơn thạch', css: 'from-slate-700 via-teal-900 to-slate-900' },
  { name: 'Đại dương', css: 'from-cyan-800 via-blue-900 to-slate-950' },
  { name: 'Rừng thông', css: 'from-emerald-800 via-teal-950 to-emerald-950' },
  { name: 'Hoàng hôn', css: 'from-orange-800 via-red-950 to-stone-950' },
  { name: 'Thạch anh', css: 'from-purple-800 via-violet-950 to-indigo-950' }
];

const DEFAULT_BOOKS = [
  {
    id: 'lib-book-1',
    title: 'Phương pháp Nghiên cứu Khoa học và Công bố Quốc tế',
    author: 'GS. TS. Nguyễn Văn A',
    discipline: 'Phương pháp Nghiên cứu Khoa học',
    summary: 'Hướng dẫn chi tiết quy trình nghiên cứu khoa học, từ xác định đề tài, xây dựng đề cương, thu thập số liệu đến viết báo cáo và công bố trên các tạp chí uy tín.',
    coverCss: 'from-slate-700 via-teal-900 to-slate-900',
    rating: 4.9,
    pages: 312,
    dateAdded: 1716654823000,
    chapters: [
      {
        title: 'Chương 1: Khởi động đề tài nghiên cứu',
        content: 'Khởi đầu một nghiên cứu khoa học đòi hỏi sự thấu hiểu sâu sắc về vấn đề cần giải quyết. Bước đầu tiên và quan trọng nhất là xác định khoảng trống tri thức (knowledge gap) trong các tài liệu đã công bố. Giảng viên cần rèn luyện khả năng đọc hiểu phê phán (critical reading) để từ đó đặt ra câu hỏi nghiên cứu có giá trị thực tiễn và tính mới học thuật cao. Một đề tài tốt là đề tài giải quyết được một vấn đề thực tế hoặc đóng góp thêm cho lý thuyết chuyên ngành.'
      },
      {
        title: 'Chương 2: Thiết kế nghiên cứu và Thu thập dữ liệu',
        content: 'Thiết kế nghiên cứu đóng vai trò là bản thiết kế kiến trúc cho toàn bộ dự án nghiên cứu. Tùy thuộc vào câu hỏi nghiên cứu, giảng viên có thể chọn phương pháp định lượng (quantitative), định tính (qualitative) hoặc hỗn hợp (mixed methods). Việc lựa chọn cỡ mẫu, thiết kế bảng câu hỏi khảo sát hoặc xây dựng kịch bản phỏng vấn chuyên sâu cần được thực hiện cực kỳ nghiêm ngặt nhằm tránh các sai lệch hệ thống (systemic bias) và đảm bảo độ tin cậy (reliability) cũng như giá trị (validity) của dữ liệu thu thập.'
      },
      {
        title: 'Chương 3: Phân tích kết quả và Viết bản thảo',
        content: 'Phân tích dữ liệu không chỉ đơn thuần là trình bày các con số hay trích dẫn phỏng vấn, mà là kể một câu chuyện khoa học thuyết phục. Đối với dữ liệu định lượng, việc áp dụng các mô hình hồi quy, kiểm định giả thuyết thông qua các công cụ SPSS, R, Stata hay Python là bắt buộc. Khi viết bản thảo (manuscript), cấu trúc chuẩn IMRAD (Introduction, Methods, Results, and Discussion) cần được tuân thủ nghiêm ngặt, đặc biệt là phần Thảo luận phải làm nổi bật đóng góp mới của nghiên cứu so với các tác giả trước.'
      },
      {
        title: 'Chương 4: Quy trình phản biện và Công bố',
        content: 'Gửi bài báo đến tạp chí khoa học quốc tế chỉ là bước đầu của hành trình công bố. Quy trình phản biện đồng cấp (peer review) thường kéo dài từ vài tháng đến cả năm với nhiều vòng chỉnh sửa. Nhận thức đúng đắn và phản hồi lịch sự, khoa học đối với các ý kiến của phản biện viên (referee comments) là kỹ năng cốt lõi giúp tăng tỷ lệ chấp nhận đăng (acceptance rate). Giảng viên nên ưu tiên lựa chọn các tạp chí thuộc danh mục uy tín ISI/Scopus để nâng cao uy tín học thuật cá nhân và của trường.'
      }
    ]
  },
  {
    id: 'lib-book-2',
    title: 'Trí tuệ Nhân tạo thế hệ mới và Kỷ nguyên Mô hình Ngôn ngữ Lớn (LLM)',
    author: 'Dr. Elena Rostova',
    discipline: 'Trí tuệ nhân tạo & Robot',
    summary: 'Khám phá các nguyên lý nền tảng của Transformer, cơ chế Attention, quy trình tiền huấn luyện và tinh chỉnh mô hình ngôn ngữ lớn (LLM), cùng các ứng dụng thực tế trong giảng dạy và nghiên cứu.',
    coverCss: 'from-purple-800 via-violet-950 to-indigo-950',
    rating: 4.8,
    pages: 258,
    dateAdded: 1716654824000,
    chapters: [
      {
        title: 'Chương 1: Sự trỗi dậy của Transformer',
        content: 'Kiến trúc Transformer giới thiệu bởi Vaswani và các cộng sự vào năm 2017 với bài báo nổi tiếng "Attention Is All You Need" đã thay đổi hoàn toàn bộ mặt của xử lý ngôn ngữ tự nhiên (NLP) và trí tuệ nhân tạo nói chung. Khác với các mạng nơ-ron hồi quy (RNN) hay LSTM xử lý thông tin tuần tự, Transformer cho phép tính toán song song toàn bộ các vị trí trong chuỗi dữ liệu đầu vào. Điều này giúp đẩy nhanh tốc độ huấn luyện trên các phần cứng hiện đại như GPU/TPU và mở ra cơ hội xây dựng các mô hình cực kỳ đồ sộ.'
      },
      {
        title: 'Chương 2: Cơ chế Self-Attention và Encoder-Decoder',
        content: 'Điểm mấu chốt tạo nên sức mạnh đột phá của Transformer là cơ chế Self-Attention (Tự chú ý). Cơ chế này cho phép mô hình đánh giá mức độ liên quan giữa mọi từ trong văn bản bất chấp khoảng cách địa lý của chúng trong câu. Ví dụ, trong câu "Ngân hàng đã khóa tài khoản của khách hàng vì họ nghi ngờ có gian lận", cơ chế Attention giúp mô hình hiểu chính xác từ "họ" liên kết mạnh nhất với danh từ "Ngân hàng" chứ không phải "khách hàng". Nhờ vậy, ngữ cảnh ngữ nghĩa được bảo toàn cực kỳ chính xác.'
      },
      {
        title: 'Chương 3: Huấn luyện và Tinh chỉnh LLM (Fine-tuning)',
        content: 'Quá trình xây dựng một mô hình ngôn ngữ lớn (LLM) hiện đại bao gồm hai giai đoạn chính: Tiền huấn luyện (Pre-training) trên lượng dữ liệu văn bản khổng lồ từ Internet để học tri thức thế giới tổng quát, và Tinh chỉnh có giám sát (Supervised Fine-tuning - SFT) hoặc Học tăng cường từ phản hồi của con người (RLHF) để giúp mô hình hành xử an toàn, tuân thủ mệnh lệnh và hữu ích cho người dùng. Kỹ thuật tinh chỉnh tham số hiệu quả (PEFT) như LoRA giúp các nhà nghiên cứu có thể tùy biến mô hình trên phần cứng cá nhân.'
      }
    ]
  },
  {
    id: 'lib-book-3',
    title: 'Kiến trúc Phần mềm hướng Dịch vụ & Microservices',
    author: 'Martin Fowler & cộng sự',
    discipline: 'Công nghệ thông tin & Khoa học dữ liệu',
    summary: 'Phân tích sâu sắc về ưu và nhược điểm của kiến trúc Microservices, các mẫu thiết kế (Design Patterns) phổ biến, cơ chế đồng bộ dữ liệu và bảo mật hệ thống phân tán.',
    coverCss: 'from-cyan-800 via-blue-900 to-slate-950',
    rating: 4.7,
    pages: 420,
    dateAdded: 1716654825000,
    chapters: [
      {
        title: 'Chương 1: Từ Monolithic đến Microservices',
        content: 'Hệ thống nguyên khối (Monolith) ban đầu hoạt động rất tốt nhờ sự đơn giản trong phát triển và triển khai. Tuy nhiên, khi quy mô hệ thống phát triển, Monolith lộ rõ nhiều khuyết điểm như: thời gian build lâu, khó nâng cấp công nghệ riêng lẻ, và một lỗi nhỏ ở module phụ có thể làm sập toàn bộ hệ thống. Kiến trúc Microservices giải quyết điều này bằng cách chia nhỏ ứng dụng lớn thành một tập hợp các dịch vụ nhỏ hơn, tự chủ, liên kết với nhau qua các giao thức nhẹ như HTTP REST API hoặc Message Queue.'
      },
      {
        title: 'Chương 2: Thiết kế ranh giới dịch vụ (Bounded Context)',
        content: 'Thử thách lớn nhất khi thiết kế Microservices không phải là mặt công nghệ mà là phân chia ranh giới nghiệp vụ. Áp dụng Domain-Driven Design (DDD) giúp xác định các "Bounded Context" (Ngữ cảnh ràng buộc). Mỗi dịch vụ nên chịu trách nhiệm hoàn toàn cho một nghiệp vụ cốt lõi duy nhất và quản lý cơ sở dữ liệu riêng của nó (Database-per-service). Việc chia sẻ chung cơ sở dữ liệu là một phản mẫu (anti-pattern) làm giảm khả năng mở rộng độc lập và tăng tính phụ thuộc chặt chẽ giữa các dịch vụ.'
      },
      {
        title: 'Chương 3: Quản lý giao dịch phân tán (Saga Pattern)',
        content: 'Khi mỗi microservice quản lý cơ sở dữ liệu riêng của mình, việc đảm bảo tính nhất quán giao dịch (transaction consistency) qua nhiều dịch vụ trở nên phức tạp do không thể dùng giao dịch hai pha (2PC) hiệu năng thấp. Mẫu thiết kế Saga (Saga Pattern) giải quyết vấn đề này bằng cách thực thi chuỗi các giao dịch cục bộ nối tiếp nhau. Nếu một giao dịch cục bộ thất bại, Saga sẽ kích hoạt các giao dịch bù (compensating transactions) để hoàn tác các bước trước đó, đảm bảo hệ thống quay về trạng thái nhất quán.'
      }
    ]
  },
  {
    id: 'lib-book-4',
    title: 'Quản trị Chiến lược và Đổi mới Sáng tạo trong Doanh nghiệp',
    author: 'PGS. TS. Trần Thị B',
    discipline: 'Kinh tế & Quản trị kinh doanh',
    summary: 'Tài liệu chuyên sâu về lập kế hoạch chiến lược, phân tích thị trường, mô hình năm lực lượng cạnh tranh của Porter và các phương pháp thúc đẩy tinh thần đổi mới sáng tạo nội bộ.',
    coverCss: 'from-orange-800 via-red-950 to-stone-950',
    rating: 4.6,
    pages: 340,
    dateAdded: 1716654826000,
    chapters: [
      {
        title: 'Chương 1: Bản chất của Quản trị Chiến lược',
        content: 'Quản trị chiến lược là nghệ thuật và khoa học của việc xây dựng, thực hiện và đánh giá các quyết định liên chức năng giúp tổ chức đạt được các mục tiêu dài hạn. Nó tập trung vào việc tích hợp quản trị, tiếp thị, tài chính, sản xuất, nghiên cứu phát triển và hệ thống thông tin. Quy trình bao gồm ba giai đoạn chính: hoạch định chiến lược, thực thi chiến lược và đánh giá chiến lược. Giảng viên kinh tế cần trang bị cho học sinh tư duy chiến lược linh hoạt để ứng phó bối cảnh VUCA.'
      },
      {
        title: 'Chương 2: Phân tích Môi trường Cạnh tranh',
        content: 'Hiểu rõ bối cảnh bên ngoài là điều kiện tiên quyết để tồn tại. Mô hình 5 lực lượng cạnh tranh của Michael Porter (Mối đe dọa từ đối thủ mới, Quyền lực thương lượng của nhà cung cấp, Quyền lực thương lượng của khách hàng, Mối đe dọa từ sản phẩm thay thế, và Mức độ cạnh tranh nội bộ ngành) giúp nhận diện cấu trúc ngành và định vị lợi thế cạnh tranh bền vững của doanh nghiệp, giúp hoạch định vị thế phòng thủ hoặc tấn công chủ động.'
      },
      {
        title: 'Chương 3: Đổi mới sáng tạo là Động lực tăng trưởng',
        content: 'Trong nền kinh tế tri thức hiện nay, đổi mới sáng tạo không còn là lựa chọn mà là sinh mệnh của doanh nghiệp. Đổi mới có thể diễn ra dưới dạng cải tiến sản phẩm, quy trình công nghệ, phương thức tiếp thị hoặc mô hình kinh doanh. Doanh nghiệp cần xây dựng văn hóa khuyến khích thử nghiệm thất bại an toàn và thiết lập các vườn ươm sáng kiến nội bộ để liên tục tạo ra các động cơ tăng trưởng mới vượt qua bẫy bão hòa sản phẩm.'
      }
    ]
  },
  {
    id: 'lib-book-5',
    title: 'Phương pháp Giảng dạy Đại học Hiện đại và Thiết kế Trải nghiệm Học tập',
    author: 'ThS. Nguyễn Hoàng C',
    discipline: 'Ngôn ngữ & Sư phạm học',
    summary: 'Ứng dụng thang đo Bloom cải tiến, phương pháp học tập dựa trên dự án (Project-Based Learning) và các công cụ công nghệ giáo dục (EdTech) nhằm nâng cao tương tác trong lớp học.',
    coverCss: 'from-emerald-800 via-teal-950 to-emerald-950',
    rating: 4.9,
    pages: 280,
    dateAdded: 1716654827000,
    chapters: [
      {
        title: 'Chương 1: Chuyển dịch từ Dạy học sang Học tập',
        content: 'Giáo dục đại học thế kỷ 21 chuyển trọng tâm từ vai trò truyền thụ tri thức một chiều của giảng viên (Teacher-centered) sang vai trò chủ động kiến tạo tri thức của người học (Student-centered). Giảng viên không còn đóng vai trò "nhà thông thái trên bục giảng" nữa mà trở thành "người dẫn đường bên cạnh". Sự chuyển dịch này đòi hỏi sự thay đổi trong phương pháp thiết kế bài giảng, gia tăng hoạt động thảo luận nhóm, học tập tích cực (active learning) và tư duy phản biện.'
      },
      {
        title: 'Chương 2: Thiết kế chuẩn đầu ra và Đánh giá kết quả',
        content: 'Mô hình thiết kế ngược (Backward Design) của Wiggins và McTighe bắt đầu bằng việc xác định rõ ràng chuẩn đầu ra mong đợi (Learning Outcomes) trước khi thiết kế hoạt động dạy học và đề thi đánh giá. Thang đo Bloom cải tiến (Nhớ, Hiểu, Áp dụng, Phân tích, Đánh giá, Sáng tạo) cung cấp khung từ vựng động từ hành động chuẩn xác để viết chuẩn đầu ra đo lường được, giúp kiểm soát chất lượng đào tạo thực chất.'
      },
      {
        title: 'Chương 3: Học tập qua Dự án (Project-Based Learning - PBL)',
        content: 'Phương pháp học qua dự án đặt sinh viên vào vị trí giải quyết các thử thách thực tế có cấu trúc mở. Trong suốt quá trình thực hiện dự án, sinh viên tự chủ nghiên cứu, hợp tác nhóm, quản lý tiến độ và trình bày sản phẩm cuối cùng trước hội đồng phản biện. PBL không chỉ giúp người học khắc sâu kiến thức chuyên môn lý thuyết, mà quan trọng hơn là phát triển các kỹ năng mềm thiết yếu như kỹ năng giao tiếp, giải quyết vấn đề phức tạp và làm việc nhóm.'
      }
    ]
  }
];

const LecturerLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Tất cả');
  
  // Reader State
  const [readingBook, setReadingBook] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [readerTheme, setReaderTheme] = useState('light'); // light, sepia, dark
  const [readerFontSize, setReaderFontSize] = useState('md'); // sm, md, lg
  const [readerFontFamily, setReaderFontFamily] = useState('serif'); // serif, sans
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [bookmarks, setBookmarks] = useState({}); // { bookId: chapterIndex }

  // Load books and bookmarks from localStorage on mount
  useEffect(() => {
    const storedBooks = localStorage.getItem('thesisLecturerLibrary');
    if (storedBooks) {
      setBooks(JSON.parse(storedBooks));
    } else {
      localStorage.setItem('thesisLecturerLibrary', JSON.stringify(DEFAULT_BOOKS));
      setBooks(DEFAULT_BOOKS);
    }

    const storedBookmarks = localStorage.getItem('thesisLecturerLibraryBookmarks');
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks));
    }
  }, []);

  // Reader Handlers
  const openReader = (book) => {
    setReadingBook(book);
    // Load bookmark if exists, else start at chapter 0
    const bookmarkedChapter = bookmarks[book.id];
    setActiveChapterIndex(bookmarkedChapter !== undefined ? bookmarkedChapter : 0);
    // On mobile, default outline sidebar to closed
    if (window.innerWidth < 768) {
      setIsOutlineOpen(false);
    } else {
      setIsOutlineOpen(true);
    }
    // Add overflow hidden to body to prevent scrolling background
    document.body.style.overflow = 'hidden';
  };

  const closeReader = () => {
    setReadingBook(null);
    document.body.style.overflow = 'unset';
  };

  const handleToggleBookmark = () => {
    const updatedBookmarks = { ...bookmarks };
    if (bookmarks[readingBook.id] === activeChapterIndex) {
      // Remove bookmark
      delete updatedBookmarks[readingBook.id];
    } else {
      // Set bookmark
      updatedBookmarks[readingBook.id] = activeChapterIndex;
    }
    setBookmarks(updatedBookmarks);
    localStorage.setItem('thesisLecturerLibraryBookmarks', JSON.stringify(updatedBookmarks));
  };

  // Filtered books selection
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDiscipline = 
      selectedDiscipline === 'Tất cả' || 
      book.discipline === selectedDiscipline;
      
    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300 space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-900 border border-teal-100 shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-2xl font-bold">local_library</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Thư viện tham khảo giảng viên</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Trau dồi thêm tri thức từ các chuyên ngành khác nhau ·{' '}
              <Link to="/lecturer" className="text-teal-800 font-bold hover:underline">
                Trang chủ
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm sách, tác giả, nội dung tóm tắt..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-teal-700 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Discipline Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {DISCIPLINES.map(disp => (
            <button
              key={disp}
              onClick={() => setSelectedDiscipline(disp)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedDiscipline === disp
                  ? 'bg-teal-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              {disp}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map(book => {
            const isBookmarked = bookmarks[book.id] !== undefined;
            return (
              <div
                key={book.id}
                onClick={() => openReader(book)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer hover:border-teal-300"
              >
                {/* Book Cover Design */}
                <div className={`h-48 bg-gradient-to-br ${book.coverCss} relative p-5 flex flex-col justify-between text-white overflow-hidden shrink-0`}>
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
                  
                  {/* Bookmark Tag */}
                  {isBookmarked && (
                    <div className="absolute top-0 right-4 bg-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-wider py-1.5 px-2 rounded-b shadow z-10 flex items-center gap-0.5 animate-pulse">
                      <span className="material-symbols-outlined text-[10px] font-bold">bookmark</span>
                      Đang đọc
                    </div>
                  )}

                  <div className="space-y-1 relative z-10">
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[8px] font-black uppercase tracking-wider block w-max">
                      {book.discipline.split('&')[0].trim()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 relative z-10 mt-auto">
                    <h3 className="font-extrabold text-sm line-clamp-2 leading-tight group-hover:text-teal-200 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[10px] text-white/80 font-bold tracking-wide italic">
                      {book.author}
                    </p>
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {book.summary}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Metas */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-yellow-500 font-bold">star</span>
                        <strong className="text-slate-700">{book.rating}</strong>
                      </span>
                      <span>{book.pages} trang</span>
                      <span>{book.chapters.length} chương</span>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="flex-1 py-2 bg-teal-50 text-teal-900 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-teal-900 hover:text-white transition-all text-center flex items-center justify-center gap-1 border border-teal-100"
                      >
                        <span className="material-symbols-outlined text-[12px] font-bold">menu_book</span>
                        Đọc ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white py-16 px-6 rounded-2xl border border-slate-200 text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">menu_book</span>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy sách nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Không tìm thấy sách tham khảo nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc thêm sách mới.
          </p>
        </div>
      )}

      {/* Reader Modal (Full Screen Overlay) */}
      {readingBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center animate-fade-in">
          <div className="w-full h-full md:w-[96vw] md:h-[94vh] md:rounded-[2rem] bg-white shadow-2xl overflow-hidden flex flex-col animate-in scale-in-95 duration-300">
            {/* Reader Header */}
            <div className="bg-teal-950 text-white px-6 py-4 flex items-center justify-between border-b border-teal-900 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isOutlineOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'
                  }`}
                  title="Mục lục"
                >
                  <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                </button>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm truncate leading-tight">{readingBook.title}</h3>
                  <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">{readingBook.author}</p>
                </div>
              </div>

              {/* Reader controls */}
              <div className="flex items-center gap-3">
                {/* Bookmarker */}
                <button
                  onClick={handleToggleBookmark}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    bookmarks[readingBook.id] === activeChapterIndex
                      ? 'bg-yellow-500 text-slate-950 font-black'
                      : 'hover:bg-white/10 text-white/70'
                  }`}
                  title={bookmarks[readingBook.id] === activeChapterIndex ? 'Bỏ đánh dấu trang' : 'Đánh dấu chương này'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {bookmarks[readingBook.id] === activeChapterIndex ? 'bookmark' : 'bookmark_add'}
                  </span>
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-teal-900 hidden sm:block" />

                {/* Font Family selector */}
                <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold uppercase">
                  <button
                    onClick={() => setReaderFontFamily('serif')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${readerFontFamily === 'serif' ? 'bg-white text-teal-950 font-black' : 'text-white/80'}`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setReaderFontFamily('sans')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${readerFontFamily === 'sans' ? 'bg-white text-teal-950 font-black' : 'text-white/80'}`}
                  >
                    Sans
                  </button>
                </div>

                {/* Font Size Adjuster */}
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold">
                  <button
                    onClick={() => setReaderFontSize('sm')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${readerFontSize === 'sm' ? 'bg-white text-teal-950 font-black' : 'text-white/80'}`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setReaderFontSize('md')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${readerFontSize === 'md' ? 'bg-white text-teal-950 font-black' : 'text-white/80'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setReaderFontSize('lg')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${readerFontSize === 'lg' ? 'bg-white text-teal-950 font-black' : 'text-white/80'}`}
                  >
                    A+
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${readerTheme === 'light' ? 'bg-white text-teal-950' : 'text-white/80'}`}
                    title="Giao diện Sáng"
                  >
                    <span className="material-symbols-outlined text-sm">light_mode</span>
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${readerTheme === 'sepia' ? 'bg-yellow-100 text-amber-950 font-black' : 'text-white/80'}`}
                    title="Giao diện Sepia"
                  >
                    <span className="material-symbols-outlined text-sm text-amber-900">coffee</span>
                  </button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${readerTheme === 'dark' ? 'bg-slate-800 text-white' : 'text-white/80'}`}
                    title="Giao diện Tối"
                  >
                    <span className="material-symbols-outlined text-sm text-yellow-400">dark_mode</span>
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={closeReader}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Thoát đọc sách"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Reader Workspace */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Dark backdrop overlay when sidebar is open on mobile */}
              {isOutlineOpen && (
                <div 
                  onClick={() => setIsOutlineOpen(false)}
                  className="fixed inset-0 bg-black/40 z-10 md:hidden animate-fade-in"
                />
              )}

              {/* Table of contents sidebar */}
              <div className={`bg-slate-50 border-r border-slate-200 transition-all duration-300 overflow-y-auto flex flex-col shrink-0 ${
                isOutlineOpen 
                  ? 'w-64 absolute md:relative inset-y-0 left-0 z-20 md:z-auto h-full shadow-2xl md:shadow-none' 
                  : 'w-0 border-r-0 overflow-hidden'
              }`}>
                <div className="p-4 border-b border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mục lục sách</p>
                </div>
                <div className="flex-1 p-2 space-y-1">
                  {readingBook.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveChapterIndex(idx);
                        if (window.innerWidth < 768) {
                          setIsOutlineOpen(false);
                        }
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-xs font-semibold leading-relaxed transition-all flex items-center justify-between ${
                        activeChapterIndex === idx
                          ? 'bg-teal-900 text-white shadow-sm font-bold'
                          : 'hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">{ch.title}</span>
                      {bookmarks[readingBook.id] === idx && (
                        <span className="material-symbols-outlined text-sm text-yellow-500 font-bold shrink-0">bookmark</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document/Page Content Container */}
              <div 
                onClick={() => {
                  if (window.innerWidth < 768 && isOutlineOpen) {
                    setIsOutlineOpen(false);
                  }
                }}
                className={`flex-1 overflow-y-auto p-4 sm:p-12 flex justify-center transition-colors duration-200 ${
                  readerTheme === 'light'
                    ? 'bg-slate-100 text-slate-900'
                    : readerTheme === 'sepia'
                      ? 'bg-amber-50/70 text-amber-950'
                      : 'bg-slate-950 text-slate-200'
                }`}
              >
                <div className={`w-full max-w-2xl bg-white shadow-md border rounded-2xl px-4 sm:px-16 py-8 sm:py-16 transition-all min-h-[80vh] flex flex-col ${
                  readerTheme === 'light'
                    ? 'bg-white border-slate-200/80 text-slate-900'
                    : readerTheme === 'sepia'
                      ? 'bg-[#fcf8f2] border-amber-100 text-amber-950'
                      : 'bg-slate-900 border-slate-800 text-slate-100 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                }`}>
                  {/* Book header inside sheet */}
                  <div className="border-b border-slate-100 pb-4 mb-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{readingBook.discipline}</span>
                    <span>{activeChapterIndex + 1} / {readingBook.chapters.length} chương</span>
                  </div>

                  {/* Chapter Content */}
                  <div className="flex-1 space-y-6">
                    <h2 className={`font-black tracking-tight leading-tight ${
                      readerFontSize === 'sm' ? 'text-lg' : readerFontSize === 'md' ? 'text-xl' : 'text-2xl'
                    }`}>
                      {readingBook.chapters[activeChapterIndex].title}
                    </h2>
                    
                    <p className={`leading-relaxed text-justify indent-8 ${
                      readerFontFamily === 'serif' ? 'font-serif' : 'font-sans'
                    } ${
                      readerFontSize === 'sm' ? 'text-xs' : readerFontSize === 'md' ? 'text-sm' : 'text-base'
                    }`}>
                      {readingBook.chapters[activeChapterIndex].content}
                    </p>
                  </div>

                  {/* Page Navigation */}
                  <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      disabled={activeChapterIndex === 0}
                      onClick={() => setActiveChapterIndex(activeChapterIndex - 1)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">west</span>
                      Chương trước
                    </button>

                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Kết thúc chương {activeChapterIndex + 1}
                    </span>

                    <button
                      disabled={activeChapterIndex === readingBook.chapters.length - 1}
                      onClick={() => setActiveChapterIndex(activeChapterIndex + 1)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold transition-all flex items-center gap-1"
                    >
                      Chương tiếp
                      <span className="material-symbols-outlined text-sm">east</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LecturerLibraryPage;
