import React, { useState, useMemo } from 'react';

// Seed initial mock events for June 2026
const INITIAL_EVENTS = [
  {
    id: 'evt-1',
    title: 'Hội đồng bảo vệ Đồ án: Trí tuệ nhân tạo & Robotics',
    date: '2026-06-08',
    time: '08:00 - 11:30',
    location: 'Phòng A.403 (Khu A, Trụ sở chính UEF)',
    type: 'committee',
    status: 'approved',
    student: 'Nguyễn Minh Anh & nhóm nghiên cứu',
    description: 'Bảo vệ đồ án tốt nghiệp khóa K22 chuyên ngành Khoa học dữ liệu và Trí tuệ nhân tạo.',
    members: 'TS. Nguyễn Minh Trí (Chủ tịch), PGS.TS. Lê Hoàng Nam (Phản biện), ThS. Võ Thị Mai (Thư ký)'
  },
  {
    id: 'evt-2',
    title: 'Lịch hướng dẫn: Ứng dụng Blockchain trong quản lý văn bằng',
    date: '2026-06-12',
    time: '14:00 - 16:00',
    location: 'Văn phòng Khoa CNTT (Tầng 6, UEF)',
    type: 'guidance',
    status: 'approved',
    student: 'Trần Hoàng Bảo',
    description: 'Họp duyệt tiến độ Chương 3 (Thiết kế hệ thống và Smart Contract) và hướng dẫn viết báo cáo.',
    members: 'TS. Nguyễn Minh Trí (Hướng dẫn)'
  },
  {
    id: 'evt-3',
    title: 'Hội đồng chuyên đề: Phát triển ứng dụng Web & Cloud Computing',
    date: '2026-06-15',
    time: '13:30 - 17:00',
    location: 'Phòng B.502 (Khu B, UEF)',
    type: 'committee',
    status: 'approved',
    student: 'Phạm Đức Thịnh, Lê Văn C',
    description: 'Đánh giá tiến độ chuyên đề nghiên cứu khoa học cấp khoa học kỳ II.',
    members: 'TS. Đỗ Thanh Hải (Chủ tịch), ThS. Nguyễn Bích Vy (Thư ký)'
  },
  {
    id: 'evt-4',
    title: 'Lịch họp nhóm: Phân tích sentiment mạng xã hội PhoBERT',
    date: '2026-06-18',
    time: '09:00 - 11:00',
    location: 'Phòng họp trực tuyến Teams (Mã: uef-sentiment-2026)',
    type: 'guidance',
    status: 'pending',
    student: 'Lê Thị Cẩm',
    description: 'Sửa lỗi tỷ lệ trùng lặp cao (45%) và điều chỉnh lại tập dữ liệu huấn luyện PhoBERT tiếng Việt.',
    members: 'TS. Nguyễn Minh Trí (Hướng dẫn)'
  },
  {
    id: 'evt-5',
    title: 'Hội đồng chấm đề cương Khóa luận tốt nghiệp K22',
    date: '2026-06-22',
    time: '08:00 - 12:00',
    location: 'Phòng Hội thảo C.201 (Khu C, UEF)',
    type: 'committee',
    status: 'pending',
    student: 'Đặng Thu Hà, Võ Thị Mai',
    description: 'Thông qua đề cương chi tiết và tính khả thi của các đề tài Khóa luận tốt nghiệp.',
    members: 'PGS.TS. Nguyễn Văn Toàn (Chủ tịch), TS. Trần Minh Quang (Phản biện)'
  },
  {
    id: 'evt-6',
    title: 'Lịch hướng dẫn: Xây dựng thương hiệu cá nhân trên LinkedIn',
    date: '2026-06-26',
    time: '15:00 - 17:00',
    location: 'Phòng sinh hoạt học thuật (Tầng 4, UEF)',
    type: 'guidance',
    status: 'approved',
    student: 'Ngô Thảo Vy',
    description: 'Duyệt khung nội dung khảo sát Gen Z và đóng góp ý kiến bảng hỏi trực tuyến.',
    members: 'ThS. Nguyễn Văn Thắng (Hướng dẫn)'
  }
];

