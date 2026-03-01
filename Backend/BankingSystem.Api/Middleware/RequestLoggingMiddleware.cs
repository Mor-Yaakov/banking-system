using System.Diagnostics;
using System.Text;

namespace BankingSystem.Api.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
            var method = context.Request.Method;
            var path = context.Request.Path;
            var query = context.Request.QueryString;

            context.Request.EnableBuffering();

            var requestBody = string.Empty;
            if (context.Request.ContentLength > 0)
            {
                context.Request.Body.Position = 0;
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
            }

            var startTime = Stopwatch.GetTimestamp();

            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            await _next(context);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            var responseText = await new StreamReader(context.Response.Body).ReadToEndAsync();
            context.Response.Body.Seek(0, SeekOrigin.Begin);

            var statusCode = context.Response.StatusCode;
            var elapsedMs = (Stopwatch.GetTimestamp() - startTime) * 1000.0 / Stopwatch.Frequency;

            _logger.LogInformation(
                "TraceId: {TraceId} | {Method} {Path}{Query} | RequestBody: {RequestBody} | StatusCode: {StatusCode} | Response: {Response} | Time: {ElapsedMs:F1}ms",
                traceId, method, path, query, requestBody, statusCode, responseText, elapsedMs);

            await responseBody.CopyToAsync(originalBodyStream);
        }
    }
}
