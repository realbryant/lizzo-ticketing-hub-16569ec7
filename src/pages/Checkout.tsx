import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, User, CreditCard, 
  CheckCircle, XCircle, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CheckoutState {
  event: {
    id: number;
    name: string;
    date: string;
    location: string;
    price: number;
    image: string;
  };
  ticketCount: number;
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const state = location.state as CheckoutState | null;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Login Required",
        description: "Please log in or create an account to purchase tickets.",
      });
      navigate("/auth", { state: { returnTo: "/checkout", checkoutState: state } });
    }
  }, [user, loading, navigate, toast, state]);

  // Pre-fill email from authenticated user
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !state) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">No event selected</h2>
            <Button onClick={() => navigate("/")}>Browse Events</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { event, ticketCount } = state;
  const totalAmount = event.price * ticketCount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // 1. Format Phone Number for Safaricom (Must be 254...)
    let formattedPhone = formData.phone.replace(/\D/g, ""); 
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    if (formattedPhone.length !== 12) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid Kenyan number (e.g., 0712345678)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // 2. Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phone: formattedPhone,
          amount: totalAmount,
          accountReference: `EVENT-${event.id}`,
          transactionDesc: `Tickets for ${event.name}`,
        },
      });

      if (error) throw error;

      // 3. Check for Successful STK Push initiation
      if (data?.ResponseCode === "0") {
        toast({
          title: "STK Push Sent!",
          description: "Enter your M-PESA PIN on your phone to complete payment.",
        });

        // Simulating waiting for payment confirmation
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // 4. Record the Order in Database
        const { error: orderError } = await supabase.from("orders").insert({
          event_id: String(event.id),
          ticket_count: ticketCount,
          total_amount: totalAmount,
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formattedPhone,
          payment_status: "completed",
          mpesa_receipt: data.CheckoutRequestID,
        });

        if (orderError) throw orderError;

        setPaymentStatus("success");
      } else {
        throw new Error(data?.CustomerMessage || "Failed to trigger M-PESA prompt.");
      }
    } catch (error: any) {
      console.error("Payment Error:", error);
      setPaymentStatus("failed");
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <img src={event.image} alt={event.name} className="w-full sm:w-48 h-48 object-cover" />
              <CardContent className="p-6 flex-1">
                <h2 className="text-2xl font-bold">{event.name}</h2>
                <p className="text-muted-foreground">{event.date} | {event.location}</p>
                <div className="flex justify-between pt-4 mt-4 border-t font-bold text-lg">
                  <span>Total ({ticketCount} Tickets)</span>
                  <span className="text-primary">KES {totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </div>
          </Card>

          {paymentStatus === "success" ? (
            <Card className="border-green-500 bg-green-500/5 text-center p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Tickets Booked!</h3>
              <p className="mb-4">Check your email for your digital tickets.</p>
              <Button onClick={() => navigate("/")}>Return Home</Button>
            </Card>
          ) : paymentStatus === "failed" ? (
            <Card className="border-destructive bg-destructive/5 text-center p-8">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Payment Failed</h3>
              <Button onClick={() => setPaymentStatus("idle")}>Try Again</Button>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="flex gap-2 items-center"><CreditCard /> Checkout</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleMpesaPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleInputChange} disabled={isProcessing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">M-PESA Phone Number</Label>
                    <Input id="phone" name="phone" placeholder="0712345678" required value={formData.phone} onChange={handleInputChange} disabled={isProcessing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} disabled={isProcessing} />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg" disabled={isProcessing}>
                    {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : `Pay KES ${totalAmount.toLocaleString()}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;