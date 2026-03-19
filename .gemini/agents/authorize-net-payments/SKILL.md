---
name: authorize-net-payments
description: Handles Authorize.net payment processing using tokenization-only flow (PCI compliant - no raw card data on servers). Covers Accept.js web integration (Next.js), React Native mobile tokenization, backend charge via .NET SDK, and secure posting to POS tblPayment table.
color: teal
icon: credit-card
---

# Authorize.net Payments Skill

**Activation Triggers**  
- Mentions of "Authorize.net", "payment", "charge", "tokenization", "Accept.js", "nonce", "tblPayment", "PosTender", "card token", "payment gateway"

**Critical Security Rule – Tokenization Only**  
This project **never stores, logs, or processes raw card numbers** on IMIDUS servers.  
PCI-compliant flow:  
1. Client-side (browser/app) collects card details using Authorize.net libraries  
2. Authorize.net returns opaque token (nonce)  
3. Backend sends nonce → Authorize.net for auth/capture  
4. Only masked last-4 digits stored in `tblPayment.CardNumber` (encrypted via `dbo.EncryptString`)

**Environment Variables** (must be set – never hardcode)  
```bash
# Core credentials (from merchant account)
AUTHNET_API_LOGIN_ID=9JQVwben66U7
AUTHNET_TRANSACTION_KEY=7eqvzKDRR5Q38898
AUTHNET_CLIENT_KEY=7t8S6K3E3VV3qry33ZEWqQWqLq9xs4UmeNn268gFmZ6mdWWvz22zjHbaQH9Qmsrg

# Environment switch
AUTHNET_ENVIRONMENT=sandbox          # change to "production" when live
Backend loads from appsettings.json / configuration:
JSON"AuthorizeNet": {
  "ApiLoginId": "",
  "TransactionKey": "",
  "ClientKey": "",
  "Environment": "sandbox"
}
Frontend (Next.js) prefix:
textNEXT_PUBLIC_AUTHNET_CLIENT_KEY=...
NEXT_PUBLIC_AUTHNET_API_LOGIN=...
Backend – Charge Token (.NET / C#)
C#// AuthorizeNetService.cs
using AuthorizeNet.Api.Contracts.V1;
using AuthorizeNet.Api.Controllers;

public async Task<PaymentResult> ChargeTokenAsync(string nonce, decimal amount, string description)
{
    ApiOperationBase<ANetApiRequest, ANetApiResponse>.RunEnvironment =
        _config["AuthorizeNet:Environment"] == "production"
            ? AuthorizeNet.Environment.PRODUCTION
            : AuthorizeNet.Environment.SANDBOX;

    var merchantAuth = new merchantAuthenticationType
    {
        name = _config["AuthorizeNet:ApiLoginId"],
        ItemElementName = ItemChoiceType.transactionKey,
        Item = _config["AuthorizeNet:TransactionKey"]
    };

    var opaqueData = new opaqueDataType
    {
        dataDescriptor = "COMMON.ACCEPT.INAPP.PAYMENT",
        dataValue = nonce
    };

    var paymentType = new paymentType { Item = opaqueData };

    var transactionRequest = new createTransactionRequest
    {
        merchantAuthentication = merchantAuth,
        transactionRequest = new transactionRequestType
        {
            transactionType = transactionTypeEnum.authCaptureTransaction.ToString(),
            amount = amount,
            payment = paymentType,
            order = new orderType { description = description }
            // Recommended additions (optional but improve AVS/fraud scoring):
            // customer = new customerDataType { ... },
            // billTo = new customerAddressType { ... },
            // customerIP = HttpContext.Connection.RemoteIpAddress?.ToString()
        }
    };

    var controller = new createTransactionController(transactionRequest);
    controller.Execute();
    var response = controller.GetApiResponse();

    if (response?.messages.resultCode == messageTypeEnum.Ok)
    {
        var txn = response.transactionResponse;
        return new PaymentResult
        {
            Success = true,
            TransactionId = txn.transId,
            AuthCode = txn.authCode,
            LastFour = txn.accountNumber?.Replace("XXXX", "").Trim() ?? "XXXX",
            CardType = txn.accountType ?? "Unknown"
        };
    }

    var errorMsg = response?.transactionResponse?.errors?.FirstOrDefault()?.errorText
                ?? response?.messages?.message?.FirstOrDefault()?.text
                ?? "Payment processing failed";

    return new PaymentResult { Success = false, ErrorMessage = errorMsg };
}
Web – Accept.js (Next.js / Custom Form)
tsx// components/PaymentForm.tsx
import Script from 'next/script';

export function PaymentForm({ onToken, setError }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Assume cardNumber, expMonth, expYear, cvv from form state
    window.Accept.dispatchData(
      {
        authData: {
          clientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY,
          apiLoginID: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN,
        },
        cardData: {
          cardNumber: cardNumber.replace(/\D/g, ''),
          month: expMonth,
          year: expYear,
          cardCode: cvv,
        },
      },
      (response) => {
        if (response.messages.resultCode === "Ok") {
          onToken(response.opaqueData.dataValue);
        } else {
          setError(response.messages.message?.[0]?.text || "Card validation failed");
        }
      }
    );
  };

  return (
    <>
      <Script
        src={
          process.env.NODE_ENV === 'production'
            ? 'https://js.authorize.net/v1/Accept.js'
            : 'https://jstest.authorize.net/v1/Accept.js'
        }
        strategy="beforeInteractive"
      />
      {/* Your card input fields here */}
      <button onClick={handleSubmit}>Pay Securely</button>
    </>
  );
}
Mobile – React Native Tokenization
No official RN SDK. Recommended approaches:

Preferred (consistent & low-maintenance): WebView loading Accept.js + postMessage bridge to get nonce
Community bridge (if already using):tsximport AuthorizeNet from 'react-native-authorize-net-accept'; // example package

const getNonce = async () => {
  const result = await AuthorizeNet.getToken({
    environment: AUTHNET_ENVIRONMENT.toUpperCase(),
    apiLoginId: AUTHNET_API_LOGIN_ID,
    clientKey: AUTHNET_CLIENT_KEY,
    cardNumber,
    expirationMonth: month.padStart(2, '0'),
    expirationYear: year,
    cvv,
  });
  return result.success ? result.token : null;
};

POS Integration – After Successful Charge
C#var tender = new PosTender
{
    SalesID = salesId,
    PaymentTypeID = MapCardType(paymentResult.CardType), // e.g. 3=Visa, 4=MasterCard, 5=Amex, ...
    Amount = chargeAmount,
    CardNumber = $"XXXX{paymentResult.LastFour}",           // → dbo.EncryptString()
    AuthCode = paymentResult.AuthCode,
    RefNum = paymentResult.TransactionId,
    PaymentDateTime = DateTime.UtcNow
};

await _posRepo.InsertPaymentAsync(tender, transaction);
Error Handling Pattern (API Controller)
C#try
{
    var result = await _authNetService.ChargeTokenAsync(nonce, total, "IMIDUS Order");
    if (!result.Success)
        return BadRequest(new { error = "Payment declined – please try another card" });

    // Proceed to create POS tender...
}
catch (Exception ex)
{
    _logger.LogError(ex, "Payment processing failed for {OrderKey}", idempotencyKey);
    return StatusCode(500, new { error = "Payment system error – please contact support" });
}
Never

Expose raw Authorize.net error codes/messages to users
Create POS record on failed payment
Store/log/transmit full card data

Sandbox Test Cards (any future expiry, any 3-4 digit CVV)

Visa: 4111111111111111 / 4007000000027
MC: 5424000000000015
Amex: 370000000000002
Discover: 6011000000000012

Use sandbox environment until client confirms production switch.
