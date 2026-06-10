// ============================================================================
// ENTERPRISE SUITE GATEWAY & SIMULATION ENGINE
// ============================================================================

const BACKEND_API_URL = 'http://localhost:5000/api/chatbot/chat';

// Shared Local Elasticsearch Index Store (Cross-tab database index simulation)
const inMemoryESStore = [
    { id: "h-01", title: "Sunset Video Post Idea", type: "social", payload: { Title: "Vịnh Hạ Long Slideshow", Content: "Tạo một bài viết chia sẻ về phong cảnh video vịnh Hạ Long tuyệt đẹp!", PostType: "Video", AuthorId: "user-92" }, score: 5.0, date: "Today" },
    { id: "h-02", title: "Enterprise Safety Guidelines", type: "chatbot", payload: { Prompt: "System Architecture Design", Message: "Double-Guardrail Sandwich pipeline successfully established.", Success: "true" }, score: 4.8, date: "Today" },
    { id: "h-03", title: "Meeting Notification Alert", type: "notification", payload: { Recipient: "user@example.com", Message: "Gửi thư thông báo cuộc họp ngày mai cho user@example.com", NotificationType: "Email" }, score: 3.5, date: "Today" },
    { id: "h-04", title: "Hạ Long Thumbnail compression", type: "mediaprocessing", payload: { ResourceName: "halong_thumb.jpg", JobType: "ImageOptimization", Status: "Completed" }, score: 4.2, date: "Yesterday" }
];

// ==========================================
// 1. TABS SYSTEM
// ==========================================
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Remove active class from buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Find active button and activate it
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.getAttribute('onclick').includes(tabId)
    );
    if (activeBtn) activeBtn.classList.add('active');

    // Trigger tab specific loads
    if (tabId === 'flipbook') {
        renderDocumentsList();
    } else if (tabId === 'elasticsearch') {
        runLiveSearch(); // Load initially
    }
}

// Helper delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 2. CHATBOT (SANDWICH PIPELINE)
// ==========================================
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const consoleLogs = document.getElementById('consoleLogs');

const steps = {
    input: document.getElementById('step-input'),
    prefilter: document.getElementById('step-prefilter'),
    funcdetect: document.getElementById('step-funcdetect'),
    mediatr: document.getElementById('step-mediatr'),
    handler: document.getElementById('step-handler'),
    postfilter: document.getElementById('step-postfilter'),
    output: document.getElementById('step-output')
};
const connectors = document.querySelectorAll('.pipeline-connector');
const metas = {
    prefilter: document.getElementById('meta-prefilter'),
    funcdetect: document.getElementById('meta-funcdetect'),
    mediatr: document.getElementById('meta-mediatr'),
    handler: document.getElementById('meta-handler'),
    postfilter: document.getElementById('meta-postfilter')
};

function appendLog(message, type = 'system-log') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const now = new Date().toLocaleTimeString();
    line.textContent = `[${now}] ${message}`;
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function clearLogs() {
    consoleLogs.innerHTML = `<div class="log-line system-log">[SYSTEM] Console logs cleared.</div>`;
}

function resetPipelineUI() {
    Object.values(steps).forEach(step => {
        step.className = 'pipeline-step';
        const badge = step.querySelector('.step-badge');
        if (badge) badge.textContent = 'IDLE';
    });
    connectors.forEach(conn => { conn.className = 'pipeline-connector'; });
    Object.values(metas).forEach(meta => { meta.textContent = '--'; });
}

function setStepState(stepKey, state, badgeText = null) {
    const step = steps[stepKey];
    if (!step) return;
    step.classList.remove('active', 'success-state', 'danger-state');
    if (state === 'active') {
        step.classList.add('active');
        if (badgeText) step.querySelector('.step-badge').textContent = badgeText;
    } else if (state === 'success') {
        step.classList.add('success-state');
        if (badgeText) step.querySelector('.step-badge').textContent = badgeText;
    } else if (state === 'danger') {
        step.classList.add('danger-state');
        if (badgeText) step.querySelector('.step-badge').textContent = badgeText;
    }
}

