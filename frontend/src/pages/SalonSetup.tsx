import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Scissors, MapPin, Clock, Globe, Instagram, Facebook } from 'lucide-react';

const SalonSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salon_name: '',
    business_email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    description: '',
    website_url: '',
    instagram_handle: '',
    facebook_url: '',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true },
    }
  });

  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('salon_profiles')
        .insert([
          {
            owner_id: user.id,
            ...formData
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your salon profile has been created successfully."
      });

      navigate('/salon-dashboard');
    } catch (error: any) {
      console.error('Error creating salon profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create salon profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Set Up Your Salon</h1>
            <p className="text-muted-foreground">
              Create your salon profile to start managing bookings and growing your business
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about your salon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salon_name">Salon Name *</Label>
                    <Input
                      id="salon_name"
                      value={formData.salon_name}
                      onChange={(e) => handleInputChange('salon_name', e.target.value)}
                      placeholder="Enter your salon name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => handleInputChange('business_email', e.target.value)}
                      placeholder="salon@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your salon, specialties, and what makes you unique"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </CardTitle>
                <CardDescription>Where is your salon located?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Los Angeles"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="90210"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Business Hours
                </CardTitle>
                <CardDescription>Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {days.map((day) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24">
                        <Label className="capitalize">{day}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={!formData.business_hours[day as keyof typeof formData.business_hours].closed}
                          onCheckedChange={(checked) => 
                            handleHoursChange(day, 'closed', !checked)
                          }
                        />
                        <span className="text-sm">Open</span>
                      </div>
                      {!formData.business_hours[day as keyof typeof formData.business_hours].closed && (
                        <>
                          <Input
                            type="time"
                            value={formData.business_hours[day as keyof typeof formData.business_hours].open}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={formData.business_hours[day as keyof typeof formData.business_hours].close}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Online Presence
                </CardTitle>
                <CardDescription>Connect your social media and website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website_url" className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Website URL
                  </Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://yoursalon.com"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram_handle" className="flex items-center">
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram Handle
                  </Label>
                  <Input
                    id="instagram_handle"
                    value={formData.instagram_handle}
                    onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                    placeholder="@yoursalon"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook_url" className="flex items-center">
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook Page
                  </Label>
                  <Input
                    id="facebook_url"
                    value={formData.facebook_url}
                    onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/yoursalon"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button 
                type="submit" 
                className="btn-gradient w-full md:w-auto px-8 py-3"
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : 'Create Salon Profile'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalonSetup;