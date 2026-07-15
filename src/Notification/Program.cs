using Microsoft.AspNetCore.SignalR;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Enable CORS for React Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://ethesis-frontend-portal.onrender.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowClient");

// SignalR Hub mapping
app.MapHub<NotificationHub>("/notificationHub");

// REST Endpoint to publish notifications (to be called by other microservices)
app.MapPost("/api/notifications", async (NotificationRequest request, IHubContext<NotificationHub> hubContext) =>
{
    if (string.IsNullOrEmpty(request.RecipientEmail))
    {
        return Results.BadRequest(new { message = "RecipientEmail is required." });
    }

    // Push the notification object to the specific user's group
    await hubContext.Clients.Group(request.RecipientEmail).SendAsync("ReceiveNotification", new
    {
        title = request.Title,
        desc = request.Desc,
        time = "Vừa xong",
        icon = request.Icon ?? "info",
        color = request.Color ?? "text-blue-600",
        bg = request.Bg ?? "bg-blue-50"
    });

    return Results.Ok(new { message = "Notification sent successfully." });
});

app.Run();

// SignalR Hub definition
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(string email)
    {
        if (!string.IsNullOrEmpty(email))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, email);
            Console.WriteLine($"[NotificationHub] User with connection {Context.ConnectionId} joined group: {email}");
        }
    }

    public async Task LeaveUserGroup(string email)
    {
        if (!string.IsNullOrEmpty(email))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, email);
            Console.WriteLine($"[NotificationHub] User with connection {Context.ConnectionId} left group: {email}");
        }
    }
}

// Request DTO definition
public class NotificationRequest
{
    [JsonPropertyName("recipientEmail")]
    public string RecipientEmail { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "info";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "text-blue-600";

    [JsonPropertyName("bg")]
    public string Bg { get; set; } = "bg-blue-50";
}