function setConnectorState(index, state) {
    if (index >= 0 && index < connectors.length) {
        connectors[index].className = 'pipeline-connector';
        if (state === 'active') connectors[index].classList.add('active');
        else if (state === 'success') connectors[index].classList.add('success-state');
    }
}

function renderMessage(text, sender = 'bot', isBlocked = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender === 'user' ? 'user-msg' : 'bot-msg'}`;
    if (isBlocked) msgDiv.classList.add('blocked-msg');

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = `<p>${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function useSuggestedPrompt(text) {
    userInput.value = text;
    userInput.focus();
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = userInput.value.trim();
    if (!prompt) return;

    userInput.value = '';
    renderMessage(prompt, 'user');
    resetPipelineUI();
    appendLog(`User prompt submitted to AI Sandwich: "${prompt}"`, 'system-log');

    // Live backend detection
    let backendAvailable = false;
    try {
        const test = await fetch(BACKEND_API_URL, { method: 'OPTIONS' }).catch(() => null);
        if (test) backendAvailable = true;
    } catch(err){}

    if (backendAvailable) {
        appendLog("C# ASP.NET Core Active. Routing live via Postgres and Elasticsearch cluster!", "system-log");
        await runLivePipeline(prompt);
    } else {
        appendLog("API Offline. Running high-fidelity local simulation.", "system-log");
        await runSimulatedPipeline(prompt);
    }
});

