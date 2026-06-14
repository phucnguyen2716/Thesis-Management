$ProgressPreference = 'SilentlyContinue'
try {
    $dllPath = "C:\Users\nguye\Desktop\Thesis-Management\src\PlatformAdmin\bin\Debug\net8.0\Npgsql.dll"
    if (Test-Path $dllPath) {
        [System.Reflection.Assembly]::LoadFrom($dllPath) > $null
    } else {
        Write-Error "Npgsql.dll not found at $dllPath!"
        exit 1
    }
    
    $conn = New-Object Npgsql.NpgsqlConnection("Host=localhost;Port=5432;Database=eThesisProjectDb_dev;Username=postgres;Password=1")
    $conn.Open()
    $cmd = $conn.CreateCommand()
    
    # Check total files by category
    $cmd.CommandText = "SELECT `"Category`", COUNT(*) FROM `"DriveFileRecords`" WHERE `"IsActive`" = true GROUP BY `"Category`";"
    $reader = $cmd.ExecuteReader()
    Write-Host "Active DriveFileRecords by Category in eThesisProjectDb_dev:"
    while ($reader.Read()) {
        Write-Host "Category: $($reader.GetValue(0)) | Count: $($reader.GetValue(1))"
    }
    $reader.Close()
    
    # Check active theses by category
    $cmd.CommandText = "SELECT `"Category`", COUNT(*) FROM `"Theses`" GROUP BY `"Category`";"
    $reader = $cmd.ExecuteReader()
    Write-Host "`nTheses by Category in eThesisProjectDb_dev:"
    while ($reader.Read()) {
        Write-Host "Category: $($reader.GetValue(0)) | Count: $($reader.GetValue(1))"
    }
    $reader.Close()
    
    # Select sample topic and thesis files
    $cmd.CommandText = "SELECT `"Category`", `"StudentUid`", `"FileName`", `"LocalPdfPath`" FROM `"DriveFileRecords`" WHERE `"IsActive`" = true AND `"Category`" IN ('Topic', 'Thesis') ORDER BY `"Category`", `"StudentUid`" LIMIT 10;"
    $reader = $cmd.ExecuteReader()
    Write-Host "`nSample Sync File Records (Topic / Thesis):"
    while ($reader.Read()) {
        Write-Host "[$($reader.GetValue(0))] Student: $($reader.GetValue(1)) | File: $($reader.GetValue(2)) | Path: $($reader.GetValue(3))"
    }
    $reader.Close()
    
    $conn.Close()
} catch {
    Write-Error $_.Exception.Message
}
