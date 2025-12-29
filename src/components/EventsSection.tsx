import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  price: number;
  image: string;
}

const events: Event[] = [
  {
    id: 1,
    name: "Summer Music Festival",
    date: "January 15, 2025",
    location: "Nairobi Arena",
    price: 2500,
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
  },
  {
    id: 2,
    name: "Jazz Night Live",
    date: "January 22, 2025",
    location: "The Hub Karen",
    price: 1500,
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
  },
  {
    id: 3,
    name: "Electronic Dance Party",
    date: "February 5, 2025",
    location: "KICC Rooftop",
    price: 3000,
    image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800",
  },
  {
    id: 4,
    name: "Afrobeats Concert",
    date: "February 14, 2025",
    location: "Carnivore Grounds",
    price: 2000,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
  },
  {
    id: 5,
    name: "Rock Legends Tour",
    date: "March 1, 2025",
    location: "Uhuru Gardens",
    price: 3500,
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
  },
];

const EventsSection = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ticketCounts, setTicketCounts] = useState<{ [key: number]: number }>(
    events.reduce((acc, event) => ({ ...acc, [event.id]: 1 }), {})
  );

  const visibleEvents = 3;
  const maxIndex = Math.max(0, events.length - visibleEvents);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const updateTicketCount = (eventId: number, delta: number) => {
    setTicketCounts((prev) => ({
      ...prev,
      [eventId]: Math.max(1, Math.min(5, prev[eventId] + delta)),
    }));
  };

  const handleCheckout = (event: Event) => {
    navigate("/checkout", {
      state: {
        event,
        ticketCount: ticketCounts[event.id],
      },
    });
  };

  return (
    <section id="events" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Upcoming Events
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover and book tickets for the most exciting events happening near you
          </p>
        </div>

        {/* Event Catalog Controls */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} - {Math.min(currentIndex + visibleEvents, events.length)} of {events.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
          {events.slice(currentIndex, currentIndex + visibleEvents).map((event, index) => (
            <Card
              key={event.id}
              className="group overflow-hidden bg-card border-border hover:shadow-glow transition-all duration-500 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                    KES {event.price.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                  {event.name}
                </h3>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Ticket Selector */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-sm font-medium text-card-foreground">Tickets:</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateTicketCount(event.id, -1)}
                      disabled={ticketCounts[event.id] <= 1}
                      className="h-8 w-8 rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg text-foreground">
                      {ticketCounts[event.id]}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateTicketCount(event.id, 1)}
                      disabled={ticketCounts[event.id] >= 5}
                      className="h-8 w-8 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* OK Button */}
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => handleCheckout(event)}
                >
                  Get Tickets
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile: Show all events stacked */}
        <div className="md:hidden mt-8 space-y-4">
          {events.map((event) => (
            <Card
              key={`mobile-${event.id}`}
              className="overflow-hidden bg-card border-border"
            >
              <div className="flex gap-4 p-4">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-card-foreground">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                  <p className="text-sm font-semibold text-primary">
                    KES {event.price.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateTicketCount(event.id, -1)}
                    disabled={ticketCounts[event.id] <= 1}
                    className="h-8 w-8"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-6 text-center font-bold">{ticketCounts[event.id]}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateTicketCount(event.id, 1)}
                    disabled={ticketCounts[event.id] >= 5}
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="accent" size="sm" onClick={() => handleCheckout(event)}>
                  Get Tickets
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