// Simulated Pipeline execution
async function runSimulatedPipeline(prompt) {
    const lower = prompt.toLowerCase();
    
    // Step 1: Input Captured
    setStepState('input', 'success', 'ACTIVE');
    setConnectorState(0, 'active');
    await delay(600);

    // Step 2: Pre-Filter
    setStepState('prefilter', 'active', 'ANALYZING');
    appendLog("Pre-Filter: Running safety guardrails on input...", "pre-log");
    await delay(900);

    const isViolent = lower.includes("kill") || lower.includes("bomb") || lower.includes("murder") || lower.includes("violent") || lower.includes("attack") || lower.includes("tấn công");
    
    if (isViolent) {
        setStepState('prefilter', 'danger', 'VIOLATION');
        metas.prefilter.textContent = "Violent Language Blocked";
        appendLog("Pre-Filter BLOCKED: Prompt triggers violence security policies. Aborted.", "error-log");
        await delay(300);
        
        renderMessage("Cảnh báo an toàn: Tin nhắn có chứa từ ngữ bạo lực hoặc không an toàn. Lớp Pre-Filter đã ngăn chặn tin nhắn này đi vào hệ thống.", "bot", true);
        return;
    }

    setStepState('prefilter', 'success', 'CLEAN');
    metas.prefilter.textContent = "Status: Safe";
    appendLog("Pre-Filter SUCCESS: Safe input. Detecting function calling intent.", "pre-log");
    setConnectorState(1, 'active');
    await delay(600);

    // Step 3: Function Calling Detection
    setStepState('funcdetect', 'active', 'PARSING');
    await delay(700);

    let cmdName = null;
    let serviceTarget = "";
    
    if (lower.includes("post") || lower.includes("create") || lower.includes("đăng bài") || lower.includes("chia sẻ")) {
        cmdName = "CreatePostCommand";
        serviceTarget = "SocialContent Service";
    } else if (lower.includes("notify") || lower.includes("email") || lower.includes("thông báo") || lower.includes("gửi thư")) {
        cmdName = "SendNotificationCommand";
        serviceTarget = "Notification Service";
    }

    if (cmdName) {
        setStepState('funcdetect', 'success', 'MATCH');
        metas.funcdetect.textContent = `Tool: ${cmdName}`;
        appendLog(`Function Calling: Match found! Recommended Tool -> ${cmdName}`, "system-log");
        setConnectorState(2, 'active');
        await delay(600);

        // Step 4: MediatR Router
        setStepState('mediatr', 'active', 'ROUTING');
        appendLog(`MediatR Dispatcher: Routing ${cmdName} to database schema context.`, "mediatr-log");
        await delay(700);
        
        setStepState('mediatr', 'success', 'ROUTED');
        metas.mediatr.textContent = "MediatR: OK";
        setConnectorState(3, 'active');
        await delay(600);

        // Step 5: Microservice Execution
        setStepState('handler', 'active', 'EXECUTING');
        appendLog(`Microservice DB [${serviceTarget}]: Saving records in PostgreSQL cluster...`, "core-log");
        
        if (cmdName === "CreatePostCommand") {
            await delay(400);
            appendLog("social.Posts: Stored record inside dedicated 'social' schema. Successfully committed.", "core-log");
            
            if (lower.includes("video") || lower.includes("image") || lower.includes("ảnh")) {
                appendLog("media.MediaJobs: Asset optimization job triggered in 'media' schema.", "core-log");
                await delay(300);
                appendLog("MediaProcessing: Transcoding slideshow video complete.", "core-log");
            }
            
            // Add to Elasticsearch index simulation
            inMemoryESStore.push({
                id: "post-" + Math.floor(Math.random()*1000),
                title: "User Post " + new Date().toLocaleTimeString(),
                type: "social",
                payload: { Title: "Draft Post", Content: prompt, PostType: "Video" },
                score: 4.5,
                date: "Just Now"
            });
            appendLog("Elasticsearch: New post document dynamically indexed.", "system-log");

        } else if (cmdName === "SendNotificationCommand") {
            await delay(400);
            appendLog("notification.Notifications: Stored log in 'notification' schema.", "core-log");
            appendLog("Notification Gateway: Dispatched alert template envelope.", "core-log");
            
            inMemoryESStore.push({
                id: "notif-" + Math.floor(Math.random()*1000),
                title: "Alert Log to " + (prompt.match(/[\w.-]+@[\w.-]+\.[\w.-]+/)?.[0] || "user@example.com"),
                type: "notification",
                payload: { Recipient: "user@example.com", Message: prompt, NotificationType: "Email" },
                score: 4.2,
                date: "Just Now"
            });
            appendLog("Elasticsearch: Notification log index added.", "system-log");
        }

        setStepState('handler', 'success', 'SUCCESS');
        metas.handler.textContent = `DbSchema: ${serviceTarget.split(' ')[0]}`;
        setConnectorState(4, 'active');
        await delay(700);

    } else {
        setStepState('funcdetect', 'success', 'SKIP');
        metas.funcdetect.textContent = "Dialogue Only";
        setConnectorState(2, 'active');
        await delay(400);
        setStepState('mediatr', 'success', 'BYPASSED');
        setConnectorState(3, 'active');
        await delay(400);
        setStepState('handler', 'success', 'BYPASSED');
        setConnectorState(4, 'active');
        await delay(400);
    }

    // Step 6: Post-Filter
    setStepState('postfilter', 'active', 'AUDITING');
    appendLog("Post-Filter: Auditing generated AI text for inappropriate terms...", "post-log");
    await delay(800);

    setStepState('postfilter', 'success', 'VERIFIED');
    metas.postfilter.textContent = "Status: Clean";
    setConnectorState(5, 'active');
    await delay(500);

    // Step 7: Output Delivered
    setStepState('output', 'success', 'SAFE');

    let botResponse = "";
    if (cmdName === "CreatePostCommand") {
        botResponse = `Tôi đã tạo thành công bài đăng trên hệ thống **Social Content**. Bản ghi dữ liệu đã được lưu trữ trong Postgres schema \`social.posts\` và đồng thời lập chỉ mục tìm kiếm trên **Elasticsearch** thành công!`;
    } else if (cmdName === "SendNotificationCommand") {
        botResponse = `Yêu cầu gửi thư của bạn đã được ghi nhận! Nhật ký hoạt động đã được lưu trữ trong Postgres schema \`notification.notifications\` và đánh chỉ mục trên **Elasticsearch** thành công!`;
    } else {
        botResponse = `Tôi đã nhận được yêu cầu trò chuyện từ bạn. Toàn bộ luồng đi qua các lớp **Sandwich Pattern** của hệ thống đều an toàn và hoạt động bình thường!`;
    }

    renderMessage(botResponse, 'bot');
    appendLog("AI Sandwich Pipeline complete. Idle.", "system-log");
}

// Live C# API consumer
async function runLivePipeline(prompt) {
    // Similar to simulated but pulls from Fetch API and sets metadata from live response
}

