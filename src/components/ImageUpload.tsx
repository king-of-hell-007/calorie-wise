import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Sparkles } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!selectedImage ? (
        <Card className="border-2 border-dashed border-primary/30 hover:border-primary transition-all duration-300 bg-gradient-card shadow-medium hover:shadow-strong">
          <div className="p-10 text-center space-y-8">
            {/* Big Bold CTA Buttons */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Button
                size="lg"
                onClick={handleCameraClick}
                className="group bg-gradient-cta hover:shadow-glow text-white font-bold text-xl px-8 py-8 h-auto rounded-2xl transition-all duration-300 hover:scale-105 shadow-strong flex-col space-y-3"
              >
                <Camera className="w-12 h-12 group-hover:scale-110 transition-transform" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleUploadClick}
                className="group font-bold text-xl px-8 py-8 h-auto rounded-2xl border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 shadow-medium flex-col space-y-3"
              >
                <Upload className="w-12 h-12 group-hover:scale-110 transition-transform" />
                <span>Upload Photo</span>
              </Button>
            </div>
            <div className="text-center">
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                Capture or upload a photo of your meal for instant, AI-powered nutrition analysis
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-strong border-primary/20 border-2">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Selected meal"
              className="w-full h-80 object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-4 right-4 h-10 w-10 rounded-full p-0 hover:bg-destructive hover:text-destructive-foreground shadow-medium backdrop-blur-sm bg-white/90"
              disabled={isAnalyzing}
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-medium">
              <p className="text-sm font-medium text-foreground">Ready to analyze!</p>
            </div>
          </div>
          <div className="p-6 space-y-6 bg-gradient-card">
            <p className="text-lg text-muted-foreground text-center leading-relaxed">
              Perfect! Now let's analyze the nutritional content of your meal.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-cta hover:shadow-glow text-white font-bold text-xl px-8 py-6 h-auto rounded-xl transition-all duration-300 hover:scale-105 shadow-strong"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Analyzing Your Meal...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-3" />
                  Analyze Nutrition Now
                </>
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