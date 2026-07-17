# Walkthrough - Enhanced Chatbot Search & Document Previews

We have implemented the following sets of changes:
1. Updated the chatbot's internal search algorithm to support searching by advisor name, major, and subject, making it easier for students to find specific graduation projects.
2. Fixed a critical bug in the 3D Flipbook viewer where trying to open Office files (like `.docx`) resulted in DearFlip cross-origin errors, and implemented a safe, exception-free directory traversal search for mock Google Drive files.
3. Fixed missing table schema bugs in production database (PostgreSQL on Render) by making migration scripts robust and introducing fallback table creations for `ThesisSubmissions` and `ThesisReviews` on startup.

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

## Verification Results

### Build Verification
We verified that the backend compiles correctly. Running:
```powershell
.\.dotnet\dotnet.exe build src\PlatformAdmin\PlatformAdmin.csproj
```
returned:
- **Result**: `Build succeeded.`
- **Errors**: `0 Error(s)`
