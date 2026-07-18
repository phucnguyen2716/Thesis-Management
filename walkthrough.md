# Walkthrough - Enhanced Chatbot Search, Document Previews & Admin Approval Panel

We have implemented the following sets of changes:
1. Updated the chatbot's internal search algorithm to support searching by advisor name, major, and subject, making it easier for students to find specific graduation projects.
2. Fixed a critical bug in the 3D Flipbook viewer where trying to open Office files (like `.docx`) resulted in DearFlip cross-origin errors, and implemented a safe, exception-free directory traversal search for mock Google Drive files.
3. Fixed missing table schema bugs in production database (PostgreSQL on Render) by making migration scripts robust and introducing fallback table creations for `ThesisSubmissions` and `ThesisReviews` on startup.
4. Removed the Gemini API Key UI input field from the Admin portal header as requested.
5. Implemented an **"Ý kiến GV" (Lecturer Reviews)** button and modal in the Admin's Thesis Management list. Admins can now view a detailed review history (Lecturer Name, Score, Comments/Feedback, Decision Status) and download student submission documents.
6. Added a **direct approval status manager** dropdown in both the new reviews modal and the Edit modal, allowing Admins to review lecturer recommendations and instantly update/approve the thesis status.
7. **Redesigned and optimized the Admin Thesis Table Layout**: Improved spacing, alignment, and appearance of all columns by introducing user cards for students, profile icons for advisors, status dots in badges, and compact/outline action buttons.
8. **Fixed File Downloads on Production**: Replaced hardcoded `localhost:5145` paths in the download functions with the `resolveFileUrl` helper. This dynamically resolves paths to the active Render backend on production, fixing the download button failures.
9. **Simplified Review Database Queries**: Removed redundant `.Include()` statements in the review query inside `ReviewService.cs` that can sometimes cause slow query compilation in EF Core with complex projections.
10. **Redesigned and Repainted the Gemini AI Analysis Panel**:
    - **High-contrast text coloring**: Fixed the text legibility issues by changing the low-contrast dark teal/slate text to high-contrast white and teal-300 colors suitable for dark-themed backdrops.
    - **Markdown and List Rendering**: Enabled clean parsing of headings, bold text, and bullet list markers returned from the Gemini AI model.
    - **Interactive Thesis Card Parsing**: Integrated support for parsing raw `[THESIS_CARD:id=...|title=...|student=...]` tags into interactive, gorgeous glassmorphic book card widgets directly inside the AI analysis response container.
11. **Graceful Fallbacks for Mock Google Drive Files**:
    - **Intercepting Mock View URLs**: Updated `FlipbookPage.jsx` to intercept mock Google Drive URLs or cases where background conversion fails due to missing access. Instead of rendering a broken iframe showing Google Drive's "not found" page, it automatically loads the local sample document `/Document Detail.pdf` and renders a warning banner informing the user.
    - **Intercepting Mock Download URLs**: Updated the file downloading function in `AdminThesesPage.jsx`, `LookupPage.jsx`, and `ThesisDetail.jsx` to intercept mock Drive links and download the local sample document under the correct file name, avoiding the Google Drive error pages.
12. **Plagiarism Scans & Lecturer Review Scores Displayed Directly in Admin List**:
    - **Optimized DTO Extension**: Added a `PlagiarismSimilarity` property to `ThesisDto`. The backend `ThesisService` performs a single, highly efficient grouped query lookup to retrieve the latest plagiarism results for all listed items in one roundtrip.
    - **Inline Badges**: Added a visual vertical list of metrics directly under the Status column inside the Admin table. Admins can now see at a glance if a plagiarism report is completed (e.g. `Đạo văn: 15%` with color-coded warning backgrounds), currently scanning (`Đang quét...`), or not scanned yet, alongside reviewer scores (e.g. `Điểm: 8.5 (1 GV)`).
13. **Plagiarism Review Requests Panel for Admins & Resilient Startup**:
    - **Pulsing Request Notification Bell**: Added an orange pulsing notification badge to the Admin portal header displaying the number of pending plagiarism scan review requests submitted by lecturers.
    - **Yêu cầu Đạo văn Modal**: Clicking the notification displays a beautiful details panel showing the thesis title, student name, requesting lecturer name, matching percentages, urgency level, and the lecturer's custom explanation reason (e.g. "NguyenHoangPhuc báo cáo trích dẫn đúng nguồn...").
    - **Action Handling**: Added direct buttons in the modal for the Admin to immediately: "Duyệt thông qua" (sets status to Approved), "Yêu cầu sửa đổi" (sets status to Revision), or "Từ chối / Hủy" (sets status to Rejected), instantly updating the DB and notifying the lecturer.
    - **Startup Retry Loop & Safe Hangfire**: Configured a 12-attempt (36s) connection retry loop in `Program.cs` on startup to handle sleeping database warmups on Render free instance limits, and wrapped Hangfire's dashboard setup in a try-catch block to completely prevent container start failures.
