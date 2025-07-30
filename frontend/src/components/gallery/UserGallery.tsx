import { useState, useEffect } from 'react';
import { Plus, X, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string;
  order_index: number;
  created_at: string;
}

interface UserGalleryProps {
  userId?: string;
  isOwner?: boolean;
  className?: string;
}

const UserGallery = ({ userId, isOwner = false, className = "" }: UserGalleryProps) => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchGalleryItems();
    
    // Set up real-time subscription for gallery updates
    const channel = supabase
      .channel('gallery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_gallery',
          filter: `user_id=eq.${userId || 'current_user'}`
        },
        () => {
          fetchGalleryItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchGalleryItems = async () => {
    setLoading(true);
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!targetUserId) return;

    const { data, error } = await supabase
      .from('user_gallery')
      .select('*')
      .eq('user_id', targetUserId)
      .order('order_index', { ascending: true });

    if (data && !error) {
      setGalleryItems(data);
    }
    setLoading(false);
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, selectedFile);

    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: uploadError.message
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('user_gallery')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        caption,
        order_index: galleryItems.length
      });

    if (dbError) {
      toast({
        variant: "destructive",
        title: "Database error",
        description: dbError.message
      });
    } else {
      toast({
        title: "Image uploaded",
        description: "Your image has been added to your gallery"
      });
      fetchGalleryItems();
      setUploadModalOpen(false);
      setSelectedFile(null);
      setCaption('');
    }
    setUploading(false);
  };

  const deleteImage = async (id: string, imageUrl: string) => {
    const { error } = await supabase
      .from('user_gallery')
      .delete()
      .eq('id', id);

    if (!error) {
      // Also delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('gallery')
          .remove([`${(await supabase.auth.getUser()).data.user?.id}/${fileName}`]);
      }
      fetchGalleryItems();
      toast({
        title: "Image deleted",
        description: "The image has been removed from your gallery"
      });
    }
  };

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold">Gallery</h3>
        {isOwner && (
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Photo</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel">
              <DialogHeader>
                <DialogTitle>Add to Gallery</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  {selectedFile ? (
                    <div className="space-y-4">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Choose an image to upload
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setSelectedFile(file);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <Textarea
                  placeholder="Add a caption (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                
                <Button 
                  onClick={uploadImage} 
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : 'Add to Gallery'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <Camera className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">{isOwner ? 'Add your first photo to get started' : 'No photos yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {galleryItems.map((item) => (
            <div key={item.id} className="relative group aspect-square">
              <img
                src={item.image_url}
                alt={item.caption || 'Gallery image'}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
              />
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 sm:w-8 sm:h-8 p-0"
                  onClick={() => deleteImage(item.id, item.image_url)}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-1 sm:p-2 rounded-b-lg">
                  <p className="text-xs sm:text-sm truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserGallery;