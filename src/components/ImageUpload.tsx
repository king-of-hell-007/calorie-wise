import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onAnalyze: (imageFile: File) => void;
  isAnalyzing: boolean;
}

export const ImageUpload = ({ onAnalyze, isAnalyzing }: ImageUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleAnalyze = () => {
    if (selectedImage) {
      onAnalyze(selectedImage);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {!selectedImage ? (
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 bg-gradient-card">
          <div className="p-8 text-center space-y-6">
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCameraClick}
                className="flex-col h-auto py-4 px-6 space-y-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Camera className="w-8 h-8" />
                <span>Camera</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleUploadClick}
                className="flex-col h-auto py-4 px-6 space-y-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Upload className="w-8 h-8" />
                <span>Upload</span>
              </Button>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">
                Capture or upload a photo of your meal to get instant nutrition analysis
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-medium">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Selected meal"
              className="w-full h-64 object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 hover:bg-destructive hover:text-destructive-foreground"
              disabled={isAnalyzing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Ready to analyze your meal? This will identify the nutritional content.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Nutrition'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
    </div>
  );
};