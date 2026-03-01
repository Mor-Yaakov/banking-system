using BankingSystem.Api.Enums;

namespace BankingSystem.Api.Models
{
    public class Transaction
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public required string FullNameHebrew { get; set; }
        public required string FullNameEnglish { get; set; }
        public DateTime BirthDate { get; set; }
        public required string BankAccount { get; set; }
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public User? User { get; set; }
    }
}