const SchedulePage = () => {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filter, setFilter] = useState('all'); // all, committee, guidance
  const [selectedEvent, setSelectedEvent] = useState(INITIAL_EVENTS[0]);
  const [selectedDay, setSelectedDay] = useState(null); // Click a calendar day to filter

  // Scheduler Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('guidance');
  const [newDate, setNewDate] = useState('2026-06-15');
  const [newTime, setNewTime] = useState('09:00 - 11:00');
  const [newLocation, setNewLocation] = useState('Phòng sinh hoạt học thuật (Tầng 4)');
  const [newStudent, setNewStudent] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // June 2026 starts on Monday (June 1st = Monday). It has 30 days.
  const calendarDays = useMemo(() => {
    const days = [];
    // June 1 to June 30
    for (let d = 1; d <= 30; d++) {
      const dateString = `2026-06-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateString,
      });
    }
    return days;
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchesType = filter === 'all' || evt.type === filter;
      const matchesDay = !selectedDay || evt.date === selectedDay;
      return matchesType && matchesDay;
    });
  }, [events, filter, selectedDay]);

  // Dynamic statistics calculated from current filtered set
  const stats = useMemo(() => {
    // We calculate stats based on the ACTIVE type filter
    const pool = events.filter(evt => filter === 'all' || evt.type === filter);
    const total = pool.length;
    const approved = pool.filter(e => e.status === 'approved').length;
    const pending = pool.filter(e => e.status === 'pending').length;
    
    // Calculate upcoming based on a threshold (simulate e.g. date >= 15th as upcoming in our static data context)
    const upcoming = pool.filter(e => {
      const day = parseInt(e.date.split('-')[2] || '0');
      return day >= 15;
    }).length;

    return { total, approved, pending, upcoming };
  }, [events, filter]);

  // Handle scheduling submission
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvt = {
      id: `evt-${Date.now()}`,
      title: newTitle,
      date: newDate,
      time: newTime,
      location: newLocation,
      type: newType,
      status: 'pending', // new events default to pending
      student: newStudent || 'Chưa cập nhật',
      description: newDesc || 'Đăng ký buổi làm việc thảo luận nghiên cứu khoa học / đồ án tốt nghiệp.',
      members: newMembers || (newType === 'committee' ? 'Chờ hội đồng phân công' : 'TS. Nguyễn Minh Trí')
    };

    setEvents(prev => [...prev, newEvt]);
    setSelectedEvent(newEvt);
    setShowAddModal(false);
    
    // Reset Form
    setNewTitle('');
    setNewStudent('');
    setNewMembers('');
    setNewDesc('');
  };

  // Quick select day on calendar
  const handleDayClick = (dateStr) => {
    if (selectedDay === dateStr) {
      setSelectedDay(null); // Toggle off
    } else {
      setSelectedDay(dateStr);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto p-2 md:p-4 text-[#1e293b] animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-[10px] font-black text-teal-800 uppercase tracking-[0.25em] bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            Quản lý lịch trình khoa học
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-2">
            Lịch Hội đồng & Lịch học
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi kế hoạch bảo vệ khóa luận, đồ án và các lịch hướng dẫn học thuật tại UEF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-900 shadow-md hover:shadow-teal-800/10 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">calendar_add_on</span>
          Đăng ký xếp lịch mới
        </button>
      </div>

      {/* Filter and Stats Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation & Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Bộ lọc loại lịch</h3>
            <div className="flex flex-col gap-1.5">
              {[
                { key: 'all', label: 'Tất cả lịch trình', icon: 'date_range', count: events.length },
                { key: 'committee', label: 'Lịch hội đồng bảo vệ', icon: 'group_work', count: events.filter(e => e.type === 'committee').length },
                { key: 'guidance', label: 'Lịch hướng dẫn học thuật', icon: 'forum', count: events.filter(e => e.type === 'guidance').length },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => { setFilter(btn.key); setSelectedDay(null); }}
                  className={`flex items-center justify-between p-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-left ${
                    filter === btn.key
                      ? 'bg-teal-800 text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg">{btn.icon}</span>
                    <span>{btn.label}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    filter === btn.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {btn.count}
                  </span>
                </button>
              ))}
            </div>

            {selectedDay && (
              <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-800">
                  Đang lọc ngày: <span className="underline font-black">{selectedDay}</span>
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[10px] font-black text-rose-600 uppercase hover:underline"
                >
                  Hủy lọc ngày
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Stats Panel (REACTIVE NUMBERS) */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tổng số lịch', value: stats.total, color: 'text-teal-900 bg-teal-50 border-teal-100', icon: 'event' },
              { label: 'Đã duyệt', value: stats.approved, color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: 'check_circle' },
              { label: 'Sắp diễn ra', value: stats.upcoming, color: 'text-blue-700 bg-blue-50 border-blue-100', icon: 'schedule' },
              { label: 'Chờ phê duyệt', value: stats.pending, color: 'text-amber-700 bg-amber-50 border-amber-100', icon: 'hourglass_empty' }
            ].map((st, i) => (
              <div key={i} className={`p-4 rounded-2xl border bg-white shadow-sm flex flex-col justify-between ${st.color} transition-all hover:scale-[1.02]`}>
                <div className="flex justify-between items-center opacity-85">
                  <span className="text-[10px] font-black uppercase tracking-wider">{st.label}</span>
                  <span className="material-symbols-outlined text-base">{st.icon}</span>
                </div>
                <span className="text-3xl font-black mt-3 leading-none">{st.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid Representation */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-800">calendar_month</span>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">Tháng 6 - Năm 2026</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="inline-block w-2.5 h-2.5 bg-teal-600 rounded-full" /> Hội đồng
              <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full ml-2" /> Hướng dẫn
            </div>
          </div>

          {/* Calendar Table Grid */}
          <div className="w-full border border-slate-200/80 rounded-2xl overflow-hidden shadow-inner bg-slate-50/50">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center py-2.5 text-xs font-black uppercase text-slate-500 tracking-wider">
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
              <div className="text-rose-600">CN</div>
            </div>

            {/* Monthly Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 border-l border-t border-slate-200 select-none">
              {calendarDays.map((cell) => {
                const dayEvents = events.filter(e => e.date === cell.dateString);
                const hasEvents = dayEvents.length > 0;
                
                const isDaySelected = selectedDay === cell.dateString;

                return (
                  <div
                    key={cell.dayNumber}
                    onClick={() => handleDayClick(cell.dateString)}
                    className={`aspect-square min-h-[50px] md:min-h-[70px] p-1.5 flex flex-col justify-between cursor-pointer transition-all ${
                      isDaySelected 
                        ? 'bg-teal-800 text-white font-extrabold ring-4 ring-teal-700/20 z-10' 
                        : 'bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-xs md:text-sm font-bold ${
                        (cell.dayNumber % 7 === 0) && !isDaySelected ? 'text-rose-600' : ''
                      }`}>
                        {cell.dayNumber}
                      </span>
                      {hasEvents && (
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isDaySelected ? 'bg-white' : 'bg-teal-800'
                        }`} />
                      )}
                    </div>

                    {/* Mini event tags */}
                    <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayEvents.map(e => {
                        const isMatched = filter === 'all' || e.type === filter;
                        return (
                          <div 
                            key={e.id} 
                            className={`text-[7px] md:text-[8px] px-1 py-0.5 rounded-md font-bold truncate ${
                              isDaySelected
                                ? 'bg-white/20 text-white'
                                : e.type === 'committee'
                                  ? isMatched ? 'bg-teal-500/10 text-teal-800 border border-teal-500/20' : 'opacity-20 bg-slate-100'
                                  : isMatched ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' : 'opacity-20 bg-slate-100'
                            }`}
                          >
                            {e.type === 'committee' ? 'HĐ' : 'HD'}: {e.student.split(' ')[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Events List & Dynamic Side Panel details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Upcoming List View */}
        <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-800">toc</span>
              Danh sách lịch trình ({filteredEvents.length})
            </h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Tháng 6 / 2026
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredEvents.map((evt) => {
              const isActive = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-start ${
                    isActive
                      ? 'border-teal-800 bg-teal-50/50 shadow-sm shadow-teal-800/5 ring-1 ring-teal-800'
                      : 'border-slate-200 hover:border-teal-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                    evt.type === 'committee' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {evt.type === 'committee' ? 'group_work' : 'forum'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                        {evt.title}
                      </h4>
                      <span className={`shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        evt.status === 'approved' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {evt.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] sm:text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="truncate">{evt.location.split('(')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <span className="material-symbols-outlined text-3xl opacity-50">search_off</span>
                <p className="text-xs font-bold mt-2">Không tìm thấy lịch trình phù hợp</p>
                {selectedDay && <p className="text-[10px] text-slate-400">Không có sự kiện nào cho ngày {selectedDay}</p>}
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Detail Card panel */}
        <section className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl border border-teal-900 p-4 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-teal-500/10 rounded-full blur-[60px] pointer-events-none" />

          {selectedEvent ? (
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                  selectedEvent.type === 'committee' 
                    ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {selectedEvent.type === 'committee' ? 'Lịch bảo vệ hội đồng' : 'Lịch hướng dẫn'}
                </span>
                
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                  selectedEvent.status === 'approved' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/25 text-amber-300 border border-amber-500/30'
                }`}>
                  {selectedEvent.status === 'approved' ? 'Lịch chính thức' : 'Đang chờ duyệt'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-white leading-snug">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-teal-300 font-bold mt-1.5">
                  Đối tượng: {selectedEvent.student}
                </p>
              </div>

              <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-2xl text-xs leading-relaxed text-white/90">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-300 text-base">calendar_today</span>
                  <div>
                    <span className="block font-black text-[10px] text-white/50 uppercase">Ngày & Giờ</span>
                    <span className="font-bold">{selectedEvent.date} · {selectedEvent.time}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                  <span className="material-symbols-outlined text-teal-300 text-base">location_on</span>
                  <div>
                    <span className="block font-black text-[10px] text-white/50 uppercase">Địa điểm</span>
                    <span className="font-medium">{selectedEvent.location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                  <span className="material-symbols-outlined text-teal-300 text-base">person</span>
                  <div>
                    <span className="block font-black text-[10px] text-white/50 uppercase">
                      {selectedEvent.type === 'committee' ? 'Ủy viên hội đồng' : 'Giảng viên hướng dẫn'}
                    </span>
                    <span className="font-medium italic text-teal-100">{selectedEvent.members}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-white/40 block tracking-wider">
                  Nội dung & Yêu cầu chuẩn bị
                </span>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.status === 'pending' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: 'approved' } : e));
                      setSelectedEvent(prev => ({ ...prev, status: 'approved' }));
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-colors"
                  >
                    Duyệt xếp lịch chính thức
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-teal-500/50 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl">event_note</span>
              <span className="text-xs font-bold">Vui lòng chọn một sự kiện để xem chi tiết</span>
            </div>
          )}
        </section>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-teal-900 to-teal-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-teal-300">calendar_add_on</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-teal-300">Đăng ký lịch trình học thuật</h3>
                  <p className="text-[9px] text-white/50 uppercase mt-0.5">Xếp lịch hướng dẫn hoặc hội đồng bảo vệ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-white/60 hover:text-white transition-colors"
              >
                close
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Tên sự kiện / Tiêu đề họp</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 focus:bg-white transition-all"
                  placeholder="Ví dụ: Đánh giá tiến độ Đồ án tốt nghiệp khóa K22..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Loại lịch trình</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                  >
                    <option value="guidance">Lịch hướng dẫn học thuật</option>
                    <option value="committee">Lịch hội đồng bảo vệ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Ngày thực hiện (June 2026)</label>
                  <input
                    type="date"
                    required
                    min="2026-06-01"
                    max="2026-06-30"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Khung thời gian</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                    placeholder="Ví dụ: 09:00 - 11:30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Địa điểm họp / Mã phòng</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                    placeholder="Ví dụ: Phòng A.403 hoặc MS Teams"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Sinh viên / Nhóm thực hiện</label>
                <input
                  type="text"
                  required
                  value={newStudent}
                  onChange={(e) => setNewStudent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  placeholder="Ví dụ: Nguyễn Minh Anh, Lê Văn C"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  {newType === 'committee' ? 'Thành viên Hội đồng chấm' : 'Giảng viên hướng dẫn'}
                </label>
                <input
                  type="text"
                  value={newMembers}
                  onChange={(e) => setNewMembers(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  placeholder="Ví dụ: TS. Nguyễn Minh Trí, ThS. Võ Thị Mai"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Nội dung chi tiết & Ghi chú</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2.5}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"
                  placeholder="Nêu tóm tắt mục tiêu làm việc và tài liệu sinh viên cần gửi trước..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