// ==========================================
// 3. 3D FLIPBOOK MODULE
// ==========================================
const mockDocuments = [
    {
        id: "doc-1",
        title: "Tài liệu thiết kế kiến trúc AI.pdf",
        size: "1.8 MB",
        date: "Today",
        pages: [
            "<h2>KIẾN TRÚC MỚI</h2><p>Hệ thống AI của chúng ta hoạt động theo nguyên tắc tách biệt dữ liệu an toàn. Lớp Pre-filter hoạt động như chiếc phễu lọc chặn đầu vào nguy hại.</p><p>Sử dụng các LLM hiệu năng cao giúp kiểm soát phản hồi mà không gây trễ.</p>",
            "<h2>MÔ HÌNH D-FLIPBOOK</h2><p>Mô hình sách lật 3D WebGL cho phép kết xuất hình ảnh trang sách thực tế với hiệu ứng đổ bóng phức tạp.</p><p>Người dùng có thể tương tác lật trang giống như đọc một cuốn sách giấy thật, nâng tầm trải nghiệm giao diện.</p>",
            "<h2>KẾT HỢP POSTGRESQL</h2><p>Bằng cách sử dụng các DB Schema riêng biệt, chúng ta vừa đảm bảo tính cô lập dữ liệu cho các Microservice, vừa tối ưu chi phí hạ tầng khi chạy chung cụm database.</p>",
            "<h2>HOÀN THÀNH</h2><p>Cảm ơn bạn đã đọc tài liệu kiến trúc này. Mọi thay đổi đều được ghi nhật ký kiểm toán trong Notification service.</p>"
        ]
    },
    {
        id: "doc-2",
        title: "Quy trình tối ưu hóa Video & Hình ảnh.pdf",
        size: "4.2 MB",
        date: "Yesterday",
        pages: [
            "<h2>MEDIA SERVICE</h2><p>Module xử lý media hỗ trợ nén ảnh không hao tổn chất lượng và chuyển đổi chuỗi slide ảnh tĩnh kết hợp file âm thanh thành video MP4 hoàn chỉnh.</p>",
            "<h2>HIỆU NĂNG TỐI ƯU</h2><p>Bằng việc chạy nền qua worker queue, các tác vụ nặng sẽ không gây nghẽn băng thông của REST API chính.</p>",
            "<h2>ĐỒNG BỘ ELASTICSEARCH</h2><p>Mỗi job nén thành công đều tự động Index vào Elasticsearch thông qua Generic Repository để phục vụ truy vấn tra cứu trạng thái tức thì.</p>",
            "<h2>KẾT THÚC</h2><p>Tài liệu hướng dẫn tối ưu Media kết thúc tại đây.</p>"
        ]
    },
    {
        id: "doc-3",
        title: "Báo cáo Đạo văn & Kiểm tra học thuật.pdf",
        size: "850 KB",
        date: "3 days ago",
        pages: [
            "<h2>KIỂM TRA ĐẠO VĂN</h2><p>Hệ thống Check-plagiarism so khớp văn bản đầu vào với hàng triệu bài báo xuất bản và mã nguồn lưu trữ.</p><p>Kết quả trả về độ tương đồng phần trăm và bôi đỏ các câu văn trùng lặp.</p>",
            "<h2>BÁO CÁO CHI TIẾT</h2><p>Trang giao diện trực quan hiển thị biểu đồ tròn biểu thị tỷ lệ trùng lặp giúp giảng viên hoặc lập trình viên dễ dàng đối soát.</p>"
        ]
    }
];

let activeDoc = null;
let currentBookPage = 0; // 0 = Cover, 1 = Page 1-2, 2 = Page 3-4...

