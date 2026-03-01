using System.ComponentModel.DataAnnotations;
using BankingSystem.Api.Enums;

namespace BankingSystem.Api.DTOs
{
    public class CreateTransactionRequest : IValidatableObject
    {
        [Required(ErrorMessage = "חובה למלא תעודת זהות.")]
        [RegularExpression(@"^\d{9}$", ErrorMessage = "תעודת זהות חייבת להכיל 9 ספרות בלבד.")]
        public required string PersonalUserIdNumber { get; set; }

        [Required(ErrorMessage = "חובה למלא שם בעברית.")]
        [MaxLength(20, ErrorMessage = "שם בעברית עד 20 תווים.")]
        [RegularExpression(@"^[\u0590-\u05FF' \-]{1,20}$", ErrorMessage = "שם בעברית: אותיות עברית, גרש, מקף ורווח בלבד.")]
        public required string FullNameHebrew { get; set; }

        [Required(ErrorMessage = "חובה למלא שם באנגלית.")]
        [MaxLength(15, ErrorMessage = "שם באנגלית עד 15 תווים.")]
        [RegularExpression(@"^[a-zA-Z' \-]{1,15}$", ErrorMessage = "שם באנגלית: אותיות אנגלית, גרש, מקף ורווח בלבד.")]
        public required string FullNameEnglish { get; set; }

        [Required(ErrorMessage = "חובה למלא תאריך לידה.")]
        public DateTime BirthDate { get; set; }

        [Required(ErrorMessage = "חובה למלא מספר חשבון.")]
        [RegularExpression(@"^\d{1,10}$", ErrorMessage = "מספר חשבון עד 10 ספרות בלבד.")]
        public required string BankAccount { get; set; }

        [Required(ErrorMessage = "חובה למלא סכום.")]
        [Range(1, 9999999999, ErrorMessage = "סכום חייב להיות בין 1 ל-10 ספרות.")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "חובה לבחור סוג פעולה.")]
        public TransactionType Type { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (BirthDate.Year < 1900 || BirthDate > DateTime.Today)
            {
                yield return new ValidationResult(
                    "תאריך לידה חייב להיות בין שנת 1900 לתאריך הנוכחי.",
                    new[] { nameof(BirthDate) });
            }
        }
    }
}
