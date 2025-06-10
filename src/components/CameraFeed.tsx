
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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera stream obtained:', mediaStream);
      
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Video element srcObject set');
        
        // Wait for video metadata to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          setIsVideoReady(true);
          
          // Ensure video plays
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing successfully');
            }).catch(err => {
              console.error('Error playing video:', err);
              setError('Failed to start video playback');
            });
          }
        };

        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
          setError('Video playback error');
        };
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
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      setStream(null);
      setIsVideoReady(false);
    }
  };

  useEffect(() => {
    console.log('CameraFeed component mounted');
    startCamera();
    return () => {
      console.log('CameraFeed component unmounting');
      stopCamera();
    };
  }, []);

  return (
    <div className={`relative bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 ${className}`}>
      {/* Minimal Header */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
          <span className="text-gray-700 text-sm font-medium flex items-center">
            <User className="h-4 w-4 mr-2 text-blue-600" />
            You
          </span>
        </div>
      </div>

      {/* Video Feed */}
      {hasPermission && !error && stream && isVideoReady ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ 
            minHeight: '100%', 
            minWidth: '100%',
            transform: 'scaleX(-1)' // Mirror the video for better user experience
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {isLoading ? (
            <div className="text-center">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-6 animate-pulse" />
              <p className="text-gray-500 text-lg font-medium">Starting camera...</p>
              <p className="text-gray-400 text-sm mt-2">Please allow camera access</p>
            </div>
          ) : error ? (
            <div className="text-center px-8">
              <CameraOff className="h-16 w-16 text-red-400 mx-auto mb-6" />
              <p className="text-red-500 mb-6 text-lg font-medium">Camera not available</p>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <Button 
                onClick={startCamera} 
                variant="outline" 
                className="rounded-full px-6"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-lg font-medium">Camera initializing...</p>
            </div>
          )}
        </div>
      )}

      {/* Live indicator */}
      {hasPermission && stream && isVideoReady && (
        <div className="absolute top-6 right-6">
          <div className="bg-red-500 rounded-full px-3 py-1 flex items-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
