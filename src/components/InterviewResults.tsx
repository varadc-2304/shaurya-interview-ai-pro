
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Clock, 
  MessageSquare, 
  RotateCcw, 
  Download,
  CheckCircle,
  AlertCircle,
  Target,
  Brain,
  Star,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  AlertTriangle,
  Sparkles,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [error, setError] = useState<string | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [performanceLevel, setPerformanceLevel] = useState('');
  const [overallRecommendation, setOverallRecommendation] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviewResults();
  }, [interviewId]);

  const fetchInterviewResults = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching interview results for ID:', interviewId);

      // Fetch interview data
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single();

      if (interviewError) {
        throw new Error(`Failed to fetch interview: ${interviewError.message}`);
      }
      
      console.log('Interview data:', interview);
      setInterviewData(interview);

      // Fetch questions data
      const { data: questionsData, error: questionsError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('interview_id', interviewId)
        .order('question_number');

      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }
      
      console.log('Questions data:', questionsData);
      
      if (!questionsData || questionsData.length === 0) {
        throw new Error('No interview questions found');
      }

      // Process questions data
      const processedQuestions = questionsData.map(q => ({
        ...q,
        strengths: Array.isArray(q.strengths) ? q.strengths : [],
        improvements: Array.isArray(q.improvements) ? q.improvements : [],
        evaluation_score: q.evaluation_score || 0,
        evaluation_feedback: q.evaluation_feedback || 'No evaluation available'
      }));

      setQuestions(processedQuestions);
      calculateOverallMetrics(processedQuestions);

    } catch (error) {
      console.error('Error fetching interview results:', error);
      setError(error instanceof Error ? error.message : 'Failed to load interview results');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallMetrics = (questionsData: InterviewQuestion[]) => {
    console.log('Calculating metrics for questions:', questionsData);
    
    const questionsWithScores = questionsData.filter(q => q.evaluation_score > 0);
    console.log('Questions with scores:', questionsWithScores.length);
    
    if (questionsWithScores.length === 0) {
      setOverallScore(0);
      setPerformanceLevel('Pending');
      setOverallRecommendation('Under Review');
      return;
    }

    // Calculate overall score
    const avgScore = questionsWithScores.reduce((sum, q) => sum + q.evaluation_score, 0) / questionsWithScores.length;
    const roundedScore = Math.round(avgScore);
    
    setOverallScore(roundedScore);

    // Set performance level
    if (avgScore >= 90) setPerformanceLevel('Excellent');
    else if (avgScore >= 80) setPerformanceLevel('Strong');
    else if (avgScore >= 70) setPerformanceLevel('Good');
    else if (avgScore >= 60) setPerformanceLevel('Satisfactory');
    else setPerformanceLevel('Needs Improvement');

    // Set recommendation
    if (avgScore >= 80) setOverallRecommendation('Strong Hire');
    else if (avgScore >= 70) setOverallRecommendation('Hire');
    else if (avgScore >= 60) setOverallRecommendation('Maybe');
    else setOverallRecommendation('No Hire');
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
    if (score >= 85) return "text-emerald-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 65) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (score >= 65) return <AlertCircle className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case 'Excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Strong': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Good': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'Satisfactory': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Needs Improvement': return 'text-orange-700 bg-orange-50 border-orange-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Hire': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Hire': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Maybe': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'No Hire': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Loading Results</h2>
            <p className="text-gray-600 max-w-md">Fetching your interview performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Error Loading Results</h2>
            <p className="text-gray-600 max-w-md">{error}</p>
            <Button onClick={fetchInterviewResults} className="mt-4">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900">Interview Results</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your performance analysis is ready
              </p>
            </div>
            {performanceLevel && (
              <div className="flex justify-center">
                <Badge className={`px-6 py-3 text-lg border ${getPerformanceLevelColor(performanceLevel)} font-semibold`}>
                  <Star className="mr-2 h-5 w-5" />
                  {performanceLevel} Performance
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Overall Score Section */}
        <Card className="mb-10 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-10">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Target className="h-6 w-6 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-500 uppercase tracking-wider">Overall Score</span>
                </div>
                <div className={`text-7xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}<span className="text-4xl">%</span>
                </div>
              </div>
              <Progress value={overallScore} className="h-4 w-full max-w-lg mx-auto" />
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                <div className="text-center space-y-3 p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{calculateDuration()}</div>
                  <p className="text-sm text-gray-500">Total time</p>
                </div>
                
                <div className="text-center space-y-3 p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-semibold">Questions</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
                  <p className="text-sm text-gray-500">Answered</p>
                </div>
                
                <div className="text-center space-y-3 p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Star className="h-5 w-5" />
                    <span className="font-semibold">Recommendation</span>
                  </div>
                  <Badge className={`text-lg border ${getRecommendationColor(overallRecommendation)} font-semibold py-1 px-3`}>
                    {overallRecommendation}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Analysis */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <span>Question Analysis</span>
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Detailed breakdown of each response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((q) => (
              <Collapsible 
                key={q.id}
                open={expandedQuestion === q.id}
                onOpenChange={(open) => setExpandedQuestion(open ? q.id : null)}
              >
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <CollapsibleTrigger className="w-full p-6 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-sm font-semibold px-3 py-1">
                          Q{q.question_number}
                        </Badge>
                        {getScoreIcon(q.evaluation_score)}
                        <span className={`font-bold text-lg ${getScoreColor(q.evaluation_score)}`}>
                          {q.evaluation_score}%
                        </span>
                      </div>
                      {expandedQuestion === q.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <p className="text-gray-700 mt-4 text-left font-medium text-lg leading-relaxed">
                      {q.question_text}
                    </p>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
                      {/* AI Feedback */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-800 flex items-center space-x-2">
                          <Brain className="h-4 w-4" />
                          <span>AI Assessment</span>
                        </h4>
                        <p className="text-blue-700 bg-blue-50 p-4 rounded-lg border border-blue-200 leading-relaxed">
                          {q.evaluation_feedback}
                        </p>
                      </div>

                      {/* Strengths and Improvements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {q.strengths && q.strengths.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-emerald-800 flex items-center space-x-2">
                              <ThumbsUp className="h-4 w-4" />
                              <span>Strengths</span>
                            </h4>
                            <div className="space-y-2">
                              {q.strengths.map((strength, idx) => (
                                <div key={idx} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                                  <span className="text-emerald-700 leading-relaxed">{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {q.improvements && q.improvements.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-amber-800 flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Areas for Growth</span>
                            </h4>
                            <div className="space-y-2">
                              {q.improvements.map((improvement, idx) => (
                                <div key={idx} className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                                  <span className="text-amber-700 leading-relaxed">{improvement}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-10 text-center space-y-4">
          <Button 
            onClick={onStartNewInterview}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 shadow-lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Start New Interview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;
