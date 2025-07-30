import { useState } from 'react';
import { BarChart3, Users, Calendar, DollarSign, TrendingUp, Star, MapPin, Clock, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const Business = () => {
  const [timeRange, setTimeRange] = useState('month');

  const stats = {
    totalClients: 156,
    totalRevenue: 12850,
    avgRating: 4.8,
    totalBookings: 89,
    monthlyGrowth: 15.3,
    popularService: 'Gel Extensions',
  };

  const recentBookings = [
    {
      id: '1',
      client: 'Sarah M.',
      service: 'Gel Extensions',
      time: '2:00 PM',
      date: 'Today',
      price: '$85',
      status: 'confirmed',
    },
    {
      id: '2',
      client: 'Emma L.',
      service: 'Chrome Nails',
      time: '4:30 PM',
      date: 'Today',
      price: '$95',
      status: 'pending',
    },
    {
      id: '3',
      client: 'Jessica R.',
      service: 'Nail Art',
      time: '10:00 AM',
      date: 'Tomorrow',
      price: '$70',
      status: 'confirmed',
    },
  ];

  const topPosts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
      likes: 2847,
      views: 15600,
      engagement: 18.2,
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d99?w=400',
      likes: 1923,
      views: 12300,
      engagement: 15.6,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Business Dashboard</h1>
              <p className="text-muted-foreground">Glamour Nails Studio</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                View Public Profile
              </Button>
              <Button size="sm" className="btn-gradient">
                Boost Post
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex space-x-2 mb-6">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize"
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="glass-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{stats.monthlyGrowth}%
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  This month
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgRating}</div>
                <div className="flex items-center text-sm text-yellow-500">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  342 reviews
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  This month
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Recent Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 glass-card rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm">{booking.client}</span>
                          <Badge
                            variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{booking.service}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{booking.time}</span>
                          <span>•</span>
                          <span>{booking.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{booking.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Bookings
                </Button>
              </CardContent>
            </Card>

            {/* Top Performing Posts */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Top Posts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPosts.map((post) => (
                    <div key={post.id} className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                      <img
                        src={post.image}
                        alt="Post"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{post.likes.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center">
                              <Heart className="w-3 h-3 mr-1" />
                              Likes
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{post.views.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center">
                              <Eye className="w-3 h-3 mr-1" />
                              Views
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-500">{post.engagement}%</div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Rate
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Create New Post
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="glass-card border-white/10 mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="btn-gradient h-auto p-4 flex-col space-y-2">
                  <Calendar className="w-6 h-6" />
                  <span>Manage Bookings</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <DollarSign className="w-6 h-6" />
                  <span>View Revenue</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Star className="w-6 h-6" />
                  <span>Customer Reviews</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Business;