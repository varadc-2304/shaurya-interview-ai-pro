
import { useState } from 'react';

interface ResponseData {
  speechText: string;
  codeContent: string;
  textContent: string;
}

export const useEnhancedResponse = () => {
  const [speechText, setSpeechText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Clear previous speech text when starting new recording
    setSpeechText('');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSpeechResult = (text: string) => {
    setSpeechText(text);
  };

  const handleSubmitResponse = (response: ResponseData) => {
    // Combine all response types into a single response
    const combinedResponse = [
      response.speechText && `Speech: ${response.speechText}`,
      response.textContent && `Text: ${response.textContent}`,
      response.codeContent && `Code: ${response.codeContent}`
    ].filter(Boolean).join('\n\n');

    return combinedResponse;
  };

  const resetResponse = () => {
    setSpeechText('');
    setIsRecording(false);
  };

  return {
    speechText,
    isRecording,
    handleStartRecording,
    handleStopRecording,
    handleSpeechResult,
    handleSubmitResponse,
    resetResponse
  };
};