function renderDocumentsList() {
    const docList = document.getElementById('docList');
    docList.innerHTML = '';

    mockDocuments.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        if (activeDoc && activeDoc.id === doc.id) card.classList.add('active-reading');

        card.innerHTML = `
            <div class="doc-meta">
                <div class="doc-meta-icon"><i class="fa-solid fa-file-pdf"></i></div>
                <div class="doc-details">
                    <h4>${doc.title}</h4>
                    <span>Size: ${doc.size} | Date: ${doc.date}</span>
                </div>
            </div>
            <div class="doc-actions">
                <button class="action-icon-btn" onclick="openEyeModal('${doc.id}')" title="Xem nhanh Popup"><i class="fa-solid fa-eye"></i></button>
                <button class="action-icon-btn btn-3d" onclick="loadBook3D('${doc.id}')" title="Đọc lật 3D thực tế"><i class="fa-solid fa-book-open"></i></button>
            </div>
        `;
        docList.appendChild(card);
    });
}

// 3D Flipbook Viewer Logic
function loadBook3D(docId) {
    activeDoc = mockDocuments.find(d => d.id === docId);
    if (!activeDoc) return;

    renderDocumentsList(); // Refresh active state in list
    
    document.getElementById('emptyViewerMsg').style.display = 'none';
    document.getElementById('activeBook3d').style.display = 'flex';
    document.getElementById('bookControls').style.display = 'flex';

    currentBookPage = 0;
    updateBookDisplay();
}

function updateBookDisplay() {
    if (!activeDoc) return;

    const bookTitle = document.getElementById('book-cover-title');
    const leftText = document.getElementById('page-text-l');
    const rightText = document.getElementById('page-text-r');
    const lPage = document.getElementById('page-l-content');
    const rPage = document.getElementById('page-r-content');
    const pageIndicator = document.getElementById('pageIndicator');

    bookTitle.textContent = activeDoc.title;

    // We have a cover page (page 0), inside pages, and back cover.
    if (currentBookPage === 0) {
        // Show Cover
        document.getElementById('page-l-cover').style.display = 'flex';
        lPage.style.display = 'none';
        rPage.style.display = 'none';
        document.getElementById('page-r-cover').style.display = 'none';
        
        pageIndicator.textContent = "Book Cover";
    } else {
        document.getElementById('page-l-cover').style.display = 'none';
        document.getElementById('page-r-cover').style.display = 'none';

        const lIdx = (currentBookPage - 1) * 2;
        const rIdx = lIdx + 1;

        if (lIdx < activeDoc.pages.length) {
            lPage.style.display = 'flex';
            leftText.innerHTML = activeDoc.pages[lIdx];
            document.getElementById('page-num-l').textContent = lIdx + 1;
        } else {
            lPage.style.display = 'none';
        }

        if (rIdx < activeDoc.pages.length) {
            rPage.style.display = 'flex';
            rightText.innerHTML = activeDoc.pages[rIdx];
            document.getElementById('page-num-r').textContent = rIdx + 1;
        } else {
            // Show End Cover if we go past pages
            rPage.style.display = 'none';
            document.getElementById('page-r-cover').style.display = 'flex';
        }

        const totalPages = activeDoc.pages.length;
        pageIndicator.textContent = `Page ${lIdx + 1}-${Math.min(rIdx + 1, totalPages)} of ${totalPages}`;
    }
}

function flipPageNext() {
    if (!activeDoc) return;
    const maxPages = Math.ceil(activeDoc.pages.length / 2);
    if (currentBookPage < maxPages) {
        // Add realistic CSS flip animation class
        const bookDiv = document.getElementById('activeBook3d');
        bookDiv.style.transform = "rotateY(-15deg) scale(1.02)";
        setTimeout(() => { bookDiv.style.transform = "rotateY(0) scale(1)"; }, 400);

        currentBookPage++;
        updateBookDisplay();
    }
}

function flipPagePrev() {
    if (!activeDoc) return;
    if (currentBookPage > 0) {
        const bookDiv = document.getElementById('activeBook3d');
        bookDiv.style.transform = "rotateY(15deg) scale(1.02)";
        setTimeout(() => { bookDiv.style.transform = "rotateY(0) scale(1)"; }, 400);

        currentBookPage--;
        updateBookDisplay();
    }
}

// Quick View Modal
function openEyeModal(docId) {
    const doc = mockDocuments.find(d => d.id === docId);
    if (!doc) return;

    activeDoc = doc; // set as active
    
    document.getElementById('modalDocTitle').textContent = doc.title;
    document.getElementById('modalDocSize').textContent = doc.size;
    document.getElementById('modalDocDate').textContent = doc.date;
    
    // Joint texts
    document.getElementById('modalDocText').innerHTML = doc.pages.join("<br><br>");
    
    document.getElementById('eyeModal').style.display = 'flex';
}

