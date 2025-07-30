import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CameraCapture } from './CameraCapture';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate: (url: string) => void;
  userId: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  userId
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete existing avatar if it exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath && oldPath !== 'avatar.jpg') {
          await supabase.storage.from('avatars').remove([`${userId}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast({
        title: "Profile picture updated!",
        description: "Your new profile picture has been saved.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }
      uploadFile(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    uploadFile(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="w-20 h-20">
            <AvatarImage src={currentAvatarUrl} />
            <AvatarFallback>
              {userId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <Button 
              size="sm" 
              className="rounded-full w-8 h-8 p-0"
              onClick={() => setShowCamera(true)}
              disabled={uploading}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="rounded-full w-8 h-8 p-0"
              onClick={openFileDialog}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Profile Photo</h3>
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Take a photo or upload from device'}
          </p>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};