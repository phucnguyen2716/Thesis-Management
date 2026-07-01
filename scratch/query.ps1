try {
    Add-Type -Path 'C:\Users\nguye\Desktop\Thesis-Management\src\PlatformAdmin\bin\Debug\net8.0\Npgsql.dll'
    $conn = New-Object Npgsql.NpgsqlConnection('Host=localhost;Port=5432;Database=eThesisProjectDb_dev;Username=postgres;Password=1')
    $conn.Open()
    $cmd = $conn.Open().CreateCommand() # Wait, no, conn.CreateCommand()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT "Id", "Title", "Category", "Batch", "Status", "StudentId" FROM "Theses" ORDER BY "Id" DESC LIMIT 15;'
    $r = $cmd.ExecuteReader()
    Write-Host "Seeded Theses Query Results:"
    while ($r.Read()) {
        Write-Host "ID: $($r.GetInt32(0)) | Title: $($r.GetString(1)) | Category: $($r.GetString(2)) | Batch: $($r.GetInt32(3)) | Status: $($r.GetString(4)) | StudentId: $($r.GetInt32(5))"
    }
    $r.Close()
    $conn.Close()
} catch {
    Write-Error $_.Exception.Message
}
