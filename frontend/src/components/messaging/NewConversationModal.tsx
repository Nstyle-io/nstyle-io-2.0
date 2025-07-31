import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserResult {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  user_type: string;
  location?: string;
}

interface SalonResult {
  id: string;
  salon_name: string;
  address?: string;
  city?: string;
  state?: string;
  is_verified: boolean;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  currentUserId: string;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(UserResult | SalonResult)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length > 1) {
      const delaySearch = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, performSearch]);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const results: (UserResult | SalonResult)[] = [];

      // Search users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio, user_type, location')
        .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq('user_id', currentUserId)
        .limit(10);

      if (usersError) {
        console.error('Error searching users:', usersError);
      } else if (users) {
        results.push(...users);
      }

      // Search salons
      const { data: salons, error: salonsError } = await supabase
        .from('salon_profiles')
        .select('id, salon_name, address, city, state, is_verified')
        .or(`salon_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .eq('is_verified', true)
        .limit(5);

      if (salonsError) {
        console.error('Error searching salons:', salonsError);
      } else if (salons) {
        results.push(...salons);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users and salons",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentUserId, toast]);

  const handleSelectUser = (result: UserResult | SalonResult) => {
    if ('user_id' in result) {
      onSelectUser(result.user_id);
    } else {
      // For salons, we might need to find the salon owner's user_id
      // For now, we'll show a message
      toast({
        title: "Salon messaging",
        description: "Direct messaging with salons will be available soon!",
      });
    }
    onClose();
  };

  const isUser = (result: UserResult | SalonResult): result is UserResult => {
    return 'user_id' in result;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users or salons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  key={isUser(result) ? result.user_id : result.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectUser(result)}
                >
                  {isUser(result) ? (
                    <>
                      <Avatar>
                        <AvatarImage src={result.avatar_url} />
                        <AvatarFallback>
                          {result.display_name?.charAt(0) || result.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">
                            {result.display_name || result.username}
                          </h4>
                          {result.user_type === 'business' && (
                            <Badge variant="secondary" className="text-xs">
                              Business
                            </Badge>
                          )}
                        </div>
                        {result.username && (
                          <p className="text-sm text-muted-foreground">@{result.username}</p>
                        )}
                        {result.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {result.bio}
                          </p>
                        )}
                      </div>
                      <User className="w-4 h-4 text-muted-foreground" />
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{result.salon_name}</h4>
                          {result.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        {result.city && result.state && (
                          <p className="text-sm text-muted-foreground">
                            {result.city}, {result.state}
                          </p>
                        )}
                      </div>
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </div>
              ))
            ) : searchQuery.length > 1 ? (
              <div className="text-center py-4 text-muted-foreground">
                No users or salons found
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Start typing to search for users or salons
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};