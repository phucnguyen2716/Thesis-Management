namespace PlatformAdmin.Entities
{
    public class PlagiarismDocument
    {
        public string Id { get; set; } = string.Empty; // Thesis ID as string
        public string Title { get; set; } = string.Empty; // Required for generic dynamic indexing title
        public string StudentName { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string Abstract { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty; // Full text contents
    }
}
