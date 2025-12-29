import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const state = location.state;

  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "" });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { state: { returnTo: "/checkout", checkoutState: state } });
    }
    if (user?.email) setFormData(prev => ({ ...prev, email: user.email }));
  }, [user, loading, navigate, state]);

  if (loading || !state) return <div className="p-20 text-center">Loading...</div>;

  const { event, ticketCount } = state;
  const totalAmount = event.price * ticketCount;

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          eventName: event.name,
          amount: event.price,
          quantity: ticketCount,
          customerEmail: formData.email,
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
        <Card>
          <CardHeader><CardTitle><CreditCard className="inline mr-2"/> Secure Checkout</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-secondary rounded-lg">
              <h3 className="font-bold">{event.name}</h3>
              <p className="text-sm">{ticketCount} x KES {event.price}</p>
              <p className="text-lg font-bold mt-2">Total: KES {totalAmount}</p>
            </div>
            <form onSubmit={handleStripePayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={formData.email} disabled className="bg-muted" />
              </div>
              <Button type="submit" className="w-full h-12" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin mr-2"/> : `Pay KES ${totalAmount} with Card`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;