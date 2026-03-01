namespace BankingSystem.Api.Services.Interfaces
{
    public interface IExternalBankingService
    {
        Task<(bool Success, string? Token)> CreateTokenAsync(string userId, string secretId);
        Task<(bool Success, string Status)> DepositAsync(string token, decimal amount, string bankAccount);
        Task<(bool Success, string Status)> WithdrawalAsync(string token, decimal amount, string bankAccount);
    }
}
