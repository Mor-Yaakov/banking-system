using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs;
using BankingSystem.Api.Enums;
using BankingSystem.Api.Models;
using BankingSystem.Api.Services;
using BankingSystem.Api.Services.Interfaces;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace BankingSystem.Tests;

public class TransactionServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly Mock<IExternalBankingService> _externalServiceMock;
    private readonly TransactionService _service;

    public TransactionServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _externalServiceMock = new Mock<IExternalBankingService>();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ExternalProvider:SecretId"] = "TestSecret123"
            })
            .Build();

        var logger = Mock.Of<ILogger<TransactionService>>();

        _service = new TransactionService(_context, _externalServiceMock.Object, logger, config);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private static CreateTransactionRequest MakeRequest(
        TransactionType type = TransactionType.Deposit,
        decimal amount = 1000m,
        string bankAccount = "1234567890") => new()
    {
        PersonalUserIdNumber = "123456789",
        FullNameHebrew = "ישראל ישראלי",
        FullNameEnglish = "Israel Israeli",
        BirthDate = new DateTime(1990, 1, 1),
        BankAccount = bankAccount,
        Amount = amount,
        Type = type
    };

    private void SetupExternalServiceSuccess()
    {
        _externalServiceMock
            .Setup(x => x.CreateTokenAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, "FakeToken"));

        _externalServiceMock
            .Setup(x => x.DepositAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>()))
            .ReturnsAsync((true, "DepositCompleted"));

        _externalServiceMock
            .Setup(x => x.WithdrawalAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>()))
            .ReturnsAsync((true, "WithdrawalCompleted"));
    }

    [Fact]
    public async Task CreateTransaction_NewUser_Deposit_CreatesUserAndTransaction()
    {
        SetupExternalServiceSuccess();
        var request = MakeRequest();

        var result = await _service.CreateTransactionAsync(request);

        Assert.Equal(TransactionStatus.Success, result.Status);
        Assert.Equal(TransactionType.Deposit, result.Type);
        Assert.Equal(1000m, result.Amount);
        Assert.Equal("123456789", result.PersonalUserIdNumber);

        var userInDb = await _context.Users.SingleAsync();
        Assert.Equal("123456789", userInDb.PersonalIdNumber);

        var txInDb = await _context.Transactions.SingleAsync();
        Assert.Equal(TransactionStatus.Success, txInDb.Status);
    }

    [Fact]
    public async Task CreateTransaction_ExistingUser_DoesNotDuplicateUser()
    {
        SetupExternalServiceSuccess();
        var request = MakeRequest();

        await _service.CreateTransactionAsync(request);
        await _service.CreateTransactionAsync(request);

        Assert.Equal(1, await _context.Users.CountAsync());
        Assert.Equal(2, await _context.Transactions.CountAsync());
    }

    [Fact]
    public async Task CreateTransaction_Withdrawal_CallsWithdrawalEndpoint()
    {
        SetupExternalServiceSuccess();
        var request = MakeRequest(type: TransactionType.Withdrawal);

        var result = await _service.CreateTransactionAsync(request);

        Assert.Equal(TransactionStatus.Success, result.Status);
        Assert.Equal(TransactionType.Withdrawal, result.Type);
        _externalServiceMock.Verify(
            x => x.WithdrawalAsync("FakeToken", 1000m, "1234567890"),
            Times.Once);
    }

    [Fact]
    public async Task CreateTransaction_TokenFails_ReturnsFailedWithEmptyId()
    {
        _externalServiceMock
            .Setup(x => x.CreateTokenAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((false, (string?)null));

        var result = await _service.CreateTransactionAsync(MakeRequest());

        Assert.Equal(Guid.Empty, result.Id);
        Assert.Equal(TransactionStatus.Failed, result.Status);
        Assert.Empty(await _context.Transactions.ToListAsync());
    }

    [Fact]
    public async Task CreateTransaction_TokenThrows_ReturnsFailedGracefully()
    {
        _externalServiceMock
            .Setup(x => x.CreateTokenAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new HttpRequestException("Connection refused"));

        var result = await _service.CreateTransactionAsync(MakeRequest());

        Assert.Equal(Guid.Empty, result.Id);
        Assert.Equal(TransactionStatus.Failed, result.Status);
    }

    [Fact]
    public async Task CreateTransaction_DepositFails_StatusIsFailed()
    {
        _externalServiceMock
            .Setup(x => x.CreateTokenAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, "FakeToken"));
        _externalServiceMock
            .Setup(x => x.DepositAsync(It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>()))
            .ReturnsAsync((false, "Failed"));

        var result = await _service.CreateTransactionAsync(MakeRequest());

        Assert.Equal(TransactionStatus.Failed, result.Status);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task GetTransactionsByUser_ReturnsTransactionsOrderedByDate()
    {
        SetupExternalServiceSuccess();
        var r1 = MakeRequest(amount: 100m);
        var r2 = MakeRequest(amount: 200m);

        await _service.CreateTransactionAsync(r1);
        await _service.CreateTransactionAsync(r2);

        var results = await _service.GetTransactionsByUserAsync("123456789");

        Assert.Equal(2, results.Count);
        Assert.True(results[0].CreatedAt >= results[1].CreatedAt);
    }

    [Fact]
    public async Task GetTransactionsByUser_UnknownId_ReturnsEmptyList()
    {
        var results = await _service.GetTransactionsByUserAsync("999999999");

        Assert.Empty(results);
    }

    [Fact]
    public async Task UpdateTransaction_ValidId_UpdatesAmountAndBankAccount()
    {
        SetupExternalServiceSuccess();
        var created = await _service.CreateTransactionAsync(MakeRequest());

        var updateRequest = new UpdateTransactionRequest
        {
            Amount = 5000m,
            BankAccount = "9999999999"
        };

        var result = await _service.UpdateTransactionAsync(created.Id, updateRequest);

        Assert.NotNull(result);
        Assert.Equal(5000m, result.Amount);
        Assert.Equal("9999999999", result.BankAccount);

        var txInDb = await _context.Transactions.FindAsync(created.Id);
        Assert.Equal(5000m, txInDb!.Amount);
    }

    [Fact]
    public async Task UpdateTransaction_NonExistentId_ReturnsNull()
    {
        var result = await _service.UpdateTransactionAsync(
            Guid.NewGuid(),
            new UpdateTransactionRequest { Amount = 100m, BankAccount = "123" });

        Assert.Null(result);
    }


    [Fact]
    public async Task CancelTransaction_ValidId_SetsStatusToCancelled()
    {
        SetupExternalServiceSuccess();
        var created = await _service.CreateTransactionAsync(MakeRequest());

        var success = await _service.CancelTransactionAsync(created.Id);

        Assert.True(success);
        var txInDb = await _context.Transactions.FindAsync(created.Id);
        Assert.Equal(TransactionStatus.Cancelled, txInDb!.Status);
    }

    [Fact]
    public async Task CancelTransaction_NonExistentId_ReturnsFalse()
    {
        var result = await _service.CancelTransactionAsync(Guid.NewGuid());

        Assert.False(result);
    }
}
