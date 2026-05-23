using System;
using Microsoft.Data.SqlClient;

string connectionString = "Server=(localdb)\\mssqllocaldb;Database=eThesisDb;Trusted_Connection=True;MultipleActiveResultSets=true";

try 
{
    using (var connection = new SqlConnection(connectionString))
    {
        connection.Open();
        Console.WriteLine("Connection successful!");
        
        string query = "SELECT Id, Email, FullName, Role FROM Users";
        using (var command = new SqlCommand(query, connection))
        {
            using (var reader = command.ExecuteReader())
            {
                Console.WriteLine("Users in database:");
                while (reader.Read())
                {
                    Console.WriteLine($"- ID: {reader["Id"]}, Email: {reader["Email"]}, Name: {reader["FullName"]}, Role: {reader["Role"]}");
                }
            }
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine("Error: " + ex.Message);
}
