import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, RotateCcw } from 'lucide-react';
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
  const [isCameraMode, setIsCameraMode] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup stream when component unmounts or camera mode changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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

  const startCamera = async () => {
    setCameraError('');
    setIsCameraMode(true);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera for food photos
        } 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Camera access denied. Please enable camera permissions and try again.');
      setIsCameraMode(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
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

  // Camera view
  if (isCameraMode) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <Card className="overflow-hidden shadow-strong border-primary/20 border-2">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-80 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white p-4">
                  <p className="text-sm mb-4">{cameraError}</p>
                  <Button onClick={stopCamera} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Close Camera
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-gradient-card">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="bg-gradient-cta hover:shadow-glow text-white font-bold px-8 py-3 rounded-xl transition-all duration-300"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture Photo
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="px-8 py-3 rounded-xl"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {!selectedImage ? (
        <Card className="border-2 border-dashed border-primary/30 hover:border-primary transition-all duration-300 bg-gradient-card shadow-medium hover:shadow-strong">
          <div className="p-10 text-center space-y-8">
            {/* Big Bold CTA Buttons */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Button
                size="lg"
                onClick={startCamera}
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

      {/* Hidden file input for upload */}
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
    </div>
  );
};