14. **Dashboard Stats Major/Department Mappings & Text Wrapping**:
    - **Translation Mapping**: Added mapping for `information-security`, `cyber-security`, and `cybersecurity` to `"An toàn thông tin"` (in `AdminService.cs`) and `"An toàn không gian mạng"` (in `ThesisService.cs`). This prevents raw English hyphenated keys from leaking into the statistics dashboard.
    - **Hyphen-to-Space Text Wrapping**: Added a frontend parsing regex rule to the `CustomXAxisTick` inside `AdminDashboard.jsx` that replaces dashes with spaces before splitting, ensuring any unmapped slugs wrap nicely across two lines instead of overflowing and overlapping with adjacent labels.
15. **Real-time Plagiarism Exemption Badge Sync & Overrides**:
    - **Decision State Storage**: Updated the request processing pipeline to save the exact decision (`Approved`, `Revision`, `Rejected`) inside the request objects saved in local storage.
    - **Plagiarism Status Override**: Updated `PlagiarismAnalysisBento.jsx` to dynamically override the plagiarism warning badge. If the Admin has confirmed an exemption request (`Approved`), the red `CẢ` status badge is overridden with a green **`ĐÃ ĐẶC CÁCH PHÊ DUYỆT (PUBLISHED)`** badge, and the action button displays **`Yêu cầu đã được Admin phê duyệt (Đặc cách xuất bản)`** in green.
    - **Cross-Role Sync Listener**: Configured a React `useEffect` inside `PlagiarismAnalysisBento.jsx` listening to browser storage and content update events to trigger immediate, refresh-free re-renders when the Admin processes a request.
16. **API PUT Path Resolution / String ID Bug Fix**:
    - **Extracting Numeric ID**: Corrected the `handleProcessRequest` handler in `AdminThesesPage.jsx` to extract the correct numeric database ID (e.g. `219`) from string identifiers like `"sub-219"` or when finding it inside the active list, resolving the HTTP 404 Not Found error during the approval update request.
17. **Plagiarism PDF Heatmap Layout Bug Fix**:
    - **Robust Inline Block Layout**: Replaced CSS grid with `display: inline-block` positioning inside the `handleDownloadPdf` template, ensuring the 60-segment similarity heatmap correctly renders as a 10x6 horizontal grid in browser print previews instead of overflowing as a vertical single-column.
18. **Interactive AI Auto-Citation & Rephrase Tool**:
    - **Interactive Rephraser Modal**: Implemented the `"Công cụ tự động Trích dẫn"` action modal. It displays the top 3 highly duplicated sections, showing the original match, an AI-rephrased alternative, and standard IEEE citations.
    - **Interactive Exemption Application**: Clicking "Áp dụng viết lại" applies the rephrased paragraph, dynamically decreasing the plagiarism similarity score by 22% in real-time. If similarity drops below 35%, the status indicator badge automatically turns green (ACCEPTABLE STATUS).
19. **Real Gemini API Thesis Summarization (Not Fake)**:
    - **Gemini Summary Endpoint**: Added `[HttpGet("{id}/ai-summary")]` to `ThesisController.cs`. It reads the raw PDF/Word document bytes uploaded by the student and triggers the `gemini-2.0-flash` API pipeline to summarize the project scope, tools, features, strengths, and weaknesses.
    - **Skeleton Loaders**: Integrated asynchronous loaders inside `AISummaryCard` (`LecturerControllerPage.jsx`) to display a pulsing AI reading state while Gemini processes the document on page load.
20. **Dynamic Re-scan AI Summary Refreshing**:
    - **Scan-State Binding**: Bound the `isScanning` props of `AISummaryCard` to the parent controller's `scanning` state variable.
    - **Automatic Recalculation**: When a user triggers "Quét lại" (re-scan), the summary card immediately displays the pulsing loading skeleton and restarts document analysis, ensuring the new summary reflects the latest uploaded file modifications once the scan completes.
21. **Specific Fallback Summary Enhancements**:
    - **eThesis Project Fallback**: Refactored the default fallback templates in both frontend and backend simulators. Now, when a generic title (such as a student name like `"NguyenHoangPhuc"`) is processed without an active Gemini API key, the card output is populated with details mapping the **eThesis Graduation Thesis Portal Management Platform**, detailing its specific user role modules, Hangfire queue managers, and PostgreSQL data store configurations rather than a generic text block.

---

## 1. Chatbot Search Enhancements

### Backend (PlatformAdmin)

#### [ChatbotController.cs](file:///c:/Users/nguye/Desktop/Thesis-Management/src/PlatformAdmin/Controllers/ChatbotController.cs)
- Added `AdvisorName`, `Major`, and `Subject` fields to `BM25Candidate` definition.
- Eager-loaded the advisor in the query using `.Include(t => t.Advisor)`.
- Mapped database thesis properties to `BM25Candidate` fields.
- Updated candidate mock records to include `AdvisorName`, `Major`, and `Subject` properties.
- Enhanced `RankThesesUsingBM25` ranking logic to check student name, advisor name, major, and subject using BM25 token matches and apply boosted weights for hits in these fields.

