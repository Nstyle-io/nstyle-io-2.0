import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Star, 
  Plus,
  Settings,
  BarChart3,
  Filter,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
interface SalonProfile {
  id: string;
  salon_name: string;
  owner_id: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  google_maps_place_id?: string;
  latitude?: number;
  longitude?: number;
  average_rating?: number;
  total_reviews?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Appointment {
  id: string;
  salon_id: string;
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  service_id: string;
  staff_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_price_cents: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  services?: {
    name: string;
    price_cents: number;
  };
}

interface Service {
  id: string;
  salon_id: string;
  name: string;
  description?: string;
  category: string;
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: string;
  salon_id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  specialties?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SalonDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salonProfile, setSalonProfile] = useState<SalonProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [analytics, setAnalytics] = useState({
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyAppointments: 0,
    averageRating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/login');
        return;
      }

      await loadSalonData(user.id);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalonData = async (userId: string) => {
    // Load salon profile
    const { data: salon, error: salonError } = await supabase
      .from('salon_profiles')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (salonError && salonError.code !== 'PGRST116') {
      console.error('Error loading salon:', salonError);
      return;
    }

    if (!salon) {
      // No salon profile exists, redirect to setup
      navigate('/salon-setup');
      return;
    }

    setSalonProfile(salon);

    // Load appointments
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        services(name, price_cents)
      `)
      .eq('salon_id', salon.id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (!appointmentsError) {
      setAppointments(appointmentsData || []);
    }

    // Load services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: false });

    if (!servicesError) {
      setServices(servicesData || []);
    }

    // Load staff
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: false });

    if (!staffError) {
      setStaff(staffData || []);
    }

    // Calculate analytics
    calculateAnalytics(appointmentsData || []);
  };

  const calculateAnalytics = (appointmentsData: Appointment[]) => {
    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayAppointments = appointmentsData.filter(apt => 
      new Date(apt.appointment_date).toDateString() === today.toDateString()
    );

    const weeklyAppointments = appointmentsData.filter(apt => 
      new Date(apt.appointment_date) >= weekStart
    );

    const monthlyAppointments = appointmentsData.filter(apt => 
      new Date(apt.appointment_date) >= monthStart
    );

    // Calculate analytics from appointment data

    setAnalytics({
      todayRevenue: todayAppointments.reduce((sum, apt) => sum + (apt.total_price_cents || 0), 0) / 100,
      weeklyRevenue: weeklyAppointments.reduce((sum, apt) => sum + (apt.total_price_cents || 0), 0) / 100,
      monthlyRevenue: monthlyAppointments.reduce((sum, apt) => sum + (apt.total_price_cents || 0), 0) / 100,
      todayAppointments: todayAppointments.length,
      weeklyAppointments: weeklyAppointments.length,
      monthlyAppointments: monthlyAppointments.length,
      averageRating: 4.8, // This would come from reviews
      totalReviews: 156 // This would come from reviews
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-purple-500/20 text-purple-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'no_show': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="glass-panel border-b border-white/10 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Salon Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {salonProfile?.salon_name}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/salon-settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button className="btn-gradient" onClick={() => navigate('/create-appointment')}>
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.todayAppointments} appointments today
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.weeklyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.weeklyAppointments} appointments this week
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.monthlyAppointments} appointments this month
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                Based on {analytics.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>Manage your salon appointments</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.slice(0, 10).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 glass-card rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {appointment.client_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{appointment.client_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.services?.name} • {formatTime(appointment.start_time)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <span className="font-semibold">
                          ${((appointment.total_price_cents || 0) / 100).toFixed(2)}
                        </span>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>Manage your salon services and pricing</CardDescription>
                  </div>
                  <Button className="btn-gradient" onClick={() => navigate('/add-service')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="glass-card rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        </div>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold">
                            ${(service.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {service.duration_minutes} min
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Management</CardTitle>
                    <CardDescription>Manage your salon team</CardDescription>
                  </div>
                  <Button className="btn-gradient" onClick={() => navigate('/add-staff')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 glass-card rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          {member.email && (
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Revenue chart coming soon
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Appointment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Appointment chart coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Social Media Integration</CardTitle>
                  <CardDescription>Connect your social accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Connect Instagram
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Connect Facebook
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Connect TikTok
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Promotions & Offers</CardTitle>
                  <CardDescription>Create special offers for clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="btn-gradient w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Offer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalonDashboard;