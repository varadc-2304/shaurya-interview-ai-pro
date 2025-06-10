
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  MessageSquare, 
  RotateCcw, 
  Download,
  CheckCircle,
  AlertCircle,
  Target,
  Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InterviewResultsProps {
  interviewId: string;
  onStartNewInterview: () => void;
}

interface InterviewQuestion {
  id: string;
  question_number: number;
  question_text: string;
  user_response: string;
  evaluation_score: number;
  evaluation_feedback: string;
  strengths: string[];
  improvements: string[];
}

interface InterviewData {
  id: string;
  job_role: string;
  domain: string;
  experience: string;
  question_type: string;
  created_at: string;
  completed_at: string;
}

const InterviewResults = ({ interviewId, onStartNewInterview }: InterviewResultsProps) => {
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState('');

  useEffect(() => {
    fetchInterviewResults();
  }, [interviewId]);

  const fetchInterviewResults = async () => {
    try {
      setLoading(true);

      // Fetch interview data
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single();

      if (interviewError) throw interviewError;
      setInterviewData(interview);

      // Fetch interview questions and responses
      const { data: questionsData, error: questionsError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('interview_id', interviewId)
        .order('question_number');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Calculate overall score and generate feedback
      if (questionsData && questionsData.length > 0) {
        const validScores = questionsData.filter(q => q.evaluation_score !== null);
        if (validScores.length > 0) {
          const avgScore = validScores.reduce((sum, q) => sum + q.evaluation_score, 0) / validScores.length;
          setOverallScore(Math.round(avgScore));
          
          // Generate overall feedback
          await generateOverallFeedback(questionsData, interview);
        }
      }

    } catch (error) {
      console.error('Error fetching interview results:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOverallFeedback = async (questionsData: InterviewQuestion[], interview: InterviewData) => {
    try {
      const responses = questionsData.map(q => ({
        question: q.question_text,
        answer: q.user_response,
        score: q.evaluation_score
      }));

      const { data, error } = await supabase.functions.invoke('evaluate-response', {
        body: {
          type: 'overall_evaluation',
          responses,
          jobRole: interview.job_role,
          domain: interview.domain
        }
      });

      if (error) throw error;
      
      if (data?.feedback) {
        setOverallFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error generating overall feedback:', error);
      setOverallFeedback('Unable to generate detailed feedback at this time.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const calculateDuration = () => {
    if (!interviewData?.created_at || !interviewData?.completed_at) return '0:00';
    
    const start = new Date(interviewData.created_at);
    const end = new Date(interviewData.completed_at);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Analyzing Results</h2>
            <p className="text-muted-foreground">Our AI is generating your detailed performance report...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 shaurya-gradient rounded-2xl flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold shaurya-text-gradient mb-3">Interview Complete!</h1>
          <p className="text-muted-foreground text-lg">
            Here's your detailed performance analysis
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold text-foreground">
                    {calculateDuration()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {questions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question-wise Analysis */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>Question-wise Analysis</span>
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your performance on each question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">Q{q.question_number}</Badge>
                          {getScoreIcon(q.evaluation_score || 0)}
                          <span className={`font-semibold ${getScoreColor(q.evaluation_score || 0)}`}>
                            {q.evaluation_score || 0}%
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          {q.question_text}
                        </p>
                      </div>
                    </div>
                    
                    {q.user_response && (
                      <div className="bg-gray-50 p-3 rounded text-xs">
                        <p className="font-medium text-gray-700 mb-1">Your Response:</p>
                        <p className="text-gray-600 mb-2">{q.user_response}</p>
                      </div>
                    )}
                    
                    {q.evaluation_feedback && (
                      <div className="bg-blue-50 p-3 rounded text-xs">
                        <p className="font-medium text-blue-700 mb-1">AI Evaluation:</p>
                        <p className="text-blue-600 mb-2">{q.evaluation_feedback}</p>
                      </div>
                    )}

                    {q.strengths && q.strengths.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 p-2 rounded">
                          <p className="font-medium text-green-700 mb-1">Strengths:</p>
                          <ul className="text-green-600 list-disc list-inside">
                            {q.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        {q.improvements && q.improvements.length > 0 && (
                          <div className="bg-orange-50 p-2 rounded">
                            <p className="font-medium text-orange-700 mb-1">Areas for Improvement:</p>
                            <ul className="text-orange-600 list-disc list-inside">
                              {q.improvements.map((improvement, idx) => (
                                <li key={idx}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Progress value={q.evaluation_score || 0} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Overall Feedback & Actions */}
          <div className="space-y-6">
            {/* Overall Feedback */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Overall Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(overallScore)} mb-2`}>
                    {overallScore}%
                  </div>
                  <Progress value={overallScore} className="h-3 mb-4" />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {overallFeedback || 'Your interview performance shows good communication skills with room for improvement in providing specific examples and demonstrating deeper domain knowledge.'}
                  </p>
                </div>

                {interviewData && (
                  <div className="pt-2">
                    <h4 className="font-medium text-sm mb-2">Interview Details:</h4>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div>• Role: {interviewData.job_role}</div>
                      <div>• Domain: {interviewData.domain}</div>
                      <div>• Experience Level: {interviewData.experience}</div>
                      <div>• Question Type: {interviewData.question_type}</div>
                      <div>• Duration: {calculateDuration()}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={onStartNewInterview}
                  className="w-full shaurya-gradient hover:opacity-90 transition-opacity"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start New Interview
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;
