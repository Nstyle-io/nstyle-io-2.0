import { useState, useEffect, useCallback } from 'react';
import { X, Heart, MessageCircle, Send, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  user_id: string;
  image_url?: string;
  video_url?: string;
  content?: string;
  is_live: boolean;
  live_viewers: number;
  created_at: string;
  expires_at: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewer = ({ stories, initialIndex, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [viewers, setViewers] = useState(0);
  const { toast } = useToast();

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;

    // Record story view
    recordStoryView();

    // Set up progress timer
    const _duration = currentStory.is_live ? 0 : 5000; // 5 seconds for regular stories, no auto-advance for live
    if (!currentStory.is_live) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 2; // 2% every 100ms = 5 seconds total
        });
      }, 100);

      return () => clearInterval(interval);
    }

    // Set up live viewer updates
    if (currentStory.is_live) {
      const channel = supabase.channel(`story_${currentStory.id}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setViewers(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              watching: true
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentIndex, currentStory, recordStoryView, nextStory]);

  const recordStoryView = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('story_views')
        .insert({
          story_id: currentStory.id,
          viewer_id: user.id
        });
    } catch {
      // Ignore duplicate view errors
    }
  }, [currentStory]);

  const nextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentStory.is_live) return;

    try {
      // In a real app, you'd send this to a live chat system
      toast({
        title: "Message sent!",
        description: "Your message was sent to the live stream",
      });
      setMessage('');
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8 border-2 border-white">
            <AvatarImage src={currentStory.profiles.avatar_url} />
            <AvatarFallback className="text-xs">
              {currentStory.profiles.display_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold text-sm">{currentStory.profiles.display_name}</p>
            <div className="flex items-center space-x-2 text-xs opacity-80">
              <span>{new Date(currentStory.created_at).toLocaleTimeString()}</span>
              {currentStory.is_live && (
                <>
                  <span className="px-2 py-1 bg-red-500 rounded text-white font-bold">LIVE</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{viewers}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <MoreVertical className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Navigation areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-0 w-1/3 h-full z-10"
          disabled={currentIndex === 0}
        />
        <button
          onClick={nextStory}
          className="absolute right-0 top-0 w-1/3 h-full z-10"
          disabled={currentIndex === stories.length - 1}
        />

        {/* Media content */}
        {currentStory.image_url && (
          <img 
            src={currentStory.image_url} 
            alt="Story content"
            className="w-full h-full object-cover"
          />
        )}
        
        {currentStory.video_url && (
          <video 
            src={currentStory.video_url}
            className="w-full h-full object-cover"
            autoPlay
            muted={!currentStory.is_live}
            controls={currentStory.is_live}
          />
        )}

        {currentStory.content && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <p className="text-white text-xl text-center font-medium">
              {currentStory.content}
            </p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        {currentStory.is_live ? (
          <div className="flex items-center space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-black/50 border-white/20 text-white placeholder:text-white/60"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              onClick={sendMessage}
              size="sm" 
              className="bg-white text-black hover:bg-white/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};