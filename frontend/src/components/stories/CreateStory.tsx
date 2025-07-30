import { useState } from 'react';
import { Camera, Video, Type, X, Upload, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateStoryProps {
  open: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export const CreateStory = ({ open, onClose, onStoryCreated }: CreateStoryProps) => {
  const [storyType, setStoryType] = useState<'photo' | 'video' | 'text' | 'live'>('photo');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const createStory = async () => {
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a story",
          variant: "destructive",
        });
        return;
      }

      let imageUrl = null;
      let videoUrl = null;

      // Upload media if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts') // Reusing posts bucket for stories
          .upload(fileName, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(uploadData.path);

        if (storyType === 'photo') {
          imageUrl = publicUrl;
        } else if (storyType === 'video' || storyType === 'live') {
          videoUrl = publicUrl;
        }
      }

      // Create story
      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          content: content || null,
          image_url: imageUrl,
          video_url: videoUrl,
          is_live: storyType === 'live',
          visibility: 'public'
        });

      if (storyError) {
        throw storyError;
      }

      // If it's a live story, create a live session
      if (storyType === 'live') {
        await supabase
          .from('live_sessions')
          .insert({
            user_id: user.id,
            session_type: 'broadcasting',
            room_id: `story_${user.id}_${Date.now()}`,
            metadata: { type: 'story' }
          });
      }

      toast({
        title: "Success!",
        description: storyType === 'live' ? "Live story started!" : "Story created successfully",
      });

      onStoryCreated();
      onClose();
      
      // Reset form
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setStoryType('photo');
      setIsLive(false);
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Create Story</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Story type selection */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={storyType === 'photo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('photo')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-xs">Photo</span>
            </Button>
            <Button
              variant={storyType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('video')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Video className="w-5 h-5 mb-1" />
              <span className="text-xs">Video</span>
            </Button>
            <Button
              variant={storyType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('text')}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Type className="w-5 h-5 mb-1" />
              <span className="text-xs">Text</span>
            </Button>
            <Button
              variant={storyType === 'live' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('live')}
              className="flex flex-col items-center p-3 h-auto bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
            >
              <Radio className="w-5 h-5 mb-1" />
              <span className="text-xs">Live</span>
            </Button>
          </div>

          {/* Media upload */}
          {(storyType === 'photo' || storyType === 'video' || storyType === 'live') && !mediaPreview && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept={storyType === 'photo' ? 'image/*' : 'video/*'}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="story-upload"
              />
              <label htmlFor="story-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload {storyType === 'photo' ? 'photo' : 'video'}
                </p>
              </label>
            </div>
          )}

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative">
              {storyType === 'photo' ? (
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  controls 
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMediaPreview(null);
                  setMediaFile(null);
                }}
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Text content */}
          <Textarea
            placeholder={storyType === 'text' ? "What's on your mind?" : "Add a caption..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="glass-card border-border/50"
            rows={3}
          />

          {/* Live options */}
          {storyType === 'live' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Radio className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Going Live</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your followers will be notified when you start broadcasting
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={createStory}
              disabled={isCreating || (storyType !== 'text' && !mediaFile && !content)}
              className="flex-1 btn-gradient"
            >
              {isCreating ? 'Creating...' : 
               storyType === 'live' ? 'Go Live' : 'Share Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};