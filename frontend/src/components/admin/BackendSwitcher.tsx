import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackendSelector, BackendProvider } from '@/services/backend-selector';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export const BackendSwitcher = () => {
  const [currentProvider, setCurrentProvider] = useState<BackendProvider>('supabase');
  const { toast } = useToast();

  useEffect(() => {
    setCurrentProvider(BackendSelector.getProvider());
  }, []);

  const switchBackend = (provider: BackendProvider) => {
    BackendSelector.setProvider(provider);
    setCurrentProvider(provider);
    toast({
      title: "Backend Switched",
      description: `Now using ${provider.charAt(0).toUpperCase() + provider.slice(1)} as the backend`
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Backend Provider 
          <Badge variant={currentProvider === 'firebase' ? 'default' : 'secondary'}>
            {currentProvider}
          </Badge>
        </CardTitle>
        <CardDescription>
          Switch between Firebase and Supabase backends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentProvider === 'supabase' ? 'default' : 'outline'}
            onClick={() => switchBackend('supabase')}
            className="w-full"
          >
            Supabase
          </Button>
          <Button
            variant={currentProvider === 'firebase' ? 'default' : 'outline'}
            onClick={() => switchBackend('firebase')}
            className="w-full"
          >
            Firebase
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Current:</strong> {currentProvider}</p>
          <p className="mt-2">
            {currentProvider === 'firebase' 
              ? 'Using Firebase for auth, storage, and analytics'
              : 'Using Supabase for database and auth'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};