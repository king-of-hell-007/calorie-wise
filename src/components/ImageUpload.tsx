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
      // Enhanced constraints for mobile optimization with high quality
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera for food photos
          width: { ideal: 1920, max: 4096 },  // Higher resolution for better analysis
          height: { ideal: 1080, max: 4096 },
          aspectRatio: { ideal: 16 / 9 }
        }
      };

      // Fallback for older mobile browsers
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintError) {
        // Fallback with simpler constraints for older devices
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays on mobile
        videoRef.current.play().catch(console.error);
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      const errorMessage = error.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions in your browser settings and refresh the page.'
        : error.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Unable to access camera. Please try again or use the upload option.';
      setCameraError(errorMessage);
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
        // Set canvas size to video dimensions for maximum quality
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob with high quality for accurate analysis
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
              type: 'image/jpeg'
            });
            handleFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95); // High quality (95%) for accurate nutrition analysis
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

  // Full-screen camera view for mobile
  if (isCameraMode) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Full-screen video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera controls overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top bar with close button */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="text-white font-medium">Position your food in frame</div>
            <Button
              onClick={stopCamera}
              size="sm"
              variant="ghost"
              className="h-10 w-10 rounded-full p-0 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Center guidelines (optional) */}
          <div className="flex-1 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white/30 rounded-2xl w-80 h-80 max-w-[90vw] max-h-[50vh]"></div>
          </div>

          {/* Bottom controls */}
          <div className="p-6 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-center gap-8">
              {/* Capture button */}
              <Button
                onClick={capturePhoto}
                disabled={!!cameraError}
                size="lg"
                className="bg-white hover:bg-white/90 text-black font-bold w-20 h-20 rounded-full p-0 shadow-2xl hover:scale-105 transition-all duration-200 border-4 border-white/50"
              >
                <Camera className="w-10 h-10" />
              </Button>
            </div>
            <p className="text-center text-white/80 text-sm mt-4">
              Tap to capture • Ensure good lighting for best results
            </p>
          </div>
        </div>

        {/* Error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="text-center text-white max-w-sm space-y-4">
              <p className="text-base leading-relaxed">{cameraError}</p>
              <Button onClick={stopCamera} variant="outline" className="bg-white/10 text-white border-white/30">
                <X className="w-4 h-4 mr-2" />
                Close Camera
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
      {!selectedImage ? (
        <Card className="border-2 border-dashed border-primary/30 hover:border-primary transition-all duration-300 bg-gradient-card shadow-medium hover:shadow-strong">
          <div className="p-6 sm:p-10 text-center space-y-6 sm:space-y-8">
            {/* Mobile-optimized CTA Buttons */}
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
              <Button
                size="lg"
                onClick={startCamera}
                className="group bg-gradient-cta hover:shadow-glow text-white font-bold text-lg sm:text-xl w-full px-6 py-6 sm:px-8 sm:py-8 h-auto rounded-2xl transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-strong flex-col space-y-2 sm:space-y-3 min-h-[120px] touch-manipulation"
              >
                <Camera className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleUploadClick}
                className="group font-bold text-lg sm:text-xl w-full px-6 py-6 sm:px-8 sm:py-8 h-auto rounded-2xl border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-medium flex-col space-y-2 sm:space-y-3 min-h-[120px] touch-manipulation"
              >
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform" />
                <span>Upload Photo</span>
              </Button>
            </div>
            <div className="text-center">
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
                Capture or upload a photo of your meal for instant, AI-powered nutrition analysis with high accuracy
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
              className="w-full h-64 sm:h-80 object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 h-10 w-10 rounded-full p-0 hover:bg-destructive hover:text-destructive-foreground shadow-medium backdrop-blur-sm bg-white/90 touch-manipulation"
              disabled={isAnalyzing}
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 shadow-medium">
              <p className="text-xs sm:text-sm font-medium text-foreground">Ready to analyze!</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-card">
            <p className="text-base sm:text-lg text-muted-foreground text-center leading-relaxed px-2">
              Perfect! Now let's analyze the nutritional content of your meal with high precision.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-cta hover:shadow-glow text-white font-bold text-lg sm:text-xl px-6 py-5 sm:px-8 sm:py-6 h-auto rounded-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 shadow-strong touch-manipulation"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-spin" />
                  Analyzing Your Meal...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  Analyze Nutrition Now
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Hidden file input for upload - Mobile optimized */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif"
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