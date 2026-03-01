using BankingSystem.Api.DTOs;
using BankingSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BankingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionService _service;

        public TransactionsController(ITransactionService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<TransactionResponse>> CreateTransaction(
            CreateTransactionRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _service.CreateTransactionAsync(request, cancellationToken);
            
            return Ok(result);
        }

        [HttpGet("{userId}")]
        public async Task<ActionResult<List<TransactionResponse>>> GetTransactionsByUser(
            string userId,
            CancellationToken cancellationToken)
        {
            var result = await _service.GetTransactionsByUserAsync(userId, cancellationToken);
            return Ok(result);
        }

        [HttpPut("{transactionId:guid}")]
        public async Task<ActionResult<TransactionResponse>> UpdateTransaction(
            Guid transactionId,
            UpdateTransactionRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _service.UpdateTransactionAsync(transactionId, request, cancellationToken);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpDelete("{transactionId:guid}")]
        public async Task<IActionResult> CancelTransaction(
            Guid transactionId,
            CancellationToken cancellationToken)
        {
            var success = await _service.CancelTransactionAsync(transactionId, cancellationToken);
            if (!success)
                return NotFound();
            
            return NoContent();
        }
    }
}
