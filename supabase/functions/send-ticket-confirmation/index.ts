import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketConfirmationRequest {
  customerName: string;
  customerEmail: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketCount: number;
  totalAmount: number;
  mpesaReceipt: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send ticket confirmation email");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerName,
      customerEmail,
      eventName,
      eventDate,
      eventLocation,
      ticketCount,
      totalAmount,
      mpesaReceipt,
    }: TicketConfirmationRequest = await req.json();

    console.log(`Sending confirmation email to ${customerEmail} for event: ${eventName}`);

    const emailResponse = await resend.emails.send({
      from: "Tickets <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `🎟️ Your Tickets for ${eventName} - Confirmed!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Booking Confirmed!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your tickets are ready</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
                Hi <strong>${customerName}</strong>,
              </p>
              <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Thank you for your purchase! Your payment has been confirmed and your tickets are now booked.
              </p>
              
              <!-- Event Details Card -->
              <div style="background-color: #f8f5ff; border-radius: 10px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #7c3aed;">
                <h2 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 20px;">${eventName}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">📅 Date</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 500;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">📍 Location</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 500;">${eventLocation}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">🎫 Tickets</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 500;">${ticketCount} ticket${ticketCount > 1 ? 's' : ''}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Payment Details -->
              <div style="background-color: #f0fdf4; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">💳 Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #666; font-size: 14px;">Amount Paid</td>
                    <td style="padding: 6px 0; color: #166534; font-size: 16px; text-align: right; font-weight: 700;">KES ${totalAmount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #666; font-size: 14px;">M-PESA Receipt</td>
                    <td style="padding: 6px 0; color: #333; font-size: 14px; text-align: right; font-weight: 500;">${mpesaReceipt}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                Please save this email as your ticket confirmation. You may be asked to show this at the venue entrance.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                Questions? Contact us at support@example.com
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 Event Tickets. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ticket-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
