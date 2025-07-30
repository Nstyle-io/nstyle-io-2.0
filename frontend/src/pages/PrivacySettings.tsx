import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowRequestsManager } from '@/components/social/FollowRequestsManager';
import { StoriesManagement } from '@/components/social/StoriesManagement';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

const PrivacySettings = () => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <main className="pt-16 pb-20 md:pb-4">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Privacy & Security
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your privacy settings and account security
              </p>
            </div>
          </div>

          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-card mb-6">
              <TabsTrigger value="requests">Follow Requests</TabsTrigger>
              <TabsTrigger value="stories">Story Management</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-6">
              <FollowRequestsManager currentUserId={currentUserId} />
            </TabsContent>

            <TabsContent value="stories" className="space-y-6">
              <StoriesManagement currentUserId={currentUserId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PrivacySettings;