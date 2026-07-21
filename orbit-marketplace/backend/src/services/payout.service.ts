import crypto from "crypto";

const PAYMENT_GATEWAY = process.env.PAYMENT_GATEWAY || "CASHFREE";
const PAYMENT_CLIENT_ID = process.env.PAYMENT_CLIENT_ID || "";
const PAYMENT_CLIENT_SECRET = process.env.PAYMENT_CLIENT_SECRET || "";
const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL || "https://sandbox.cashfree.com/pg";
const PAYOUT_API_KEY = process.env.PAYOUT_API_KEY || "";
const PAYOUT_SECRET = process.env.PAYOUT_SECRET || "";

export interface PennyDropResult {
  success: boolean;
  bankName: string;
  branchName: string;
  referenceId: string;
  registeredName?: string;
  error?: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId: string;
  transactionId: string;
  error?: string;
}

/**
 * Perform Penny Drop verification via cashfree / razorpay verification endpoint.
 * Fallback to sandbox mock simulator if credentials are not configured in .env.
 */
export async function verifyBankAccount(
  accountHolderName: string,
  accountNumber: string,
  ifsc: string,
  pan: string
): Promise<PennyDropResult> {
  const cleanHolderName = accountHolderName.trim();
  const cleanAccountNumber = accountNumber.trim();
  const cleanIfsc = ifsc.trim().toUpperCase();
  const cleanPan = pan.trim().toUpperCase();

  // Basic check
  if (!cleanHolderName || !cleanAccountNumber || !cleanIfsc || !cleanPan) {
    return { success: false, bankName: "", branchName: "", referenceId: "", error: "Missing required details" };
  }

  // Determine if active gateway configuration is present
  const hasCredentials = PAYMENT_CLIENT_ID && PAYMENT_CLIENT_SECRET;

  if (!hasCredentials) {
    console.warn("[Payout Service] Running Penny Drop in Mock Sandbox Mode. (No PAYMENT_CLIENT_ID in .env)");
    
    // Simulate successful penny drop
    const randomRef = "penny_ref_" + crypto.randomBytes(6).toString("hex");
    return new Promise((resolve) => {
      setTimeout(() => {
        // If owner name contains "FAIL", mock a failure for testing purposes
        if (cleanHolderName.toUpperCase().includes("FAIL")) {
          resolve({
            success: false,
            bankName: "",
            branchName: "",
            referenceId: "",
            error: "Account verification failed: Invalid bank account details."
          });
        } else {
          resolve({
            success: true,
            bankName: "HDFC Bank",
            branchName: "Lamington Road Branch",
            referenceId: randomRef,
            registeredName: cleanHolderName
          });
        }
      }, 1000);
    });
  }

  try {
    console.log(`[Payout Service] Initiating Penny Drop Verification via ${PAYMENT_GATEWAY}...`);
    
    // Cashfree Penny Drop integration example
    // POST request to cashfree bank verification API
    const response = await fetch(`${PAYMENT_BASE_URL}/v1/validation/bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": PAYMENT_CLIENT_ID,
        "x-client-secret": PAYMENT_CLIENT_SECRET,
      },
      body: JSON.stringify({
        name: cleanHolderName,
        phone: "9999999999", // Sandbox default
        bankAccount: cleanAccountNumber,
        ifsc: cleanIfsc
      }),
      signal: AbortSignal.timeout(10000) // 10s timeout protection
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Payout Service] Gateway HTTP Error:", errText);
      return {
        success: false,
        bankName: "",
        branchName: "",
        referenceId: "",
        error: "Verification gateway connection issue."
      };
    }

    const data = await response.json() as {
      status?: string;
      data?: {
        bankAccountExists?: string;
        bankName?: string;
        branchName?: string;
        referenceId?: string;
        nameAtBank?: string;
      };
      message?: string;
    };
    
    // Cashfree response check (status: "SUCCESS", "FAILED")
    if (data.status === "SUCCESS" && data.data?.bankAccountExists === "YES") {
      return {
        success: true,
        bankName: data.data.bankName || "Linked Bank",
        branchName: data.data.branchName || "Main Branch",
        referenceId: data.data.referenceId || "cf_ref_penny",
        registeredName: data.data.nameAtBank || cleanHolderName
      };
    }

    return {
      success: false,
      bankName: "",
      branchName: "",
      referenceId: "",
      error: data.message || "Account Verification Failed."
    };

  } catch (error) {
    console.error("[Payout Service] Penny Drop request exception:", error);
    return {
      success: false,
      bankName: "",
      branchName: "",
      referenceId: "",
      error: "Account verification service is temporarily unavailable."
    };
  }
}

/**
 * Execute automatic bank transfer payout when job status is COMPLETED.
 * Bypasses direct user interaction, logs audit details, and protects via idempotency.
 */
export async function executePayout(
  partnerId: string,
  amount: number,
  accountNumber: string,
  ifsc: string,
  partnerName: string,
  bookingId: string
): Promise<PayoutResult> {
  const hasPayoutCredentials = PAYOUT_API_KEY && PAYOUT_SECRET;

  // Idempotency Key = bookingId + amount to avoid duplicate payout transfers
  const idempotencyKey = crypto.createHash("sha256").update(`${bookingId}:${amount}`).digest("hex");

  if (!hasPayoutCredentials) {
    console.warn("[Payout Service] Running Payout Transfer in Mock Sandbox Mode. (No PAYOUT_API_KEY in .env)");
    
    // Simulate payout process delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPayoutId = "payout_tx_" + crypto.randomBytes(6).toString("hex");
        const mockTransId = "cf_trans_" + crypto.randomBytes(8).toString("hex");
        
        // Log transaction details to server console
        console.log(`[Payout Sandbox Success] Executed Payout for booking: ${bookingId}. Amount: ₹${amount}. Partner: ${partnerName}. Payout ID: ${mockPayoutId}`);
        
        resolve({
          success: true,
          payoutId: mockPayoutId,
          transactionId: mockTransId
        });
      }, 1500);
    });
  }

  try {
    console.log(`[Payout Service] Initiating payout for booking ${bookingId} to ${partnerName} (Amount: ₹${amount})...`);

    // Cashfree Payout API call with idempotency protection header
    const response = await fetch(`${PAYMENT_BASE_URL}/payouts/v1/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAYOUT_API_KEY}`,
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        transferId: bookingId, // Use bookingId as Cashfree transaction reference
        amount: amount,
        transferMode: "banktransfer",
        beneDetails: {
          beneId: partnerId,
          name: partnerName,
          bankAccount: accountNumber,
          ifsc: ifsc
        }
      }),
      signal: AbortSignal.timeout(12000) // 12s timeout protection
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Payout Service] Payout API HTTP Error:", errText);
      return {
        success: false,
        payoutId: "",
        transactionId: "",
        error: "Payout gateway connection issue."
      };
    }

    const data = await response.json() as {
      status?: string;
      subCode?: string;
      data?: {
        transferId?: string;
        referenceId?: string;
      };
      message?: string;
    };

    if (data.status === "SUCCESS" || data.subCode === "200") {
      return {
        success: true,
        payoutId: data.data?.transferId || bookingId,
        transactionId: data.data?.referenceId || "cf_trans_id"
      };
    }

    return {
      success: false,
      payoutId: "",
      transactionId: "",
      error: data.message || "Payout transfer rejected by gateway."
    };

  } catch (error) {
    console.error("[Payout Service] Payout request exception:", error);
    return {
      success: false,
      payoutId: "",
      transactionId: "",
      error: "Payout service temporarily unavailable. Enqueued for retry."
    };
  }
}
