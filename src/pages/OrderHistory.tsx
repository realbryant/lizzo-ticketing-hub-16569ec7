import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ticket, Calendar, MapPin, ArrowLeft, Receipt, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface OrderWithEvent {
  id: string;
  ticket_count: number;
  total_amount: number;
  payment_status: string;
  mpesa_receipt: string | null;
  created_at: string;
  events: {
    id: string;
    name: string;
    date: string;
    location: string;
    image_url: string | null;
  } | null;
}

const OrderHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          ticket_count,
          total_amount,
          payment_status,
          mpesa_receipt,
          created_at,
          events (
            id,
            name,
            date,
            location,
            image_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders(data as OrderWithEvent[]);
      }
      setLoading(false);
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading your orders...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Receipt className="w-8 h-8 text-primary" />
              Order History
            </h1>
            <p className="text-muted-foreground mt-2">
              View your past ticket purchases and order details
            </p>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <Ticket className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any tickets yet. Browse our events to find something exciting!
              </p>
              <Button variant="default" onClick={() => navigate("/")}>
                Browse Events
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Event Image */}
                      {order.events?.image_url && (
                        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                          <img
                            src={order.events.image_url}
                            alt={order.events.name || "Event"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Order Details */}
                      <div className="flex-1 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground">
                              {order.events?.name || "Event"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                              {order.events?.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatEventDate(order.events.date)}
                                </span>
                              )}
                              {order.events?.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {order.events.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(order.payment_status)}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Ticket className="w-4 h-4" />
                              {order.ticket_count} ticket{order.ticket_count > 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatDate(order.created_at)}
                            </span>
                            {order.mpesa_receipt && (
                              <span className="text-xs text-muted-foreground">
                                Ref: {order.mpesa_receipt}
                              </span>
                            )}
                          </div>
                          <span className="text-lg font-bold text-primary">
                            KES {order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderHistory;
