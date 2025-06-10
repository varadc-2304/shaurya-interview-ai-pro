
import { useEffect, useRef } from 'react';
import { useFacialAnalysis } from '@/hooks/useFacialAnalysis';

interface FacialAnalysisOverlayProps {
  videoElement: HTMLVideoElement | null;
  isRecording: boolean;
  onAnalysisData?: (data: any) => void;
}

const FacialAnalysisOverlay = ({ 
  videoElement, 
  isRecording, 
  onAnalysisData 
}: FacialAnalysisOverlayProps) => {
  const {
    isAnalyzing,
    currentData,
    startAnalysis,
    stopAnalysis,
    getAnalysisData,
    resetAnalysis,
  } = useFacialAnalysis();

  const analysisStartedRef = useRef(false);

  useEffect(() => {
    if (isRecording && videoElement && !analysisStartedRef.current) {
      // Start facial analysis when recording begins
      const initAnalysis = async () => {
        const success = await startAnalysis(videoElement);
        if (success) {
          analysisStartedRef.current = true;
          console.log('Facial analysis started');
        }
      };
      
      // Wait a bit for video to be ready
      setTimeout(initAnalysis, 1000);
    } else if (!isRecording && analysisStartedRef.current) {
      // Stop analysis and send final data when recording stops
      stopAnalysis();
      const finalData = getAnalysisData();
      
      if (onAnalysisData && finalData.sample_count > 0) {
        onAnalysisData(finalData);
      }
      
      analysisStartedRef.current = false;
      resetAnalysis();
      console.log('Facial analysis stopped');
    }
  }, [isRecording, videoElement, startAnalysis, stopAnalysis, getAnalysisData, resetAnalysis, onAnalysisData]);

  // Optional: Show real-time analysis indicator
  if (!isAnalyzing) return null;

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">Analyzing</span>
        </div>
        
        {currentData && currentData.sample_count > 0 && (
          <div className="mt-2 text-xs text-white/80">
            <div>Samples: {currentData.sample_count}</div>
            <div>Duration: {Math.round(currentData.duration_analyzed)}s</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialAnalysisOverlay;
