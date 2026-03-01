using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs;
using BankingSystem.Api.Enums;
using BankingSystem.Api.Models;
using BankingSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly AppDbContext _context;
        private readonly IExternalBankingService _externalService;
        private readonly ILogger<TransactionService> _logger;
        private readonly string _secretId;

        public TransactionService(
            AppDbContext context,
            IExternalBankingService externalService,
            ILogger<TransactionService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _externalService = externalService;
            _logger = logger;
            _secretId = configuration["ExternalProvider:SecretId"]
                ?? throw new InvalidOperationException("ExternalProvider:SecretId is not configured.");
        }

        public async Task<TransactionResponse> CreateTransactionAsync(
            CreateTransactionRequest request,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.PersonalIdNumber == request.PersonalUserIdNumber, cancellationToken);

            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    PersonalIdNumber = request.PersonalUserIdNumber,
                    FullNameHebrew = request.FullNameHebrew,
                    FullNameEnglish = request.FullNameEnglish,
                    BirthDate = request.BirthDate
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var token = await SafeCreateTokenAsync(user.PersonalIdNumber);
            if (token == null)
                return BuildResponse(null, user, request, TransactionStatus.Failed);

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FullNameHebrew = user.FullNameHebrew,
                FullNameEnglish = user.FullNameEnglish,
                BirthDate = user.BirthDate,
                BankAccount = request.BankAccount,
                Amount = request.Amount,
                Type = request.Type,
                Status = TransactionStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync(cancellationToken);

            var success = await SafeExecuteTransactionAsync(transaction, token);
            transaction.Status = success ? TransactionStatus.Success : TransactionStatus.Failed;
            await _context.SaveChangesAsync(cancellationToken);

            return BuildResponse(transaction, user);
        }

        public async Task<List<TransactionResponse>> GetTransactionsByUserAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Transactions
                .AsNoTracking()
                .Where(t => t.User!.PersonalIdNumber == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TransactionResponse
                {
                    Id = t.Id,
                    PersonalUserIdNumber = t.User!.PersonalIdNumber,
                    FullNameHebrew = t.FullNameHebrew,
                    FullNameEnglish = t.FullNameEnglish,
                    BirthDate = t.BirthDate,
                    BankAccount = t.BankAccount,
                    Amount = t.Amount,
                    Type = t.Type,
                    Status = t.Status,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<TransactionResponse?> UpdateTransactionAsync(
            Guid transactionId,
            UpdateTransactionRequest request,
            CancellationToken cancellationToken = default)
        {
            var transaction = await _context.Transactions
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == transactionId, cancellationToken);

            if (transaction == null)
                return null;

            transaction.Amount = request.Amount;
            transaction.BankAccount = request.BankAccount;
            await _context.SaveChangesAsync(cancellationToken);

            return BuildResponse(transaction, transaction.User!);
        }

        public async Task<bool> CancelTransactionAsync(
            Guid transactionId,
            CancellationToken cancellationToken = default)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == transactionId, cancellationToken);

            if (transaction == null)
                return false;

            transaction.Status = TransactionStatus.Cancelled;
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        private async Task<string?> SafeCreateTokenAsync(string userId)
        {
            try
            {
                var (success, token) = await _externalService.CreateTokenAsync(userId, _secretId);
                return success ? token : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token creation failed for user {UserId}", userId);
                return null;
            }
        }

        private async Task<bool> SafeExecuteTransactionAsync(Transaction transaction, string token)
        {
            try
            {
                var (success, _) = transaction.Type == TransactionType.Deposit
                    ? await _externalService.DepositAsync(token, transaction.Amount, transaction.BankAccount)
                    : await _externalService.WithdrawalAsync(token, transaction.Amount, transaction.BankAccount);
                return success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transaction execution failed for {TransactionId}", transaction.Id);
                return false;
            }
        }

        private static TransactionResponse BuildResponse(
            Transaction? transaction,
            User user,
            CreateTransactionRequest? request = null,
            TransactionStatus? forcedStatus = null)
        {
            if (transaction != null)
            {
                return new TransactionResponse
                {
                    Id = transaction.Id,
                    PersonalUserIdNumber = user.PersonalIdNumber,
                    FullNameHebrew = transaction.FullNameHebrew,
                    FullNameEnglish = transaction.FullNameEnglish,
                    BirthDate = transaction.BirthDate,
                    BankAccount = transaction.BankAccount,
                    Amount = transaction.Amount,
                    Type = transaction.Type,
                    Status = forcedStatus ?? transaction.Status,
                    CreatedAt = transaction.CreatedAt
                };
            }

            return new TransactionResponse
            {
                Id = Guid.Empty,
                PersonalUserIdNumber = user.PersonalIdNumber,
                FullNameHebrew = user.FullNameHebrew,
                FullNameEnglish = user.FullNameEnglish,
                BirthDate = user.BirthDate,
                BankAccount = request?.BankAccount ?? string.Empty,
                Amount = request?.Amount ?? 0,
                Type = request?.Type ?? TransactionType.Deposit,
                Status = forcedStatus ?? TransactionStatus.Failed,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
