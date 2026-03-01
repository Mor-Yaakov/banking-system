using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using BankingSystem.Api.Services.Interfaces;

namespace BankingSystem.Api.Services
{
    public class ExternalBankingService : IExternalBankingService
    {
        private readonly HttpClient _httpClient;

        public ExternalBankingService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress ??= new Uri("https://openBanking/");
        }

        public async Task<(bool Success, string? Token)> CreateTokenAsync(string userId, string secretId)
        {
            var requestBody = new
            {
                userId,
                SecretId = secretId
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/createtoken")
            {
                Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            };

            // The real call would look like:
            // var response = await _httpClient.SendAsync(request);
            // var payload = await response.Content.ReadFromJsonAsync<ExternalTokenResponse>();

            // Simulated call to external provider
            await Task.Delay(100);

            var success = !string.IsNullOrWhiteSpace(userId) && !string.IsNullOrWhiteSpace(secretId);
            return (success, success ? "FakeToken12345" : null);
        }

        public async Task<(bool Success, string Status)> DepositAsync(string token, decimal amount, string bankAccount)
        {
            var requestBody = new
            {
                amount,
                bank = bankAccount
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/createdeposit")
            {
                Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            };

            // Simulated call to external provider
            await Task.Delay(100);

            var success = !string.IsNullOrWhiteSpace(token) && amount > 0 && !string.IsNullOrWhiteSpace(bankAccount);
            return (success, success ? "DepositCompleted" : "Failed");
        }

        public async Task<(bool Success, string Status)> WithdrawalAsync(string token, decimal amount, string bankAccount)
        {
            var requestBody = new
            {
                amount,
                bank = bankAccount
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "/createWithdrawal")
            {
                Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            };

            // Simulated call to external provider
            await Task.Delay(100);

            var success = !string.IsNullOrWhiteSpace(token) && amount > 0 && !string.IsNullOrWhiteSpace(bankAccount);
            return (success, success ? "WithdrawalCompleted" : "Failed");
        }
    }
}
