import { useState, useEffect } from 'react';
import { Image, Video, Type, Hash, MapPin, X, Upload, Camera, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLocation, useNavigate } from 'react-router-dom';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const popularTags = [
  'nailart', 'gelnails', 'manicure', 'nailsoftheday', 'chromenails',
  'holographicnails', 'nailinspo', 'summernails', 'naildesign', 'acrylicnails'
];

const CreatePost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [postType, setPostType] = useState<'photo' | 'video' | 'text'>('photo');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [locationName, setLocationName] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [allowSaves, setAllowSaves] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Handle media from camera capture
  useEffect(() => {
    if (location.state?.mediaFile) {
      const { mediaFile, mediaType, mediaUrl } = location.state;
      setUploadedFiles([mediaFile]);
      setPostType(mediaType);
      setMediaPreview(mediaUrl);
    }
  }, [location.state]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(fileArray);
      
      // Create preview for the first file
      if (fileArray.length > 0) {
        const file = fileArray[0];
        const url = URL.createObjectURL(file);
        setMediaPreview(url);
      }
    }
  };

  const openCamera = () => {
    navigate('/camera');
  };

  const handlePublish = async (isDraft = false) => {
    setIsPublishing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a post",
          variant: "destructive",
        });
        return;
      }

      let imageUrl = null;
      let videoUrl = null;

      // Upload media if present
      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Error",
            description: "Failed to upload media. Please try again.",
            variant: "destructive",
          });
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(uploadData.path);

        if (postType === 'photo') {
          imageUrl = publicUrl;
        } else if (postType === 'video') {
          videoUrl = publicUrl;
        }
      }

      // Create post in database
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption,
          image_url: imageUrl,
          video_url: videoUrl,
          visibility: isDraft ? 'private' : 'public'
        })
        .select()
        .single();

      // Also add to user gallery if it's a photo and not a draft
      if (imageUrl && !isDraft) {
        await supabase
          .from('user_gallery')
          .insert({
            user_id: user.id,
            image_url: imageUrl,
            caption: caption || null,
            order_index: Date.now()
          });
      }

      if (postError) {
        console.error('Post creation error:', postError);
        toast({
          title: "Error",
          description: "Failed to create post. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: isDraft ? "Your draft has been saved" : "Your post has been published",
      });

      navigate('/');
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const addCustomTag = (tagInput: HTMLInputElement) => {
    const tag = tagInput.value.trim().replace('#', '');
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      tagInput.value = '';
    }
  };

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-lg">
        <div className="glass-card rounded-xl sm:rounded-2xl overflow-hidden min-h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="text-sm"
            >
              Cancel
            </Button>
            <h1 className="font-semibold text-base sm:text-lg">New Post</h1>
            <div className="flex gap-1 sm:gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handlePublish(true)}
                disabled={isPublishing || caption.trim().length === 0}
                className="hidden sm:inline-flex text-xs sm:text-sm"
              >
                Draft
              </Button>
              <Button 
                onClick={() => handlePublish(false)}
                disabled={
                  isPublishing ||
                  caption.trim().length === 0 ||
                  (postType !== 'text' && uploadedFiles.length === 0)
                }
                size="sm"
                className="btn-gradient text-xs sm:text-sm px-3 sm:px-4"
              >
                {isPublishing ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Media Upload */}
            {!mediaPreview && (postType === 'photo' || postType === 'video') && (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept={postType === 'photo' ? 'image/*' : 'video/*'}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    {postType === 'photo' ? (
                      <Image className="w-8 h-8 text-primary" />
                    ) : (
                      <Video className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Add Photos/Videos</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag photos and videos here
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer w-full" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Select from device
                        </span>
                      </Button>
                    </label>
                    
                    <Button 
                      onClick={openCamera}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative">
                {postType === 'photo' ? (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMediaPreview(null);
                    setUploadedFiles([]);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 rounded-full w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Post Type Toggle */}
            <div className="flex justify-center">
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={postType === 'photo' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPostType('photo')}
                  className="flex items-center space-x-1"
                >
                  <Image className="w-4 h-4" />
                  <span>Photo</span>
                </Button>
                <Button
                  variant={postType === 'video' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPostType('video')}
                  className="flex items-center space-x-1"
                >
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </Button>
                <Button
                  variant={postType === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPostType('text')}
                  className="flex items-center space-x-1"
                >
                  <Type className="w-4 h-4" />
                  <span>Text</span>
                </Button>
              </div>
            </div>

            {/* Caption */}
            <div>
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="glass-card border-white/10 min-h-[100px] resize-none"
                maxLength={2200}
              />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {caption.length}/2200
              </div>
            </div>

            {/* Quick Tags */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {popularTags.slice(0, 6).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105 text-xs"
                    onClick={() => handleTagToggle(tag)}
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <Input
                placeholder="Add hashtags..."
                className="glass-card border-white/10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomTag(e.target as HTMLInputElement);
                  }
                }}
              />
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                    <button
                      onClick={() => handleTagToggle(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Add location"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="pl-10 glass-card border-white/10"
              />
            </div>

            {/* Settings */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hide like and view counts</span>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Turn off commenting</span>
                <Switch
                  checked={!allowComments}
                  onCheckedChange={(checked) => setAllowComments(!checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default CreatePost;