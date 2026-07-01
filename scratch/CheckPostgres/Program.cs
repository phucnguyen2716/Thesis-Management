using System;
using Npgsql;

string connString = "Host=localhost;Port=5432;Database=eThesisProjectDb_dev;Username=postgres;Password=1";

try
{
    using (var conn = new NpgsqlConnection(connString))
    {
        conn.Open();
        Console.WriteLine("Connected!");

        using (var cmd = new NpgsqlCommand("SELECT \"Id\", \"Title\" FROM \"Theses\" WHERE \"Id\" IN (1, 2, 3)", conn))
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                Console.WriteLine($"- Found ID: {reader["Id"]}, Title: {reader["Title"]}");
            }
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine("Error: " + ex.Message);
}
