import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Wand2, Sparkles, Download, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DESIGN_STYLES = [
  { name: 'French Manicure', value: 'french' },
  { name: 'Ombre', value: 'ombre' },
  { name: 'Glitter', value: 'glitter' },
  { name: 'Matte', value: 'matte' },
  { name: 'Chrome', value: 'chrome' },
  { name: 'Marble', value: 'marble' },
  { name: 'Floral', value: 'floral' },
  { name: 'Geometric', value: 'geometric' },
  { name: 'Abstract', value: 'abstract' },
  { name: 'Holographic', value: 'holographic' }
];

const COLOR_THEMES = [
  { name: 'Classic Red', colors: ['#DC143C', '#8B0000'] },
  { name: 'Pink Bliss', colors: ['#FFB6C1', '#FF69B4'] },
  { name: 'Ocean Blue', colors: ['#4169E1', '#00CED1'] },
  { name: 'Sunset Orange', colors: ['#FF6347', '#FFD700'] },
  { name: 'Purple Dream', colors: ['#9370DB', '#BA55D3'] },
  { name: 'Emerald Green', colors: ['#50C878', '#228B22'] },
  { name: 'Rose Gold', colors: ['#E8B4A0', '#D4AF37'] },
  { name: 'Monochrome', colors: ['#000000', '#FFFFFF'] }
];

interface AIPhotoDesignerProps {
  onAIChat?: (message: string) => void;
}

export const AIPhotoDesigner: React.FC<AIPhotoDesignerProps> = ({ onAIChat }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [designedImage, setDesignedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('french');
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [designName, setDesignName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use file upload instead.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (context) {
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setOriginalImage(imageData);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCamera(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateDesign = async () => {
    if (!originalImage) {
      toast({
        title: "No Image",
        description: "Please upload or capture a photo first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // const designPrompt = customPrompt || 
      //   `Apply a beautiful ${DESIGN_STYLES.find(s => s.value === selectedStyle)?.name} nail design with ${COLOR_THEMES[selectedTheme].name} color theme to the nails in this hand photo. Make it look professional and elegant.`;

      // For this demo, we'll simulate AI processing
      // In a real implementation, you would call an AI image generation API
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate result - in reality this would come from your AI API
      setDesignedImage(originalImage); // Placeholder
      
      toast({
        title: "Design Complete!",
        description: "Your AI nail design has been generated successfully!"
      });

      // Notify AI chat if available
      if (onAIChat) {
        onAIChat(`I've created a beautiful ${DESIGN_STYLES.find(s => s.value === selectedStyle)?.name} design for your nails! What do you think?`);
      }

    } catch (error) {
      console.error('Error generating design:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate nail design. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveDesign = async () => {
    if (!designedImage || !designName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a design name and generate a design first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save designs.",
          variant: "destructive"
        });
        return;
      }

      const designData = {
        style: selectedStyle,
        colorTheme: COLOR_THEMES[selectedTheme],
        customPrompt,
        originalImage,
        designedImage
      };

      const { error } = await supabase
        .from('nail_designs')
        .insert({
          user_id: user.id,
          name: designName,
          design_data: designData,
          thumbnail_url: designedImage
        });

      if (error) throw error;

      toast({
        title: "Design Saved!",
        description: "Your AI nail design has been saved to your gallery."
      });

      setDesignName('');
    } catch (error) {
      console.error('Error saving design:', error);
      toast({
        title: "Save Error",
        description: "Failed to save design. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadDesign = () => {
    if (!designedImage) return;
    
    const link = document.createElement('a');
    link.download = `nail-design-${Date.now()}.jpg`;
    link.href = designedImage;
    link.click();
  };

  const resetDesign = () => {
    setOriginalImage(null);
    setDesignedImage(null);
    setCustomPrompt('');
    setDesignName('');
    stopCamera();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" />
            AI Nail Designer
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          </CardTitle>
          <p className="text-muted-foreground">
            Upload a photo of your hands and let AI create stunning nail designs for you ✨
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Photo</TabsTrigger>
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Your Hand Photo</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a clear photo of your hands showing your nails
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose Photo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="border border-border rounded-lg p-4 text-center">
                {!isCamera ? (
                  <div>
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Take a Photo</h3>
                    <p className="text-muted-foreground mb-4">
                      Use your camera to capture a photo of your hands
                    </p>
                    <Button onClick={startCamera}>
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={capturePhoto}>
                        <Camera className="w-4 h-4 mr-2" />
                        Capture
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </TabsContent>
          </Tabs>

          {originalImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Original Image */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Original Photo</Label>
                <div className="relative">
                  <img
                    src={originalImage}
                    alt="Original hand photo"
                    className="w-full h-64 object-cover rounded-lg border border-border"
                  />
                </div>
              </div>

              {/* AI Generated Result */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">AI Generated Design</Label>
                <div className="relative">
                  {designedImage ? (
                    <img
                      src={designedImage}
                      alt="AI designed nails"
                      className="w-full h-64 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-lg border border-border flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">AI design will appear here</p>
                      </div>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">Creating your design...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Design Controls */}
          {originalImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label>Design Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGN_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {COLOR_THEMES.map((theme, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTheme(index)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTheme === index ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {theme.colors.map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className="text-sm">{theme.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Custom Prompt (Optional)</Label>
                  <Input
                    placeholder="Describe your ideal nail design..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Design Name</Label>
                  <Input
                    placeholder="Name your design..."
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={generateDesign} 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Creating...' : 'Generate Design'}
                  </Button>
                  <Button variant="outline" onClick={resetDesign}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {designedImage && (
                  <div className="flex gap-2">
                    <Button onClick={saveDesign} variant="outline" className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save Design
                    </Button>
                    <Button onClick={downloadDesign} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};