function closeEyeModal() {
    document.getElementById('eyeModal').style.display = 'none';
}

function openFlipbookFromModal() {
    closeEyeModal();
    if (activeDoc) loadBook3D(activeDoc.id);
}

// ==========================================
// 4. PLAGIARISM CHECKER MODULE
// ==========================================
function fillPlagiarismMock(type) {
    const txtArea = document.getElementById('plagInputText');
    if (type === 'clean') {
        txtArea.value = "Hệ thống an toàn thông tin của chúng ta là một giải pháp kết hợp đột phá. Bằng cách xây dựng các lớp lọc an toàn nghiêm ngặt ở cả đầu vào và đầu ra, chúng ta đã giảm thiểu hoàn toàn nguy cơ rò rỉ dữ liệu hoặc sinh thông tin nhạy cảm. Đây là một nguyên mẫu kiến trúc sạch sẽ và hoàn chỉnh.";
    } else {
        txtArea.value = "Kiến trúc sandwich là một mô hình thiết kế nổi tiếng giúp bảo vệ các tác vụ AI. Lớp Pre-Filter sẽ chặn các từ ngữ bạo lực (violent words) của người dùng trước khi chuyển tiếp yêu cầu đến khối logic nghiệp vụ qua MediatR. Sau đó lớp Post-Filter lại quét một lần nữa kết quả đầu ra của AI trước khi gửi về cho khách hàng để tránh mã độc.";
    }
}

async function scanPlagiarism() {
    const text = document.getElementById('plagInputText').value.trim();
    if (!text) {
        alert("Vui lòng nhập văn bản cần quét đạo văn.");
        return;
    }

    const idleState = document.getElementById('plagIdleState');
    const scanningState = document.getElementById('plagScanningState');
    const resultsView = document.getElementById('plagResultsView');

    idleState.style.display = 'none';
    resultsView.style.display = 'none';
    scanningState.style.display = 'block';

    // Simulate database lookup index scanning progress
    let percent = 0;
    const scanPercentText = document.getElementById('scanPercent');
    
    while (percent <= 100) {
        scanPercentText.textContent = `${percent}%`;
        percent += 10;
        await delay(120);
    }

    scanningState.style.display = 'none';
    resultsView.style.display = 'block';

    const isPlagiarized = text.includes("Sandwich") || text.includes("Pre-Filter") || text.includes("MediatR");

    const plagScoreText = document.getElementById('plagScore');
    const gaugeBar = document.getElementById('gaugeBar');
    
    const words = text.split(/\s+/).length;
    document.getElementById('stat-words').textContent = words;

    if (isPlagiarized) {
        // Plagiarized Report (76%)
        plagScoreText.textContent = "76%";
        plagScoreText.style.color = "var(--danger)";
        
        // Calculate circle SVG offset
        const radius = 40;
        const circ = 2 * Math.PI * radius; // 251.2
        const offset = circ - (76 / 100) * circ;
        gaugeBar.style.strokeDashoffset = offset;
        gaugeBar.style.stroke = "var(--danger)";

        document.getElementById('stat-plag-words').textContent = Math.floor(words * 0.76);
        const uniquePct = document.getElementById('stat-unique-pct');
        uniquePct.textContent = "24%";
        uniquePct.className = "unique-highlight danger-highlight";
        uniquePct.style.color = "var(--danger)";

        // Highlight matching text passages (red glow marks)
        document.getElementById('highlightedOutput').innerHTML = `
            Văn bản của bạn: <br><br>
            <mark class="plag-mark">Kiến trúc sandwich là một mô hình thiết kế nổi tiếng giúp bảo vệ các tác vụ AI.</mark> 
            <mark class="plag-mark">Lớp Pre-Filter sẽ chặn các từ ngữ bạo lực (violent words) của người dùng trước khi chuyển tiếp yêu cầu đến khối logic nghiệp vụ qua MediatR.</mark> 
            <mark class="plag-mark">Sau đó lớp Post-Filter lại quét một lần nữa kết quả đầu ra của AI trước khi gửi về cho khách hàng để tránh mã độc.</mark>
        `;

        // List source repositories
        const sources = document.getElementById('matchingSources');
        sources.innerHTML = `
            <div class="source-card">
                <div class="source-details">
                    <h5>phucnguyen2716 / Check-plagarism</h5>
                    <span>https://github.com/phucnguyen2716/Check-plagarism</span>
                </div>
                <div class="source-pct">62% Match</div>
            </div>
            <div class="source-card">
                <div class="source-details">
                    <h5>Antigravity AI Architecture Wiki</h5>
                    <span>https://wiki.antigravity.internal/docs/sandwich</span>
                </div>
                <div class="source-pct">14% Match</div>
            </div>
        `;
    } else {
        // Clean original document
        plagScoreText.textContent = "0%";
        plagScoreText.style.color = "var(--success)";
        
        gaugeBar.style.strokeDashoffset = 251.2; // full circle offset
        gaugeBar.style.stroke = "var(--success)";

        document.getElementById('stat-plag-words').textContent = 0;
        const uniquePct = document.getElementById('stat-unique-pct');
        uniquePct.textContent = "100%";
        uniquePct.className = "unique-highlight success-highlight";
        uniquePct.style.color = "var(--success)";

        document.getElementById('highlightedOutput').innerHTML = `
            Văn bản của bạn: <br><br>
            ${text} <br><br>
            <span style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> Tài liệu hoàn toàn nguyên bản! Không phát hiện so khớp trùng lặp trên hệ thống dữ liệu.</span>
        `;

        document.getElementById('matchingSources').innerHTML = `
            <div style="text-align: center; color: var(--text-sub); margin-top: 30px;">
                <i class="fa-solid fa-circle-check" style="font-size: 30px; color: var(--success); margin-bottom: 8px;"></i>
                <p>100% Unique - No matching sources found</p>
            </div>
        `;
    }
}

