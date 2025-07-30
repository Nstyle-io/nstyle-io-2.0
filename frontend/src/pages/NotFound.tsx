import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/discover" className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Explore Content
            </Link>
          </Button>
          
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;