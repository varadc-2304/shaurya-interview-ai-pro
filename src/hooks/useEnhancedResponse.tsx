
import { useState, useRef } from 'react';
import { FacialAnalysisData } from './useFacialAnalysis';

export interface EnhancedResponse {
  audioBlob: Blob | null;
  textContent: string;
  codeContent: string;
  codeLanguage: string;
  facialAnalysis: FacialAnalysisData | null;
  hasAudio: boolean;
  hasText: boolean;
  hasCode: boolean;
  hasFacialAnalysis: boolean;
}

export const useEnhancedResponse = () => {
  const [response, setResponse] = useState<EnhancedResponse>({
    audioBlob: null,
    textContent: '',
    codeContent: '',
    codeLanguage: 'javascript',
    facialAnalysis: null,
    hasAudio: false,
    hasText: false,
    hasCode: false,
    hasFacialAnalysis: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setResponse(prev => ({
          ...prev,
          audioBlob,
          hasAudio: true
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const updateTextContent = (text: string) => {
    setResponse(prev => ({
      ...prev,
      textContent: text,
      hasText: text.trim().length > 0
    }));
  };

  const updateCodeContent = (code: string, language: string) => {
    setResponse(prev => ({
      ...prev,
      codeContent: code,
      codeLanguage: language,
      hasCode: code.trim().length > 0
    }));
  };

  const updateFacialAnalysis = (facialData: FacialAnalysisData) => {
    setResponse(prev => ({
      ...prev,
      facialAnalysis: facialData,
      hasFacialAnalysis: facialData.sample_count > 0
    }));
  };

  const resetResponse = () => {
    setResponse({
      audioBlob: null,
      textContent: '',
      codeContent: '',
      codeLanguage: 'javascript',
      facialAnalysis: null,
      hasAudio: false,
      hasText: false,
      hasCode: false,
      hasFacialAnalysis: false,
    });
  };

  const hasAnyContent = response.hasAudio || response.hasText || response.hasCode;

  return {
    response,
    isRecording,
    startRecording,
    stopRecording,
    updateTextContent,
    updateCodeContent,
    updateFacialAnalysis,
    resetResponse,
    hasAnyContent
  };
};
