import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get keys from Supabase Environment Variables
const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY");
const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET");
const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY");
const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE") || "174379";
const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

interface STKPushRequest {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
}

// 1. Improved Access Token Function
async function getAccessToken(): Promise<string> {
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    throw new Error("Missing M-PESA API Keys in Supabase Secrets");
  }

  const auth = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
  const response = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`M-Pesa Auth Failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 2. Fixed Phone Formatting (Ensures 254...)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.substring(1);
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) cleaned = "254" + cleaned;
  return cleaned;
}

// 3. Precise Timestamp for Safaricom (YYYYMMDDHHMMSS)
function generateTimestamp(): string {
  const now = new Date();
  const t = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${t(now.getMonth() + 1)}${t(now.getDate())}${t(now.getHours())}${t(now.getMinutes())}${t(now.getSeconds())}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, amount, accountReference, transactionDesc }: STKPushRequest = await req.json();

    // Validate Input
    if (!phone || !amount) {
      return new Response(JSON.stringify({ error: "Phone and Amount are required" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const accessToken = await getAccessToken();
    const formattedPhone = formatPhoneNumber(phone);
    const timestamp = generateTimestamp();
    const password = btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);

    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: "https://example.com/callback", // Replace with your actual callback URL later
      AccountReference: accountReference?.substring(0, 12) || "LIZzoTickets",
      TransactionDesc: transactionDesc?.substring(0, 13) || "TicketPayment",
    };

    const stkResponse = await fetch(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPushPayload),
      }
    );

    const stkData = await stkResponse.json();

    return new Response(JSON.stringify(stkData), {
      status: stkResponse.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
