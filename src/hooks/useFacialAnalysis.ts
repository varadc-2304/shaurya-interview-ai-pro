
import { useState, useRef, useCallback, useEffect } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface FacialAnalysisData {
  emotions: {
    neutral: number;
    happy: number;
    surprised: number;
    concerned: number;
    focused: number;
  };
  confidence: {
    eye_contact_ratio: number;
    head_stability: number;
    expression_consistency: number;
  };
  engagement: {
    attention_score: number;
    enthusiasm_level: number;
    stress_indicators: number;
  };
  duration_analyzed: number;
  sample_count: number;
}

export const useFacialAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentData, setCurrentData] = useState<FacialAnalysisData | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const analysisDataRef = useRef<FacialAnalysisData>({
    emotions: {
      neutral: 0,
      happy: 0,
      surprised: 0,
      concerned: 0,
      focused: 0,
    },
    confidence: {
      eye_contact_ratio: 0,
      head_stability: 0,
      expression_consistency: 0,
    },
    engagement: {
      attention_score: 0,
      enthusiasm_level: 0,
      stress_indicators: 0,
    },
    duration_analyzed: 0,
    sample_count: 0,
  });
  const startTimeRef = useRef<number>(0);

  const calculateEmotions = useCallback((landmarks: any) => {
    if (!landmarks || landmarks.length === 0) return null;

    // Get key facial landmarks for emotion detection
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];
    const noseTip = landmarks[1];
    const leftEyebrow = landmarks[70];
    const rightEyebrow = landmarks[300];

    // Calculate eye openness (0-1)
    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgEyeOpenness = (leftEyeHeight + rightEyeHeight) / 2;

    // Calculate mouth curvature for smile detection
    const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x);
    const mouthHeight = Math.abs(mouthTop.y - mouthBottom.y);
    const mouthRatio = mouthHeight / mouthWidth;
    const mouthCurve = (mouthLeft.y + mouthRight.y) / 2 - mouthBottom.y;

    // Calculate eyebrow position for surprise/concern
    const browHeight = (leftEyebrow.y + rightEyebrow.y) / 2;
    const browToEye = browHeight - (leftEyeTop.y + rightEyeTop.y) / 2;

    // Emotion scoring based on facial features
    const emotions = {
      neutral: Math.max(0, 1 - Math.abs(mouthCurve) - Math.abs(browToEye) * 2),
      happy: Math.max(0, Math.min(1, mouthCurve * 3 + avgEyeOpenness * 0.5)),
      surprised: Math.max(0, Math.min(1, avgEyeOpenness * 2 + Math.max(0, -browToEye * 4))),
      concerned: Math.max(0, Math.min(1, Math.max(0, browToEye * 3) + (mouthRatio > 0.3 ? 0.3 : 0))),
      focused: Math.max(0, Math.min(1, (avgEyeOpenness * 0.8) + (mouthRatio < 0.2 ? 0.4 : 0))),
    };

    return emotions;
  }, []);

  const calculateConfidence = useCallback((landmarks: any) => {
    if (!landmarks || landmarks.length === 0) return null;

    // Head pose estimation using key points
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[175];

    // Calculate head stability (lower values = more stable)
    const faceCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const headTilt = Math.abs(leftEye.y - rightEye.y);
    const headTurn = Math.abs(noseTip.x - faceCenter.x);

    // Eye contact estimation (looking at camera vs. away)
    const eyeContactScore = Math.max(0, 1 - headTurn * 5 - headTilt * 3);

    const confidence = {
      eye_contact_ratio: eyeContactScore,
      head_stability: Math.max(0, 1 - headTilt * 2 - headTurn * 2),
      expression_consistency: 0.5, // Will be calculated over time
    };

    return confidence;
  }, []);

  const calculateEngagement = useCallback((landmarks: any, emotions: any) => {
    if (!landmarks || !emotions) return null;

    // Engagement based on facial activity and attention
    const emotionalVariance = Object.values(emotions).reduce((sum: number, val: any) => sum + val, 0);
    const attentionScore = emotions.focused + emotions.neutral * 0.5;
    const enthusiasmLevel = emotions.happy + emotions.surprised * 0.7;
    const stressIndicators = emotions.concerned * 0.8 + (1 - emotions.neutral) * 0.3;

    const engagement = {
      attention_score: Math.min(1, attentionScore),
      enthusiasm_level: Math.min(1, enthusiasmLevel),
      stress_indicators: Math.min(1, stressIndicators),
    };

    return engagement;
  }, []);

  const onResults = useCallback((results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const emotions = calculateEmotions(landmarks);
    const confidence = calculateConfidence(landmarks);
    const engagement = calculateEngagement(landmarks, emotions);

    if (emotions && confidence && engagement) {
      const currentTime = Date.now();
      const duration = (currentTime - startTimeRef.current) / 1000;

      // Update running averages
      analysisDataRef.current = {
        emotions: {
          neutral: (analysisDataRef.current.emotions.neutral * analysisDataRef.current.sample_count + emotions.neutral) / (analysisDataRef.current.sample_count + 1),
          happy: (analysisDataRef.current.emotions.happy * analysisDataRef.current.sample_count + emotions.happy) / (analysisDataRef.current.sample_count + 1),
          surprised: (analysisDataRef.current.emotions.surprised * analysisDataRef.current.sample_count + emotions.surprised) / (analysisDataRef.current.sample_count + 1),
          concerned: (analysisDataRef.current.emotions.concerned * analysisDataRef.current.sample_count + emotions.concerned) / (analysisDataRef.current.sample_count + 1),
          focused: (analysisDataRef.current.emotions.focused * analysisDataRef.current.sample_count + emotions.focused) / (analysisDataRef.current.sample_count + 1),
        },
        confidence: {
          eye_contact_ratio: (analysisDataRef.current.confidence.eye_contact_ratio * analysisDataRef.current.sample_count + confidence.eye_contact_ratio) / (analysisDataRef.current.sample_count + 1),
          head_stability: (analysisDataRef.current.confidence.head_stability * analysisDataRef.current.sample_count + confidence.head_stability) / (analysisDataRef.current.sample_count + 1),
          expression_consistency: (analysisDataRef.current.confidence.expression_consistency * analysisDataRef.current.sample_count + confidence.expression_consistency) / (analysisDataRef.current.sample_count + 1),
        },
        engagement: {
          attention_score: (analysisDataRef.current.engagement.attention_score * analysisDataRef.current.sample_count + engagement.attention_score) / (analysisDataRef.current.sample_count + 1),
          enthusiasm_level: (analysisDataRef.current.engagement.enthusiasm_level * analysisDataRef.current.sample_count + engagement.enthusiasm_level) / (analysisDataRef.current.sample_count + 1),
          stress_indicators: (analysisDataRef.current.engagement.stress_indicators * analysisDataRef.current.sample_count + engagement.stress_indicators) / (analysisDataRef.current.sample_count + 1),
        },
        duration_analyzed: duration,
        sample_count: analysisDataRef.current.sample_count + 1,
      };

      setCurrentData({ ...analysisDataRef.current });
    }
  }, [calculateEmotions, calculateConfidence, calculateEngagement]);

  const initializeFaceMesh = useCallback(async () => {
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      return faceMesh;
    } catch (error) {
      console.error('Failed to initialize FaceMesh:', error);
      return null;
    }
  }, [onResults]);

  const startAnalysis = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!videoElement || isAnalyzing) return false;

    try {
      const faceMesh = await initializeFaceMesh();
      if (!faceMesh) return false;

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (faceMeshRef.current && videoElement.readyState >= 2) {
            await faceMeshRef.current.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      startTimeRef.current = Date.now();
      
      // Reset analysis data
      analysisDataRef.current = {
        emotions: { neutral: 0, happy: 0, surprised: 0, concerned: 0, focused: 0 },
        confidence: { eye_contact_ratio: 0, head_stability: 0, expression_consistency: 0 },
        engagement: { attention_score: 0, enthusiasm_level: 0, stress_indicators: 0 },
        duration_analyzed: 0,
        sample_count: 0,
      };

      camera.start();
      setIsAnalyzing(true);
      return true;
    } catch (error) {
      console.error('Failed to start facial analysis:', error);
      return false;
    }
  }, [isAnalyzing, initializeFaceMesh]);

  const stopAnalysis = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  const getAnalysisData = useCallback(() => {
    return { ...analysisDataRef.current };
  }, []);

  const resetAnalysis = useCallback(() => {
    analysisDataRef.current = {
      emotions: { neutral: 0, happy: 0, surprised: 0, concerned: 0, focused: 0 },
      confidence: { eye_contact_ratio: 0, head_stability: 0, expression_consistency: 0 },
      engagement: { attention_score: 0, enthusiasm_level: 0, stress_indicators: 0 },
      duration_analyzed: 0,
      sample_count: 0,
    };
    setCurrentData(null);
  }, []);

  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    isAnalyzing,
    currentData,
    startAnalysis,
    stopAnalysis,
    getAnalysisData,
    resetAnalysis,
  };
};