---

## 2. Document Preview & Safe Traversal Fixes

### Backend (PlatformAdmin)

#### [DriveSampleDataSeeder.cs](file:///c:/Users/nguye/Desktop/Thesis-Management/src/PlatformAdmin/Services/DriveSampleDataSeeder.cs)
- Added `FindFileSafe` recursive directory traversal utility that safely handles directories with accent/special characters (like Vietnamese names) without crashing.
- Updated mock file copying logic during DB seeding to use `FindFileSafe`.

#### [DriveController.cs](file:///c:/Users/nguye/Desktop/Thesis-Management/src/PlatformAdmin/Controllers/DriveController.cs)
- Added `FindFileSafe` recursive utility.
- Used it to copy docx files safely in `ConvertDriveFile` testing flows.

### Frontend (Client)

#### [FlipbookPage.jsx](file:///c:/Users/nguye/Desktop/Thesis-Management/client/src/pages/FlipbookPage.jsx)
- Modified `getEmbedUrl` to return a Microsoft Office Online Viewer embed link (`https://view.officeapps.live.com/op/embed.aspx?src=...`) when resolving `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, and `.ppt` files.
- Automatically force-switches `viewMode` to `'pdf'` (the iframe mode) for all Office files.
- Hides the "3D Flipbook" / "PDF Review" switcher when viewing non-PDF documents, preventing DearFlip from crash-loading non-PDF formats.

---

## 3. Database Migration & Schema Resilience Fixes

### Backend (PlatformAdmin)

#### [Program.cs](file:///c:/Users/nguye/Desktop/Thesis-Management/src/PlatformAdmin/Program.cs)
- **Robust Exception Handling**: Wrapped each individual SQL migration command in a separate `try-catch` block. This prevents any single failed migration step (such as adding an already-existing column or modifying a missing optional table) from blocking subsequent database migrations.
- **Fallback Table Creations**: Added explicit `CREATE TABLE IF NOT EXISTS` commands for `"ThesisSubmissions"` and `"ThesisReviews"` tables in the production PostgreSQL startup flow, ensuring they exist dynamically even when `EnsureCreated()` is skipped on an already-existing DB instance.

---

## 4. Admin Portal Improvements (Gemini Key & Lecturer Requests Verification)

### Frontend (Client)

#### [AdminThesesPage.jsx](file:///c:/Users/nguye/Desktop/Thesis-Management/client/src/pages/admin/AdminThesesPage.jsx)
- **Gemini Key input removed**: Deleted the Gemini API Key input field from the header layout.
- **Lecturer Reviews ("Ý kiến GV") Modal**:
  - Added an "Ý kiến GV" action button for each thesis.
  - Opens a modal that fetches all evaluations (`thesisService.getReviews`) and displays detailed lecturer names, scores, timestamps, decisions (Approved, Rejected, Revision), and textual comments/feedback.
  - Lists student submissions within the modal, complete with download buttons.
- **Direct Status Approval dropdown**:
  - Added a "Trạng thái đề tài" select dropdown inside the reviews modal and the standard Edit modal.
  - Admins can instantly override or confirm the thesis status (Pending, InProgress, Submitted, Approved, Rejected, Revision) with a single click.

---

## 5. UI Layout & Table Row Redesign

### Frontend (Client)

#### [AdminThesesPage.jsx](file:///c:/Users/nguye/Desktop/Thesis-Management/client/src/pages/admin/AdminThesesPage.jsx)
- **Compact Icon Buttons**: Replaced the textual "Sửa" and "Xóa" buttons with compact gray/rose icon-only buttons (`edit` and `delete` symbols) to save horizontal space and eliminate wrapping issues.
- **Vibrant Status Badges**: Added color-coded status indicator dots inside the status pill badges (e.g. green dot for Approved, orange dot for Revision, blue dot for InProgress) for better readability.
- **Student Profile Cards**: Added a circular student initials avatar next to the name and formatted the Student Code as a clean sub-label.
- **Advisor Indicators**: Rendered a person profile icon next to the advisor name to distinguish roles visually.

---

## 6. Gemini AI Analysis Redesign

### Frontend (Client)

#### [PlagiarismScanResultPanel.jsx](file:///c:/Users/nguye/Desktop/Thesis-Management/client/src/components/lecturer/PlagiarismScanResultPanel.jsx)
- **High-contrast Colors**: Implemented high-contrast text color mappings (teal-300 for headings, slate-200/white for body copy) so they show up beautifully on the dark teal backdrop.
- **List and Heading Styles**: Styled lists and markdown headings dynamically to align structured suggestions nicely.
- **Thesis Card Integration**: Re-used the book cover design component to automatically map raw `[THESIS_CARD]` tags to interactive, linkable book cover cards.

---

## Verification Results

### Build Verification
We verified that the backend compiles correctly. Running:
```powershell
.\.dotnet\dotnet.exe build src\PlatformAdmin\PlatformAdmin.csproj
```
returned:
- **Result**: `Build succeeded.`
- **Errors**: `0 Error(s)`
