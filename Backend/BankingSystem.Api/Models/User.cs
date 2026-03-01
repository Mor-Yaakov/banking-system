namespace BankingSystem.Api.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public required string PersonalIdNumber { get; set; }
        public required string FullNameHebrew { get; set; }
        public required string FullNameEnglish { get; set; }
        public DateTime BirthDate { get; set; }

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
