using AuthorizeNet.Api.Contracts.V1;
using AuthorizeNet.Api.Controllers;
using AuthorizeNet.Api.Controllers.Bases;
using IntegrationService.Core.Configuration;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;

namespace IntegrationService.Core.Services
{
    /// <summary>
    /// Payment processing service using Authorize.net SDK
    /// Handles card tokenization, charging, voiding, and customer profiles
    /// </summary>
    public class PaymentService : IPaymentService
    {
        private readonly AuthorizeNetSettings _settings;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            IOptions<AuthorizeNetSettings> settings,
            ILogger<PaymentService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Charge a credit card using an opaque payment token from mobile tokenization
        /// </summary>
        public Task<PaymentResult> ChargeCardAsync(PaymentRequest request)
        {
            try
            {
                // Set Authorize.net environment
                ApiOperationBase<ANetApiRequest, ANetApiResponse>.RunEnvironment =
                    _settings.IsSandbox ? AuthorizeNet.Environment.SANDBOX : AuthorizeNet.Environment.PRODUCTION;

                // Create merchant authentication
                var merchantAuthentication = new merchantAuthenticationType
                {
                    name = _settings.ApiLoginId,
                    ItemElementName = ItemChoiceType.transactionKey,
                    Item = _settings.TransactionKey
                };

                // Create opaque data from token
                var opaqueData = new opaqueDataType
                {
                    dataDescriptor = request.Token.DataDescriptor,
                    dataValue = request.Token.DataValue
                };

                // Create payment type
                var paymentType = new paymentType
                {
                    Item = opaqueData
                };

                // Create order information
                var order = new orderType
                {
                    invoiceNumber = request.DailyOrderNumber.ToString()
                };

                // Create customer data
                var customer = new customerDataType
                {
                    id = request.CustomerId?.ToString()
                };

                // Create transaction request
                var transactionRequest = new transactionRequestType
                {
                    transactionType = transactionTypeEnum.authCaptureTransaction.ToString(),
                    amount = request.Amount,
                    payment = paymentType,
                    order = order,
                    customer = customer
                };

                // Create API request
                var apiRequest = new createTransactionRequest
                {
                    merchantAuthentication = merchantAuthentication,
                    transactionRequest = transactionRequest
                };

                // Execute transaction
                var controller = new createTransactionController(apiRequest);
                controller.Execute();

                var response = controller.GetApiResponse();

                // Check for successful response
                if (response?.messages.resultCode == messageTypeEnum.Ok &&
                    response.transactionResponse != null)
                {
                    var txnResponse = response.transactionResponse;

                    if (txnResponse.responseCode == "1") // Approved
                    {
                        _logger.LogInformation(
                            "Payment approved - TransactionId: {TransactionId}, AuthCode: {AuthCode}, Status: Approved",
                            txnResponse.transId,
                            txnResponse.authCode);

                        return Task.FromResult(new PaymentResult
                        {
                            Success = true,
                            TransactionId = txnResponse.transId,
                            AuthorizationCode = txnResponse.authCode,
                            Last4Digits = txnResponse.accountNumber,
                            CardType = txnResponse.accountType
                        });
                    }
                    else
                    {
                        // Transaction declined or error
                        var errorMessage = txnResponse.errors?.Length > 0
                            ? txnResponse.errors[0].errorText
                            : txnResponse.messages?.FirstOrDefault()?.description ?? "Transaction declined";

                        var errorCode = txnResponse.errors?.Length > 0
                            ? txnResponse.errors[0].errorCode
                            : txnResponse.responseCode;

                        _logger.LogWarning(
                            "Payment declined - TransactionId: {TransactionId}, ResponseCode: {ResponseCode}, Message: {ErrorMessage}",
                            txnResponse.transId,
                            errorCode,
                            errorMessage);

                        return Task.FromResult(new PaymentResult
                        {
                            Success = false,
                            ErrorMessage = errorMessage,
                            ErrorCode = errorCode
                        });
                    }
                }
                else if (response?.messages.resultCode == messageTypeEnum.Error)
                {
                    // API-level error
                    var errorMessage = response?.messages.message?.Length > 0
                        ? response.messages.message[0].text
                        : "Unknown error occurred";

                    var errorCode = response?.messages.message?.Length > 0
                        ? response.messages.message[0].code
                        : "UNKNOWN";

                    _logger.LogError(
                        "Payment API error - Status: Error, ErrorCode: {ErrorCode}, Message: {ErrorMessage}",
                        errorCode,
                        errorMessage);

                    return Task.FromResult(new PaymentResult
                    {
                        Success = false,
                        ErrorMessage = errorMessage,
                        ErrorCode = errorCode
                    });
                }
                
                _logger.LogError("Payment failed with unknown error - Response is null or incomplete");
                return Task.FromResult(new PaymentResult
                {
                    Success = false,
                    ErrorMessage = "Unknown error occurred",
                    ErrorCode = "UNKNOWN"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception during payment processing");
                return Task.FromResult(new PaymentResult
                {
                    Success = false,
                    ErrorMessage = "Payment processing failed: " + ex.Message,
                    ErrorCode = "EXCEPTION"
                });
            }
        }

        /// <summary>
        /// Void a transaction - must be done before settlement (typically same business day)
        /// Uses retry policy for transient network errors
        /// </summary>
        public async Task<bool> VoidTransactionAsync(string transactionId)
        {
            // Define retry policy: 3 retries with exponential backoff (2^attempt seconds)
            var retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                    onRetry: (exception, timeSpan, retryCount, context) =>
                    {
                        _logger.LogWarning(
                            "Retry {RetryCount} for void transaction {TransactionId} after {Delay}ms - Error: {Error}",
                            retryCount,
                            transactionId,
                            timeSpan.TotalMilliseconds,
                            exception.Message);
                    });

            return await retryPolicy.ExecuteAsync(async () =>
            {
                // Set Authorize.net environment
                ApiOperationBase<ANetApiRequest, ANetApiResponse>.RunEnvironment =
                    _settings.IsSandbox ? AuthorizeNet.Environment.SANDBOX : AuthorizeNet.Environment.PRODUCTION;

                // Create merchant authentication
                var merchantAuthentication = new merchantAuthenticationType
                {
                    name = _settings.ApiLoginId,
                    ItemElementName = ItemChoiceType.transactionKey,
                    Item = _settings.TransactionKey
                };

                // Create void transaction request
                var transactionRequest = new transactionRequestType
                {
                    transactionType = transactionTypeEnum.voidTransaction.ToString(),
                    refTransId = transactionId
                };

                // Create API request
                var apiRequest = new createTransactionRequest
                {
                    merchantAuthentication = merchantAuthentication,
                    transactionRequest = transactionRequest
                };

                // Execute void
                var controller = new createTransactionController(apiRequest);
                controller.Execute();

                var response = controller.GetApiResponse();

                // Check for successful void
                if (response?.messages.resultCode == messageTypeEnum.Ok)
                {
                    _logger.LogInformation(
                        "Transaction voided successfully - TransactionId: {TransactionId}",
                        transactionId);
                    return true;
                }
                else
                {
                    var errorMessage = response?.messages.message?.Length > 0
                        ? response.messages.message[0].text
                        : "Unknown error";

                    // Check if transaction is already settled (cannot void)
                    if (errorMessage.Contains("settled", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogCritical(
                            "Transaction already settled - MANUAL REFUND REQUIRED - TransactionId: {TransactionId}",
                            transactionId);
                        return false; // Don't retry settled transactions
                    }

                    _logger.LogError(
                        "Failed to void transaction {TransactionId} - Error: {ErrorMessage}",
                        transactionId,
                        errorMessage);

                    // Throw to trigger retry
                    throw new Exception($"Void failed: {errorMessage}");
                }
            });
        }

        /// <summary>
        /// Refund a settled transaction - use when void fails because transaction was already settled
        /// Uses retry policy for transient network errors
        /// </summary>
        public async Task<bool> RefundTransactionAsync(string transactionId, decimal amount)
        {
            // Define retry policy: 3 retries with exponential backoff (2^attempt seconds)
            var retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                    onRetry: (exception, timeSpan, retryCount, context) =>
                    {
                        _logger.LogWarning(
                            "Retry {RetryCount} for refund transaction {TransactionId} after {Delay}ms - Error: {Error}",
                            retryCount,
                            transactionId,
                            timeSpan.TotalMilliseconds,
                            exception.Message);
                    });

            try
            {
                return await retryPolicy.ExecuteAsync(async () =>
                {
                    // Set Authorize.net environment
                    ApiOperationBase<ANetApiRequest, ANetApiResponse>.RunEnvironment =
                        _settings.IsSandbox ? AuthorizeNet.Environment.SANDBOX : AuthorizeNet.Environment.PRODUCTION;

                    // Create merchant authentication
                    var merchantAuthentication = new merchantAuthenticationType
                    {
                        name = _settings.ApiLoginId,
                        ItemElementName = ItemChoiceType.transactionKey,
                        Item = _settings.TransactionKey
                    };

                    // Create refund transaction request
                    // Note: For refunds, we need the original transaction ID and amount
                    var transactionRequest = new transactionRequestType
                    {
                        transactionType = transactionTypeEnum.refundTransaction.ToString(),
                        amount = amount,
                        refTransId = transactionId
                    };

                    // Create API request
                    var apiRequest = new createTransactionRequest
                    {
                        merchantAuthentication = merchantAuthentication,
                        transactionRequest = transactionRequest
                    };

                    // Execute refund
                    var controller = new createTransactionController(apiRequest);
                    controller.Execute();

                    var response = controller.GetApiResponse();

                    // Check for successful refund
                    if (response?.messages.resultCode == messageTypeEnum.Ok)
                    {
                        _logger.LogInformation(
                            "Transaction refunded successfully - TransactionId: {TransactionId}, Amount: {Amount}",
                            transactionId, amount);
                        return true;
                    }
                    else
                    {
                        var errorMessage = response?.messages.message?.Length > 0
                            ? response.messages.message[0].text
                            : "Unknown error";

                        _logger.LogError(
                            "Failed to refund transaction {TransactionId} - Error: {ErrorMessage}",
                            transactionId,
                            errorMessage);

                        // Throw to trigger retry
                        throw new Exception($"Refund failed: {errorMessage}");
                    }
                });
            }
            catch (Exception ex)
            {
                // Log critical after all retries exhausted
                _logger.LogCritical(
                    "Refund FAILED after all retries - MANUAL REFUND REQUIRED - TransactionId: {TransactionId}, Amount: {Amount}, Error: {Error}",
                    transactionId, amount, ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Create a customer payment profile for saved card functionality
        /// </summary>
        public async Task<CustomerProfileResult> CreateCustomerProfileAsync(SavedCardRequest request)
        {
            try
            {
                // Set Authorize.net environment
                ApiOperationBase<ANetApiRequest, ANetApiResponse>.RunEnvironment =
                    _settings.IsSandbox ? AuthorizeNet.Environment.SANDBOX : AuthorizeNet.Environment.PRODUCTION;

                // Create merchant authentication
                var merchantAuthentication = new merchantAuthenticationType
                {
                    name = _settings.ApiLoginId,
                    ItemElementName = ItemChoiceType.transactionKey,
                    Item = _settings.TransactionKey
                };

                // Create opaque data from token
                var opaqueData = new opaqueDataType
                {
                    dataDescriptor = request.PaymentToken.DataDescriptor,
                    dataValue = request.PaymentToken.DataValue
                };

                // Create payment profile
                var paymentProfile = new customerPaymentProfileType
                {
                    payment = new paymentType { Item = opaqueData }
                };

                // Create customer profile
                var customerProfile = new customerProfileType
                {
                    merchantCustomerId = request.CustomerId.ToString(),
                    email = request.Email,
                    paymentProfiles = new[] { paymentProfile }
                };

                // Create API request
                var apiRequest = new createCustomerProfileRequest
                {
                    merchantAuthentication = merchantAuthentication,
                    profile = customerProfile
                };

                // Execute request
                var controller = new createCustomerProfileController(apiRequest);
                controller.Execute();

                var response = controller.GetApiResponse();

                // Check for successful creation
                if (response?.messages.resultCode == messageTypeEnum.Ok)
                {
                    _logger.LogInformation(
                        "Customer profile created - CustomerId: {CustomerId}, ProfileId: {ProfileId}",
                        request.CustomerId,
                        response.customerProfileId);

                    return new CustomerProfileResult
                    {
                        Success = true,
                        ProfileId = response.customerProfileId,
                        PaymentProfileId = response.customerPaymentProfileIdList?.FirstOrDefault()
                    };
                }
                else
                {
                    var errorMessage = response?.messages.message?.Length > 0
                        ? response.messages.message[0].text
                        : "Unknown error occurred";

                    _logger.LogError(
                        "Failed to create customer profile - CustomerId: {CustomerId}, Error: {ErrorMessage}",
                        request.CustomerId,
                        errorMessage);

                    return new CustomerProfileResult
                    {
                        Success = false,
                        ErrorMessage = errorMessage
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception creating customer profile - CustomerId: {CustomerId}", request.CustomerId);
                return new CustomerProfileResult
                {
                    Success = false,
                    ErrorMessage = "Profile creation failed: " + ex.Message
                };
            }
        }
    }
}
