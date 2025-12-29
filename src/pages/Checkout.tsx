import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, User, CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">No event selected</h2>
            <p className="text-muted-foreground">Please select an event first</p>
            <Button variant="accent" onClick={() => navigate("/")}>
              Browse Events
            </Button>
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

    // Validate phone number (Kenya format)
    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    // Simulate STK Push and payment processing
    toast({
      title: "STK Push Sent",
      description: "Please check your phone and enter your M-PESA PIN",
    });

    // Simulate payment delay
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Simulate success (90% success rate for demo)
    const success = Math.random() > 0.1;

    if (success) {
      // Generate a mock M-PESA receipt number
      const mpesaReceipt = `SIM${Date.now().toString(36).toUpperCase()}`;
      
      // Save order to database
      const { error: orderError } = await supabase.from("orders").insert({
        event_id: String(event.id),
        ticket_count: ticketCount,
        total_amount: totalAmount,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        payment_status: "completed",
        mpesa_receipt: mpesaReceipt,
      });

      if (orderError) {
        console.error("Failed to save order:", orderError);
        setPaymentStatus("failed");
        toast({
          title: "Order Failed",
          description: "Payment was successful but we couldn't save your order. Please contact support.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke("send-ticket-confirmation", {
          body: {
            customerName: formData.fullName,
            customerEmail: formData.email,
            eventName: event.name,
            eventDate: event.date,
            eventLocation: event.location,
            ticketCount,
            totalAmount,
            mpesaReceipt,
          },
        });

        if (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the order, just log the error
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      }

      setPaymentStatus("success");
      toast({
        title: "Payment Successful!",
        description: "Your tickets have been booked. Check your email for confirmation.",
      });
    } else {
      setPaymentStatus("failed");
      toast({
        title: "Payment Failed",
        description: "The transaction was not completed. Please try again.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>

          <div className="space-y-6 animate-fade-in">
            {/* Event Summary */}
            <Card className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full sm:w-48 h-48 object-cover"
                />
                <CardContent className="p-6 flex-1">
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">{event.name}</h2>
                  <p className="text-muted-foreground mb-1">{event.date}</p>
                  <p className="text-muted-foreground mb-4">{event.location}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-muted-foreground">
                      {ticketCount} ticket{ticketCount > 1 ? "s" : ""} × KES {event.price.toLocaleString()}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      KES {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Payment Status */}
            {paymentStatus === "success" && (
              <Card className="border-green-500 bg-green-500/10">
                <CardContent className="p-6 text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                    Payment Successful!
                  </h3>
                  <p className="text-muted-foreground">
                    Your tickets for {event.name} have been booked. A confirmation email has been sent to {formData.email}.
                  </p>
                  <Button variant="accent" onClick={() => navigate("/")}>
                    Back to Main Page
                  </Button>
                </CardContent>
              </Card>
            )}

            {paymentStatus === "failed" && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-6 text-center space-y-4">
                  <XCircle className="w-16 h-16 text-destructive mx-auto" />
                  <h3 className="text-xl font-bold text-destructive">Payment Failed</h3>
                  <p className="text-muted-foreground">
                    The transaction could not be completed. Please try again.
                  </p>
                  <Button variant="accent" onClick={() => setPaymentStatus("idle")}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Checkout Form */}
            {(paymentStatus === "idle" || paymentStatus === "processing") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMpesaPayment} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="bg-secondary"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number (M-PESA)
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="0712345678"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="bg-secondary"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="bg-secondary"
                      />
                    </div>

                    {/* M-PESA Payment Button */}
                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>Pay KES {totalAmount.toLocaleString()} with M-PESA</>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      You will receive an STK push on your phone. Enter your M-PESA PIN to complete the payment.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
