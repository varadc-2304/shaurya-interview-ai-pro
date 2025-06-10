
import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CameraFeedProps {
  className?: string;
}

const CameraFeed = ({ className = '' }: CameraFeedProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasPermission(false);
      setError('Camera access denied or unavailable');
      toast({
        title: "Camera Error",
        description: "Please allow camera access to continue with the interview.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-white text-sm font-medium flex items-center">
            <User className="h-4 w-4 mr-2" />
            You
          </span>
        </div>
      </div>

      {/* Video Feed */}
      {hasPermission && !error ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {isLoading ? (
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-300">Starting camera...</p>
            </div>
          ) : error ? (
            <div className="text-center px-6">
              <CameraOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300 mb-4">Camera not available</p>
              <Button onClick={startCamera} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">Camera initializing...</p>
            </div>
          )}
        </div>
      )}

      {/* Recording indicator */}
      {hasPermission && (
        <div className="absolute top-4 right-4">
          <div className="bg-green-500 rounded-full p-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
