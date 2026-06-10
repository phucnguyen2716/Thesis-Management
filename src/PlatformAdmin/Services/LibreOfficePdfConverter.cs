using System.Diagnostics;

namespace PlatformAdmin.Services;

public interface ILibreOfficePdfConverter
{
    Task<string?> ConvertToPdfAsync(string inputFilePath, string outputDirectory, CancellationToken cancellationToken = default);
    bool IsWordMimeType(string mimeType, string fileName);
}

public class LibreOfficePdfConverter : ILibreOfficePdfConverter
{
    private readonly ILogger<LibreOfficePdfConverter> _logger;
    private readonly string _sofficePath;

    private static readonly HashSet<string> WordMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.oasis.opendocument.text",
    };

    public LibreOfficePdfConverter(IConfiguration configuration, ILogger<LibreOfficePdfConverter> logger)
    {
        _logger = logger;
        _sofficePath = configuration["LibreOffice:SofficePath"] ?? "soffice";
    }

    public bool IsWordMimeType(string mimeType, string fileName)
    {
        if (WordMimeTypes.Contains(mimeType)) return true;
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext is ".doc" or ".docx" or ".odt" or ".rtf";
    }

    public async Task<string?> ConvertToPdfAsync(string inputFilePath, string outputDirectory, CancellationToken cancellationToken = default)
    {
        if (!File.Exists(inputFilePath))
        {
            _logger.LogWarning("LibreOffice: input file not found: {Path}", inputFilePath);
            return null;
        }

        Directory.CreateDirectory(outputDirectory);

        var psi = new ProcessStartInfo
        {
            FileName = _sofficePath,
            Arguments = $"--headless --nologo --nofirststartwizard --convert-to pdf --outdir \"{outputDirectory}\" \"{inputFilePath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        try
        {
            using var process = Process.Start(psi);
            if (process == null)
            {
                _logger.LogWarning("LibreOffice: could not start process. Is LibreOffice installed? Path: {Path}", _sofficePath);
                return null;
            }

            var stdout = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            var stderr = await process.StandardError.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("LibreOffice conversion failed (exit {Code}): {Err}", process.ExitCode, stderr);
                return null;
            }

            var expectedPdf = Path.Combine(outputDirectory, Path.GetFileNameWithoutExtension(inputFilePath) + ".pdf");
            if (File.Exists(expectedPdf))
            {
                _logger.LogInformation("LibreOffice: converted {Input} → {Output}", inputFilePath, expectedPdf);
                return expectedPdf;
            }

            var anyPdf = Directory.GetFiles(outputDirectory, "*.pdf").FirstOrDefault();
            if (anyPdf != null)
            {
                _logger.LogInformation("LibreOffice: found PDF at {Path}", anyPdf);
                return anyPdf;
            }

            _logger.LogWarning("LibreOffice: no PDF produced. stdout={Out} stderr={Err}", stdout, stderr);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LibreOffice conversion error for {File}", inputFilePath);
            return null;
        }
    }
}
