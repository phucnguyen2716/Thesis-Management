using Npgsql;

var connStr = "Host=localhost;Port=5432;Database=ethesis_dev;Username=postgres;Password=1234";
using var conn = new NpgsqlConnection(connStr);
conn.Open();

var updates = new (int Id, string Phone)[] {
    (304, "0901234567"),
    (305, "0912345678"),
    (306, "0923456789"),
    (307, "0934567890"),
    (308, "0945678901"),
    (309, "0956789012"),
    (310, "0967890123"),
    (311, "0978901234"),
};

foreach (var (id, phone) in updates)
{
    using var cmd = new NpgsqlCommand("UPDATE \"Users\" SET \"Phone\" = @phone WHERE \"Id\" = @id", conn);
    cmd.Parameters.AddWithValue("phone", phone);
    cmd.Parameters.AddWithValue("id", id);
    var rows = cmd.ExecuteNonQuery();
    Console.WriteLine($"Updated User {id} -> Phone: {phone} (rows: {rows})");
}

// Verify
using var verify = new NpgsqlCommand("SELECT \"Id\", \"FullName\", \"Phone\", \"Department\" FROM \"Users\" WHERE \"Role\" = 'Advisor' ORDER BY \"Id\"", conn);
using var reader = verify.ExecuteReader();
Console.WriteLine("\n=== All Advisors ===");
while (reader.Read())
{
    Console.WriteLine($"ID: {reader.GetInt32(0)} | {reader.GetString(1)} | Phone: {(reader.IsDBNull(2) ? "N/A" : reader.GetString(2))} | Dept: {(reader.IsDBNull(3) ? "N/A" : reader.GetString(3))}");
}
