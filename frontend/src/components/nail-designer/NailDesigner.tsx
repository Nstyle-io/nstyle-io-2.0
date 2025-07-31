import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Triangle, Ellipse } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Save, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIPhotoDesigner } from './AIPhotoDesigner';

const NAIL_SHAPES = {
  square: { width: 100, height: 120, cornerRadius: 5 },
  round: { width: 100, height: 110, cornerRadius: 50 },
  oval: { width: 90, height: 120, cornerRadius: 45 },
  coffin: { width: 85, height: 130, cornerRadius: 10 },
  stiletto: { width: 80, height: 140, cornerRadius: 2 },
  almond: { width: 85, height: 125, cornerRadius: 25 }
};

const NAIL_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000',
  '#FFFFFF', '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C'
];

const PATTERNS = [
  { name: 'Dots', type: 'dots' },
  { name: 'Stripes', type: 'stripes' },
  { name: 'French Tips', type: 'french' },
  { name: 'Gradient', type: 'gradient' }
];

interface NailDesignerProps {
  onSave?: (designData: unknown) => void;
  onAIChat?: (message: string) => void;
}

export const NailDesigner: React.FC<NailDesignerProps> = ({ onSave, onAIChat }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedShape, setSelectedShape] = useState<keyof typeof NAIL_SHAPES>('oval');
  const [selectedColor, setSelectedColor] = useState('#FFB6C1');
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'shapes' | 'patterns'>('select');
  const [designs, setDesigns] = useState<unknown[]>([]);
  const [designName, setDesignName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 500,
      backgroundColor: '#ffffff',
    });

    // Add nail base shape
    addNailBase(canvas, selectedShape);

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [selectedShape]);

  useEffect(() => {
    loadUserDesigns();
  }, []);

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = activeTool === 'draw';
      if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = selectedColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
      }
    }
  }, [activeTool, selectedColor, brushSize, fabricCanvas]);

  const addNailBase = (canvas: FabricCanvas, shape: keyof typeof NAIL_SHAPES) => {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    
    const nailShape = NAIL_SHAPES[shape];
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;

    let baseShape;
    
    if (shape === 'round') {
      baseShape = new Circle({
        radius: nailShape.width / 2,
        fill: '#F8F8FF',
        stroke: '#E0E0E0',
        strokeWidth: 2,
        left: centerX - nailShape.width / 2,
        top: centerY - nailShape.height / 2,
        selectable: false,
        evented: false
      });
    } else {
      baseShape = new Rect({
        width: nailShape.width,
        height: nailShape.height,
        fill: '#F8F8FF',
        stroke: '#E0E0E0',
        strokeWidth: 2,
        rx: nailShape.cornerRadius,
        ry: nailShape.cornerRadius,
        left: centerX - nailShape.width / 2,
        top: centerY - nailShape.height / 2,
        selectable: false,
        evented: false
      });
    }

    canvas.add(baseShape);
    canvas.renderAll();
  };

  const changeNailShape = (shape: keyof typeof NAIL_SHAPES) => {
    if (!fabricCanvas) return;
    setSelectedShape(shape);
    addNailBase(fabricCanvas, shape);
  };

  const addShape = (shapeType: 'circle' | 'rectangle' | 'triangle') => {
    if (!fabricCanvas) return;

    let shape;
    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;

    switch (shapeType) {
      case 'circle':
        shape = new Circle({
          radius: 20,
          fill: selectedColor,
          left: centerX - 20,
          top: centerY - 20,
        });
        break;
      case 'rectangle':
        shape = new Rect({
          width: 40,
          height: 20,
          fill: selectedColor,
          left: centerX - 20,
          top: centerY - 10,
        });
        break;
      case 'triangle':
        shape = new Triangle({
          width: 40,
          height: 40,
          fill: selectedColor,
          left: centerX - 20,
          top: centerY - 20,
        });
        break;
    }

    fabricCanvas.add(shape);
    fabricCanvas.renderAll();
  };

  const addPattern = (patternType: string) => {
    if (!fabricCanvas) return;

    switch (patternType) {
      case 'dots':
        for (let i = 0; i < 5; i++) {
          const dot = new Circle({
            radius: 3,
            fill: selectedColor,
            left: Math.random() * 300 + 50,
            top: Math.random() * 400 + 50,
          });
          fabricCanvas.add(dot);
        }
        break;
      case 'stripes':
        for (let i = 0; i < 3; i++) {
          const stripe = new Rect({
            width: 5,
            height: 100,
            fill: selectedColor,
            left: 150 + (i * 20),
            top: 150,
          });
          fabricCanvas.add(stripe);
        }
        break;
      case 'french': {
        const tip = new Ellipse({
          rx: 50,
          ry: 15,
          fill: selectedColor,
          left: 150,
          top: 100,
        });
        fabricCanvas.add(tip);
        break;
      }
    }
    
    fabricCanvas.renderAll();
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    addNailBase(fabricCanvas, selectedShape);
  };

  const saveDesign = async () => {
    if (!fabricCanvas || !designName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a design name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error", 
          description: "Please log in to save designs",
          variant: "destructive"
        });
        return;
      }

      const designData = {
        canvas: fabricCanvas.toJSON(),
        shape: selectedShape,
        colors: [selectedColor]
      };

      const { error } = await supabase
        .from('nail_designs')
        .insert({
          user_id: user.id,
          name: designName,
          design_data: designData,
          thumbnail_url: fabricCanvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 1 })
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Design saved successfully!"
      });

      setDesignName('');
      loadUserDesigns();
      
      if (onSave) {
        onSave(designData);
      }
    } catch (error) {
      console.error('Error saving design:', error);
      toast({
        title: "Error",
        description: "Failed to save design",
        variant: "destructive"
      });
    }
  };

  const loadUserDesigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nail_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const loadDesign = (design: { design_data: { canvas: string; shape: keyof typeof NAIL_SHAPES } }) => {
    if (!fabricCanvas) return;
    
    fabricCanvas.loadFromJSON(design.design_data.canvas, () => {
      fabricCanvas.renderAll();
      setSelectedShape(design.design_data.shape);
    });
  };

  const downloadDesign = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 2
    });
    
    const link = document.createElement('a');
    link.download = `nail-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* AI Photo Designer */}
      <AIPhotoDesigner onAIChat={onAIChat} />
      
      {/* Traditional Canvas Designer */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Traditional Nail Designer
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Create custom designs using our digital canvas tools
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas */}
            <div className="lg:col-span-2">
              <div className="flex justify-center mb-4">
                <div className="border border-border rounded-lg p-4 bg-background">
                  <canvas ref={canvasRef} />
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <Button onClick={clearCanvas} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={downloadDesign} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-6">
              <Tabs value={activeTool} onValueChange={(value) => setActiveTool(value as 'select' | 'draw' | 'shapes' | 'patterns')}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="select">Select</TabsTrigger>
                  <TabsTrigger value="draw">Draw</TabsTrigger>
                  <TabsTrigger value="shapes">Shapes</TabsTrigger>
                  <TabsTrigger value="patterns">Patterns</TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="space-y-4">
                  <div>
                    <Label>Nail Shape</Label>
                    <Select value={selectedShape} onValueChange={(value) => changeNailShape(value as keyof typeof NAIL_SHAPES)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(NAIL_SHAPES).map((shape) => (
                          <SelectItem key={shape} value={shape}>
                            {shape.charAt(0).toUpperCase() + shape.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="draw" className="space-y-4">
                  <div>
                    <Label>Brush Size: {brushSize}px</Label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="shapes" className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => addShape('circle')} variant="outline" size="sm">
                      Circle
                    </Button>
                    <Button onClick={() => addShape('rectangle')} variant="outline" size="sm">
                      Square
                    </Button>
                    <Button onClick={() => addShape('triangle')} variant="outline" size="sm">
                      Triangle
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="patterns" className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {PATTERNS.map((pattern) => (
                      <Button 
                        key={pattern.type}
                        onClick={() => addPattern(pattern.type)} 
                        variant="outline" 
                        size="sm"
                      >
                        {pattern.name}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Color Palette */}
              <div>
                <Label>Colors</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {NAIL_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 ${
                        selectedColor === color ? 'border-primary' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* Save Design */}
              <div className="space-y-2">
                <Label>Save Design</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Design name"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                  />
                  <Button onClick={saveDesign} size="sm">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Saved Designs */}
              {designs.length > 0 && (
                <div>
                  <Label>Your Designs</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {designs.map((design) => (
                      <button
                        key={design.id}
                        onClick={() => loadDesign(design)}
                        className="border border-border rounded p-2 hover:bg-muted transition-colors"
                      >
                        <div className="text-xs truncate">{design.name}</div>
                        {design.thumbnail_url && (
                          <img 
                            src={design.thumbnail_url} 
                            alt={design.name}
                            className="w-full h-16 object-cover rounded mt-1"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};