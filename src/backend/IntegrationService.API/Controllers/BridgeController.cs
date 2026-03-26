using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BridgeController : ControllerBase
    {
        private readonly ITerminalBridgeService _bridgeService;

        public BridgeController(ITerminalBridgeService bridgeService)
        {
            _bridgeService = bridgeService;
        }

        /// <summary>
        /// Request a payment from the terminal bridge
        /// </summary>
        [HttpPost("request")]
        public async Task<IActionResult> RequestPayment([FromBody] PaymentRequest request)
        {
            var transaction = await _bridgeService.RequestPaymentAsync(request.SalesId, request.OrderNumber, request.Amount);
            return Ok(transaction);
        }

        /// <summary>
        /// Callback from the terminal bridge
        /// </summary>
        [HttpPost("callback")]
        public async Task<IActionResult> ProcessCallback([FromBody] TerminalBridgeCallback callback)
        {
            var success = await _bridgeService.ProcessBridgeCallbackAsync(callback);
            if (success) return Ok(new { status = "processed" });
            return BadRequest(new { status = "error", message = "Could not process callback" });
        }

        /// <summary>
        /// Status check for terminal transaction
        /// </summary>
        [HttpGet("status/{transactionId}")]
        public async Task<IActionResult> GetStatus(int transactionId)
        {
            var transaction = await _bridgeService.GetTransactionStatusAsync(transactionId);
            if (transaction == null) return NotFound();
            return Ok(transaction);
        }

        public class PaymentRequest
        {
            public int SalesId { get; set; }
            public string OrderNumber { get; set; } = string.Empty;
            public decimal Amount { get; set; }
        }
    }
}
