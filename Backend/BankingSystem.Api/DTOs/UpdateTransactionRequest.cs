using System.ComponentModel.DataAnnotations;

namespace BankingSystem.Api.DTOs
{
    public class UpdateTransactionRequest
    {
        [Required(ErrorMessage = "חובה למלא סכום.")]
        [Range(1, 9999999999, ErrorMessage = "סכום חייב להיות בין 1 ל-10 ספרות.")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "חובה למלא מספר חשבון.")]
        [RegularExpression(@"^\d{1,10}$", ErrorMessage = "מספר חשבון עד 10 ספרות בלבד.")]
        public required string BankAccount { get; set; }
    }
}
