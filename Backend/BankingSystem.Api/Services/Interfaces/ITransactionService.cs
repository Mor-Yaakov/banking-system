using BankingSystem.Api.DTOs;

namespace BankingSystem.Api.Services.Interfaces
{
    public interface ITransactionService
    {
        Task<TransactionResponse> CreateTransactionAsync(CreateTransactionRequest request, CancellationToken cancellationToken = default);
        Task<List<TransactionResponse>> GetTransactionsByUserAsync(string userId, CancellationToken cancellationToken = default);
        Task<TransactionResponse?> UpdateTransactionAsync(Guid transactionId, UpdateTransactionRequest request, CancellationToken cancellationToken = default);
        Task<bool> CancelTransactionAsync(Guid transactionId, CancellationToken cancellationToken = default);
    }
}
