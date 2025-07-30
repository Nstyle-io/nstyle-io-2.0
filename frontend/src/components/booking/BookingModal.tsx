import { useState } from 'react';
import { Calendar, Clock, Star, MapPin, Phone, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description: string;
}

interface Salon {
  id: string;
  name: string;
  rating: number;
  location: string;
  phone: string;
  image: string;
  services: Service[];
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: Salon;
}

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const BookingModal = ({ isOpen, onClose, salon }: BookingModalProps) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState(1);

  const handleBooking = () => {
    // Simulate booking process
    setStep(4);
    setTimeout(() => {
      onClose();
      setStep(1);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
    }, 2000);
  };

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/20 max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Book Appointment</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {step < 4 && (
          <div className="space-y-4">
            {/* Salon Info */}
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <img
                  src={salon.image}
                  alt={salon.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{salon.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{salon.rating}</span>
                    </div>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{salon.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNum
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>

            <Tabs value={step.toString()} className="space-y-4">
              {/* Step 1: Service Selection */}
              <TabsContent value="1" className="space-y-3">
                <h3 className="font-semibold">Select Service</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {salon.services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setStep(2);
                      }}
                      className={`glass-card p-3 rounded-lg cursor-pointer transition-all hover:border-primary/30 ${
                        selectedService?.id === service.id ? 'border-primary/50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {service.duration}
                            </Badge>
                          </div>
                        </div>
                        <span className="font-semibold text-primary">{service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Step 2: Date Selection */}
              <TabsContent value="2" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Select Date</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {dates.map((date) => {
                    const dateStr = date.toDateString();
                    const isToday = date.toDateString() === today.toDateString();
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setStep(3);
                        }}
                        className={`glass-card p-3 rounded-lg text-center transition-all hover:border-primary/30 ${
                          selectedDate === dateStr ? 'border-primary/50 bg-primary/10' : ''
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {isToday ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Step 3: Time Selection */}
              <TabsContent value="3" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Select Time</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                    Back
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`glass-card p-2 rounded-lg text-center text-sm transition-all hover:border-primary/30 ${
                        selectedTime === time ? 'border-primary/50 bg-primary/10' : ''
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                
                {selectedTime && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="glass-card p-3 rounded-lg">
                      <h4 className="font-semibold mb-2">Booking Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span>{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{new Date(selectedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{selectedTime}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-primary">
                          <span>Total:</span>
                          <span>{selectedService?.price}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleBooking} className="w-full btn-gradient">
                      Confirm Booking
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your appointment has been successfully booked. You'll receive a confirmation email shortly.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;