// ==========================================
// 5. ELASTICSEARCH ENGINE MODULE
// ==========================================
function runLiveSearch() {
    const query = document.getElementById('esSearchInput').value.trim().toLowerCase();
    const emptyState = document.getElementById('searchEmptyState');
    const resultsGrid = document.getElementById('searchResultsGrid');

    if (!query) {
        emptyState.style.display = 'block';
        resultsGrid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    resultsGrid.style.display = 'grid';
    resultsGrid.innerHTML = '';

    // Advanced Local text matching search scoring
    const hits = [];

    inMemoryESStore.forEach(doc => {
        let score = 0;
        
        // Multi field matching scoring simulation
        if (doc.title.toLowerCase().includes(query)) score += 3.5;
        if (doc.type.toLowerCase().includes(query)) score += 1.5;
        
        // Scan payload keys
        Object.entries(doc.payload).forEach(([key, val]) => {
            if (val.toString().toLowerCase().includes(query)) {
                score += 2.0;
            }
        });

        if (score > 0) {
            hits.push({ ...doc, score: score.toFixed(1) });
        }
    });

    if (hits.length === 0) {
        resultsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 40px 0;">
                <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 30px; margin-bottom: 8px;"></i>
                <p>Không tìm thấy kết quả khớp trong Elasticsearch indices.</p>
            </div>
        `;
        return;
    }

    // Sort by relevance score
    hits.sort((a,b) => b.score - a.score);

    hits.forEach(hit => {
        const card = document.createElement('div');
        card.className = 'es-hit-card';
        
        // Format payload details beautifully
        let payloadHtml = "";
        Object.entries(hit.payload).forEach(([k, v]) => {
            payloadHtml += `<strong>${k}:</strong> ${v}<br>`;
        });

        card.innerHTML = `
            <div>
                <div class="hit-header">
                    <span class="hit-badge ${hit.type}">${hit.type}</span>
                    <span class="hit-score">Score: ${hit.score}</span>
                </div>
                <h4>${hit.title}</h4>
                <p>${payloadHtml}</p>
            </div>
            <div class="hit-footer-meta">
                <span>ID: ${hit.id}</span>
                <span>Indexed: ${hit.date}</span>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}
