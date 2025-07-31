import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  RotateCcw, 
  X, 
  Square, 
  Download, 
  Send,
  Zap,
  ZapOff,
  SwitchCamera,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CameraCaptureProps {
  onCapture?: (file: File, type: 'photo' | 'video') => void;
  onClose?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ type: 'photo' | 'video'; url: string; file: File } | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode, startCamera, stopCamera]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      // Flip image if using front camera
      if (facingMode === 'user') {
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setCapturedMedia({ type: 'photo', url, file });
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ type: 'video', url, file });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({
        title: "Recording Error",
        description: "Unable to start recording.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);

  const handleQuickPost = async () => {
    if (!capturedMedia) return;
    
    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to post",
          variant: "destructive",
        });
        return;
      }

      // Upload media to storage
      const fileExt = capturedMedia.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, capturedMedia.file);

      if (uploadError) {
        toast({
          title: "Error",
          description: "Failed to upload media",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(uploadData.path);

      // Create post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption || null,
          image_url: capturedMedia.type === 'photo' ? publicUrl : null,
          video_url: capturedMedia.type === 'video' ? publicUrl : null,
          visibility: 'public'
        });

      if (postError) {
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive",
        });
        return;
      }

      // Also add to user gallery if it's a photo
      if (capturedMedia.type === 'photo') {
        await supabase
          .from('user_gallery')
          .insert({
            user_id: user.id,
            image_url: publicUrl,
            caption: caption || null,
            order_index: Date.now()
          });
      }

      toast({
        title: "Posted!",
        description: "Your content has been shared",
      });

      navigate('/');
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "Error",
        description: "Failed to post content",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleSend = () => {
    setShowPostOptions(true);
  };

  const downloadMedia = () => {
    if (capturedMedia) {
      const a = document.createElement('a');
      a.href = capturedMedia.url;
      a.download = `capture-${Date.now()}.${capturedMedia.type === 'photo' ? 'jpg' : 'webm'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const retakeCapture = () => {
    setCapturedMedia(null);
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (capturedMedia && showPostOptions) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPostOptions(false)}
            className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">New Post</h2>
          <Button
            onClick={handleQuickPost}
            disabled={isPosting}
            className="bg-primary hover:bg-primary/90 text-white px-6 rounded-full"
          >
            {isPosting ? 'Posting...' : 'Share'}
          </Button>
        </div>

        {/* Preview */}
        <div className="flex-1 flex">
          {/* Media Preview */}
          <div className="w-2/3 flex items-center justify-center">
            {capturedMedia.type === 'photo' ? (
              <img 
                src={capturedMedia.url} 
                alt="Captured" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <video 
                src={capturedMedia.url} 
                controls 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>

          {/* Caption and Options */}
          <div className="w-1/3 p-4 flex flex-col">
            <div className="mb-4">
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-transparent border-white/20 text-white placeholder-white/60 resize-none"
                rows={4}
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm">Add to Gallery</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Allow Comments</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 flex items-center justify-between bg-black/50">
          <Button
            variant="ghost"
            onClick={retakeCapture}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retake
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={downloadMedia}
              className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (capturedMedia) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex-1 relative">
          {capturedMedia.type === 'photo' ? (
            <img 
              src={capturedMedia.url} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              src={capturedMedia.url} 
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Instagram-like overlay actions */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              {/* Left side actions */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retakeCapture}
                  className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadMedia}
                  className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                >
                  <Download className="w-6 h-6" />
                </Button>
              </div>

              {/* Center - Quick Post */}
              <Button
                onClick={handleQuickPost}
                disabled={isPosting}
                className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-3 font-semibold"
              >
                {isPosting ? 'Posting...' : 'Your Story'}
              </Button>

              {/* Right side actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSend}
                  className="bg-primary hover:bg-primary/90 rounded-full w-12 h-12 p-0"
                >
                  <Send className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => navigate(-1))}
            className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black w-full h-full"
         style={{ 
           height: '100dvh',
           WebkitOverflowScrolling: 'touch',
           touchAction: 'manipulation',
           overflow: 'hidden'
         }}>
      {/* Camera View */}
      <div className="relative w-full h-full overflow-hidden" style={{ paddingBottom: '80px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
          style={{ height: 'calc(100vh - 80px)' }}
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => navigate('/'))}
            className="text-white hover:bg-black/50 rounded-full w-12 h-12 p-0 backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlashEnabled(!flashEnabled)}
              className="text-white hover:bg-black/50 rounded-full w-12 h-12 p-0 backdrop-blur-sm"
            >
              {flashEnabled ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={switchCamera}
              className="text-white hover:bg-black/50 rounded-full w-12 h-12 p-0 backdrop-blur-sm"
            >
              <SwitchCamera className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-lg font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          </div>
        )}

        {/* Center Focus Area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-2 border-white/30 rounded-lg"></div>
        </div>
      </div>

      {/* Bottom Controls - Snapchat Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6"
           style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
        <div className="flex items-end justify-between px-6">
          {/* Gallery Preview */}
          <div className="w-12 h-12 bg-white/20 rounded-lg backdrop-blur-sm"></div>

          {/* Main Capture Button */}
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={isRecording ? stopRecording : capturePhoto}
              onMouseDown={!isRecording ? startRecording : undefined}
              onMouseUp={isRecording ? stopRecording : undefined}
              onTouchStart={!isRecording ? startRecording : undefined}
              onTouchEnd={isRecording ? stopRecording : undefined}
              className={`rounded-full transition-all duration-200 ${
                isRecording 
                  ? 'w-24 h-24 bg-red-500 border-4 border-white hover:bg-red-600' 
                  : 'w-20 h-20 bg-white border-4 border-white/30 hover:scale-110'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <div className="w-4 h-4 bg-black rounded-full" />
              )}
            </Button>
            
            <p className="text-white/80 text-sm font-medium">
              {isRecording ? 'Release to stop' : 'Hold for video, tap for photo'}
            </p>
          </div>

          {/* Switch Camera */}
          <Button
            variant="ghost"
            size="sm"
            onClick={switchCamera}
            className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0 backdrop-blur-sm"
          >
            <SwitchCamera className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};