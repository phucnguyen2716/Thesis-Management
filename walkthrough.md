# Walkthrough - Enhanced Chatbot Search, Document Previews & Admin Approval Panel

We have implemented the following sets of changes:
1. Updated the chatbot's internal search algorithm to support searching by advisor name, major, and subject, making it easier for students to find specific graduation projects.
2. Fixed a critical bug in the 3D Flipbook viewer where trying to open Office files (like `.docx`) resulted in DearFlip cross-origin errors, and implemented a safe, exception-free directory traversal search for mock Google Drive files.
3. Fixed missing table schema bugs in production database (PostgreSQL on Render) by making migration scripts robust and introducing fallback table creations for `ThesisSubmissions` and `ThesisReviews` on startup.
4. Removed the Gemini API Key UI input field from the Admin portal header as requested.
5. Implemented an **"Ý kiến GV" (Lecturer Reviews)** button and modal in the Admin's Thesis Management list. Admins can now view a detailed review history (Lecturer Name, Score, Comments/Feedback, Decision Status) and download student submission documents.
6. Added a **direct approval status manager** dropdown in both the new reviews modal and the Edit modal, allowing Admins to review lecturer recommendations and instantly update/approve the thesis status.
7. **Redesigned and optimized the Admin Thesis Table Layout**: Improved spacing, alignment, and appearance of all columns by introducing user cards for students, profile icons for advisors, status dots in badges, and compact/outline action buttons.

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

## Verification Results

### Build Verification
We verified that the backend compiles correctly. Running:
```powershell
.\.dotnet\dotnet.exe build src\PlatformAdmin\PlatformAdmin.csproj
```
returned:
- **Result**: `Build succeeded.`
- **Errors**: `0 Error(s)`
