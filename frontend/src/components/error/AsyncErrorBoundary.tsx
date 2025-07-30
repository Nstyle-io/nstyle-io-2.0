import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, RefreshCw } from 'lucide-react';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

const AsyncErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="flex items-center justify-center p-8">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Wifi className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Connection Error</CardTitle>
        <CardDescription>
          Unable to load content. Please check your connection and try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({ 
  children, 
  onRetry 
}) => {
  return (
    <ErrorBoundary
      fallback={<AsyncErrorFallback onRetry={onRetry} />}
      onError={(error, errorInfo) => {
        // Log async errors specifically
        console.error('Async Error Boundary:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};