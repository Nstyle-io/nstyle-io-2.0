import { useState, useRef, useCallback } from 'react';
import { Upload, Palette, Sparkles, Download, Share2, Undo, Redo, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import NailEditor from '@/components/design/NailEditor';
import ColorPicker from '@/components/design/ColorPicker';
import DesignPatterns from '@/components/design/DesignPatterns';

interface NailZone {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: { x: number; y: number };
}

interface NailDetectionResult {
  success: boolean;
  nails: NailZone[];
  imageSize: { width: number; height: number };
  message?: string;
}

const Design = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<NailDetectionResult | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF69B4');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedNail, setSelectedNail] = useState<string | null>(null);
  const [nailColors, setNailColors] = useState<Record<string, string>>({});
  const [nailPatterns, setNailPatterns] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      setDetectionResult(null);
      setNailColors({});
      setNailPatterns({});
      setHistory([]);
      setHistoryIndex(-1);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const detectNails = async () => {
    if (!uploadedImage) return;

    setIsDetecting(true);
    try {
      // Convert base64 to blob
      const base64Response = await fetch(uploadedImage);
      const blob = await base64Response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'hand-image.jpg');

      // Call the nail detection API
      const { data, error } = await supabase.functions.invoke('detect-nails', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        setDetectionResult(data);
        toast({
          title: "Nails detected!",
          description: `Found ${data.nails.length} nails in the image`,
        });
      } else {
        throw new Error(data.message || 'Detection failed');
      }
    } catch (error) {
      console.error('Nail detection error:', error);
      toast({
        title: "Detection failed",
        description: "Could not detect nails in the image. Please try another image.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const applyColorToNail = (nailId: string, color: string) => {
    const newColors = { ...nailColors, [nailId]: color };
    setNailColors(newColors);
    addToHistory({ type: 'color', nailId, value: color });
  };

  const applyPatternToNail = (nailId: string, pattern: string) => {
    const newPatterns = { ...nailPatterns, [nailId]: pattern };
    setNailPatterns(newPatterns);
    addToHistory({ type: 'pattern', nailId, value: pattern });
  };

  const applyToAllNails = () => {
    if (!detectionResult) return;
    
    const newColors: Record<string, string> = {};
    const newPatterns: Record<string, string> = {};
    
    detectionResult.nails.forEach(nail => {
      newColors[nail.id] = selectedColor;
      if (selectedPattern) {
        newPatterns[nail.id] = selectedPattern;
      }
    });
    
    setNailColors(newColors);
    setNailPatterns(newPatterns);
    addToHistory({ type: 'all', color: selectedColor, pattern: selectedPattern });
  };

  const addToHistory = (action: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(action);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Implement undo logic based on history
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Implement redo logic based on history
    }
  };

  const saveDesign = async () => {
    if (!uploadedImage || !detectionResult) return;

    try {
      const designData = {
        originalImage: uploadedImage,
        nailZones: detectionResult.nails,
        nailColors,
        nailPatterns,
        imageSize: detectionResult.imageSize
      };

      const { data, error } = await supabase
        .from('nail_designs')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          design_data: designData,
          thumbnail: uploadedImage // You might want to generate a proper thumbnail
        });

      if (error) throw error;

      toast({
        title: "Design saved!",
        description: "Your nail design has been saved to your profile",
      });
    } catch (error) {
      console.error('Save design error:', error);
      toast({
        title: "Save failed",
        description: "Could not save your design. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <ResponsiveLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Nail Design Studio</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
              {detectionResult && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveDesign}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-auto">
            {!uploadedImage ? (
              <div className="h-full flex items-center justify-center">
                <Card className="max-w-md w-full">
                  <CardContent className="p-8 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Upload a Hand Photo</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload a photo of your hand and we'll detect your nails for virtual design
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                {!detectionResult && (
                  <div className="mb-4">
                    <Button
                      onClick={detectNails}
                      disabled={isDetecting}
                      size="lg"
                    >
                      {isDetecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Detecting Nails...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Detect Nails
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                <NailEditor
                  image={uploadedImage}
                  detectionResult={detectionResult}
                  nailColors={nailColors}
                  nailPatterns={nailPatterns}
                  selectedNail={selectedNail}
                  onNailSelect={setSelectedNail}
                  onColorApply={applyColorToNail}
                  onPatternApply={applyPatternToNail}
                />
              </div>
            )}
          </div>

          {/* Tools Sidebar */}
          {detectionResult && (
            <div className="w-80 border-l border-white/10 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Color Picker */}
                <div>
                  <h3 className="font-semibold mb-3">Nail Color</h3>
                  <ColorPicker
                    selectedColor={selectedColor}
                    onColorChange={setSelectedColor}
                  />
                  <Button
                    className="w-full mt-3"
                    onClick={() => {
                      if (selectedNail) {
                        applyColorToNail(selectedNail, selectedColor);
                      } else {
                        applyToAllNails();
                      }
                    }}
                  >
                    {selectedNail ? 'Apply to Selected' : 'Apply to All Nails'}
                  </Button>
                </div>

                {/* Design Patterns */}
                <div>
                  <h3 className="font-semibold mb-3">Design Patterns</h3>
                  <DesignPatterns
                    selectedPattern={selectedPattern}
                    onPatternSelect={setSelectedPattern}
                  />
                </div>

                {/* Nail Selection */}
                <div>
                  <h3 className="font-semibold mb-3">Select Nail</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {detectionResult.nails.map((nail) => (
                      <Button
                        key={nail.id}
                        variant={selectedNail === nail.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedNail(nail.id)}
                        className="h-12"
                      >
                        {nail.name}
                      </Button>
                    ))}
                  </div>
                  {selectedNail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSelectedNail(null)}
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Design;