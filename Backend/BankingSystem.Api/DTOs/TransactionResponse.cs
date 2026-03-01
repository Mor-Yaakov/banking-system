using BankingSystem.Api.Enums;

namespace BankingSystem.Api.DTOs
{
    public class TransactionResponse
    {
        public Guid Id { get; set; }
        public required string PersonalUserIdNumber { get; set; }
        public required string FullNameHebrew { get; set; }
        public required string FullNameEnglish { get; set; }
        public DateTime BirthDate { get; set; }
        public required string BankAccount { get; set; }
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
