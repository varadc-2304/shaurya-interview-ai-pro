import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Brain,
  Star,
  Users,
  Lightbulb,
  BarChart3,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface InterviewResultsProps {
  interviewId: string;
  onStartNewInterview: () => void;
}

interface DimensionScores {
  technical_accuracy: number;
  problem_solving: number;
  communication: number;
  experience_examples: number;
  leadership_collaboration: number;
  adaptability_learning: number;
  industry_awareness: number;
}

interface DetailedFeedback {
  score: number;
  evidence: string[];
  strengths: string[];
  improvements: string[];
}

interface CulturalFit {
  rating: string;
  reasoning: string;
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
  dimension_scores?: DimensionScores;
  detailed_feedback?: Record<string, DetailedFeedback>;
  cultural_fit?: CulturalFit;
  recommendation?: string;
  confidence_level?: string;
  follow_up_questions?: string[];
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
  const [overallDimensionScores, setOverallDimensionScores] = useState<DimensionScores | null>(null);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [performanceLevel, setPerformanceLevel] = useState('');
  const [overallRecommendation, setOverallRecommendation] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

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

      // Calculate overall metrics
      if (questionsData && questionsData.length > 0) {
        calculateOverallMetrics(questionsData);
      }

    } catch (error) {
      console.error('Error fetching interview results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallMetrics = (questionsData: InterviewQuestion[]) => {
    const validScores = questionsData.filter(q => q.evaluation_score !== null);
    if (validScores.length === 0) return;

    // Calculate overall score
    const avgScore = validScores.reduce((sum, q) => sum + q.evaluation_score, 0) / validScores.length;
    setOverallScore(Math.round(avgScore));

    // Calculate dimension averages if available
    const questionsWithDimensions = questionsData.filter(q => q.dimension_scores);
    if (questionsWithDimensions.length > 0) {
      const dimensions: DimensionScores = {
        technical_accuracy: 0,
        problem_solving: 0,
        communication: 0,
        experience_examples: 0,
        leadership_collaboration: 0,
        adaptability_learning: 0,
        industry_awareness: 0
      };

      questionsWithDimensions.forEach(q => {
        if (q.dimension_scores) {
          Object.keys(dimensions).forEach(key => {
            dimensions[key as keyof DimensionScores] += q.dimension_scores![key as keyof DimensionScores] || 0;
          });
        }
      });

      Object.keys(dimensions).forEach(key => {
        dimensions[key as keyof DimensionScores] = Math.round(
          dimensions[key as keyof DimensionScores] / questionsWithDimensions.length
        );
      });

      setOverallDimensionScores(dimensions);
    }

    // Determine performance level
    if (avgScore >= 90) setPerformanceLevel('Excellent');
    else if (avgScore >= 80) setPerformanceLevel('Strong');
    else if (avgScore >= 70) setPerformanceLevel('Good');
    else if (avgScore >= 60) setPerformanceLevel('Satisfactory');
    else if (avgScore >= 50) setPerformanceLevel('Needs Improvement');
    else setPerformanceLevel('Weak');

    // Set overall recommendation - get the most recent recommendation or determine based on score
    const questionsWithRecommendations = questionsData.filter(q => q.recommendation && q.recommendation !== 'Pending');
    if (questionsWithRecommendations.length > 0) {
      // Use the latest recommendation
      const latestRecommendation = questionsWithRecommendations[questionsWithRecommendations.length - 1].recommendation;
      setOverallRecommendation(latestRecommendation || 'Under Review');
    } else {
      // Fallback to score-based recommendation
      if (avgScore >= 80) setOverallRecommendation('Strong Hire');
      else if (avgScore >= 70) setOverallRecommendation('Hire');
      else if (avgScore >= 60) setOverallRecommendation('Maybe');
      else setOverallRecommendation('No Hire');
    }

    setOverallFeedback(generateOverallFeedback(questionsData, avgScore));
  };

  const generateOverallFeedback = (questionsData: InterviewQuestion[], score: number) => {
    const strengths = questionsData.flatMap(q => q.strengths || []);
    const improvements = questionsData.flatMap(q => q.improvements || []);
    
    return `Based on your ${questionsData.length} responses, you demonstrated ${strengths.length > 0 ? 'strong ' + strengths[0] : 'good communication skills'}. Key areas for development include ${improvements.length > 0 ? improvements[0] : 'providing more specific examples'}.`;
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
      case 'Weak': return 'text-red-700 bg-red-50 border-red-200';
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

  const dimensionLabels = {
    technical_accuracy: { label: 'Technical Accuracy', icon: Brain },
    problem_solving: { label: 'Problem Solving', icon: Lightbulb },
    communication: { label: 'Communication', icon: MessageSquare },
    experience_examples: { label: 'Experience Examples', icon: BookOpen },
    leadership_collaboration: { label: 'Leadership & Collaboration', icon: Users },
    adaptability_learning: { label: 'Adaptability & Learning', icon: TrendingUp },
    industry_awareness: { label: 'Industry Awareness', icon: BarChart3 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Analyzing Results</h2>
            <p className="text-gray-600">Processing your interview performance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Interview Complete</h1>
              <p className="text-lg text-gray-600">Your comprehensive performance analysis</p>
            </div>
            {performanceLevel && (
              <Badge className={`px-4 py-2 border ${getPerformanceLevelColor(performanceLevel)} font-medium`}>
                {performanceLevel} Performance
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Overall Score Section */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Overall Score</span>
                </div>
                <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </div>
              </div>
              <Progress value={overallScore} className="h-3 w-full max-w-md mx-auto" />
              
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-8 pt-6 border-t border-gray-100">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center space-x-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Duration</span>
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{calculateDuration()}</div>
                </div>
                
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center space-x-1 text-gray-500">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Questions</span>
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{questions.length}</div>
                </div>
                
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center space-x-1 text-gray-500">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-medium">Recommendation</span>
                  </div>
                  <Badge className={`border ${getRecommendationColor(overallRecommendation)} font-medium`}>
                    {overallRecommendation}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Dimensions */}
            {overallDimensionScores && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900">Performance Breakdown</CardTitle>
                  <CardDescription className="text-gray-600">
                    Evaluation across key competency areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(overallDimensionScores).map(([key, score]) => {
                    const dimension = dimensionLabels[key as keyof DimensionScores];
                    const IconComponent = dimension.icon;
                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">{dimension.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${getScoreColor(score * 10)}`}>
                              {score}/10
                            </span>
                          </div>
                        </div>
                        <Progress value={score * 10} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Question Analysis */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Question Analysis</CardTitle>
                <CardDescription className="text-gray-600">
                  Detailed breakdown of your responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((q) => (
                  <Collapsible 
                    key={q.id}
                    open={expandedQuestion === q.id}
                    onOpenChange={(open) => setExpandedQuestion(open ? q.id : null)}
                  >
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-xs font-medium">
                              Q{q.question_number}
                            </Badge>
                            {getScoreIcon(q.evaluation_score || 0)}
                            <span className={`font-semibold ${getScoreColor(q.evaluation_score || 0)}`}>
                              {q.evaluation_score || 0}%
                            </span>
                          </div>
                          {expandedQuestion === q.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-2 text-left font-medium">
                          {q.question_text}
                        </p>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                          {q.user_response && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">Your Response</h4>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                {q.user_response}
                              </p>
                            </div>
                          )}
                          
                          {q.evaluation_feedback && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-blue-700">AI Assessment</h4>
                              <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
                                {q.evaluation_feedback}
                              </p>
                            </div>
                          )}

                          {q.strengths && q.strengths.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-emerald-700">Strengths</h4>
                                <ul className="text-sm text-emerald-600 space-y-1">
                                  {q.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {q.improvements && q.improvements.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-amber-700">Areas for Growth</h4>
                                  <ul className="text-sm text-amber-600 space-y-1">
                                    {q.improvements.map((improvement, idx) => (
                                      <li key={idx} className="flex items-start space-x-2">
                                        <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        <span>{improvement}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className={`text-4xl font-bold ${getScoreColor(overallScore)} mb-2`}>
                    {overallScore}%
                  </div>
                  <Progress value={overallScore} className="h-2 mb-4" />
                  {performanceLevel && (
                    <Badge className={`border ${getPerformanceLevelColor(performanceLevel)} font-medium`}>
                      {performanceLevel}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="leading-relaxed">
                    {overallFeedback || 'Your interview performance demonstrates strong communication skills with opportunities for growth in technical depth and specific examples.'}
                  </p>
                </div>

                {interviewData && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Interview Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Role:</span>
                        <span className="font-medium text-gray-900">{interviewData.job_role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Domain:</span>
                        <span className="font-medium text-gray-900">{interviewData.domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Experience:</span>
                        <span className="font-medium text-gray-900">{interviewData.experience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium text-gray-900">{interviewData.question_type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={onStartNewInterview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start New Interview
                </Button>
                
                <Button variant="outline" className="w-full font-medium">
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
