
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
  user_text_response?: string;
  user_code_response?: string;
  response_language?: string;
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
  const [personalizedSummary, setPersonalizedSummary] = useState('');

  useEffect(() => {
    fetchInterviewResults();
  }, [interviewId]);

  const fetchInterviewResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching interview results for ID:', interviewId);

      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .single();

      if (interviewError) {
        console.error('Error fetching interview:', interviewError);
        throw interviewError;
      }
      
      console.log('Interview data fetched:', interview);
      setInterviewData(interview);

      const { data: questionsData, error: questionsError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('interview_id', interviewId)
        .order('question_number');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw questionsError;
      }
      
      console.log('Questions data fetched:', questionsData);
      setQuestions(questionsData || []);

      if (questionsData && questionsData.length > 0) {
        calculateOverallMetrics(questionsData);
        generatePersonalizedSummary(questionsData, interview);
      } else {
        console.warn('No questions found for interview');
        // Set default values when no questions are found
        setOverallScore(0);
        setPerformanceLevel('No Data');
        setOverallRecommendation('Incomplete');
        setPersonalizedSummary('No interview data available to analyze.');
      }

    } catch (error) {
      console.error('Error fetching interview results:', error);
      // Set error state values
      setOverallScore(0);
      setPerformanceLevel('Error');
      setOverallRecommendation('Error');
      setPersonalizedSummary('An error occurred while loading your interview results.');
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedSummary = (questionsData: InterviewQuestion[], interview: InterviewData) => {
    console.log('Generating personalized summary for questions:', questionsData);
    
    const validScores = questionsData.filter(q => q.evaluation_score !== null && q.evaluation_score !== undefined);
    console.log('Valid scores found:', validScores.length);
    
    if (validScores.length === 0) {
      setPersonalizedSummary('Your interview responses are still being processed. Please check back shortly.');
      return;
    }
    
    const avgScore = validScores.reduce((sum, q) => sum + q.evaluation_score, 0) / validScores.length;
    console.log('Average score calculated:', avgScore);
    
    const allStrengths = questionsData.flatMap(q => q.strengths || []);
    const allImprovements = questionsData.flatMap(q => q.improvements || []);
    
    const topStrengths = [...new Set(allStrengths)].slice(0, 3);
    const keyImprovements = [...new Set(allImprovements)].slice(0, 2);
    
    const roleSpecific = interview.job_role;
    const domainSpecific = interview.domain;
    
    let summary = `Your ${roleSpecific} interview for the ${domainSpecific} domain showed ${avgScore >= 80 ? 'excellent' : avgScore >= 70 ? 'strong' : avgScore >= 60 ? 'solid' : 'developing'} performance overall. `;
    
    if (topStrengths.length > 0) {
      summary += `You demonstrated particular strength in ${topStrengths.slice(0, 2).join(' and ')}.`;
    }
    
    if (keyImprovements.length > 0) {
      summary += ` Focus on enhancing ${keyImprovements[0]} to further strengthen your candidacy.`;
    }
    
    summary += ` Your responses show ${avgScore >= 75 ? 'strong readiness' : avgScore >= 60 ? 'good potential' : 'developing skills'} for ${roleSpecific} roles in ${domainSpecific}.`;
    
    setPersonalizedSummary(summary);
  };

  const calculateOverallMetrics = (questionsData: InterviewQuestion[]) => {
    console.log('Calculating overall metrics for questions:', questionsData);
    
    const validScores = questionsData.filter(q => q.evaluation_score !== null && q.evaluation_score !== undefined);
    console.log('Questions with valid scores:', validScores.length);
    
    if (validScores.length === 0) {
      console.log('No valid scores found, setting defaults');
      setOverallScore(0);
      setPerformanceLevel('Pending');
      setOverallRecommendation('Under Review');
      return;
    }

    // Calculate overall score
    const avgScore = validScores.reduce((sum, q) => sum + q.evaluation_score, 0) / validScores.length;
    const roundedScore = Math.round(avgScore);
    console.log('Calculated average score:', avgScore, 'rounded:', roundedScore);
    setOverallScore(roundedScore);

    // Calculate dimension averages if available
    const questionsWithDimensions = questionsData.filter(q => q.dimension_scores);
    console.log('Questions with dimension scores:', questionsWithDimensions.length);
    
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Analyzing Your Performance</h2>
            <p className="text-gray-600 max-w-md">Our AI is carefully evaluating your responses and generating detailed insights...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900">Interview Analysis Complete</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive evaluation of your performance with actionable insights
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
        {/* Enhanced Overall Score Section */}
        <Card className="mb-10 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-10">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Target className="h-6 w-6 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-500 uppercase tracking-wider">Overall Performance</span>
                </div>
                <div className={`text-7xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}<span className="text-4xl">%</span>
                </div>
              </div>
              <Progress value={overallScore} className="h-4 w-full max-w-lg mx-auto" />
              
              {/* Enhanced Key Metrics */}
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
                  <p className="text-sm text-gray-500">Evaluated</p>
                </div>
                
                <div className="text-center space-y-3 p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Award className="h-5 w-5" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Performance Dimensions */}
            {overallDimensionScores && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <span>Performance Breakdown</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-lg">
                    Detailed evaluation across key competency areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(overallDimensionScores).map(([key, score]) => {
                    const dimension = dimensionLabels[key as keyof DimensionScores];
                    const IconComponent = dimension.icon;
                    return (
                      <div key={key} className="space-y-4 p-5 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-gray-900 text-lg">{dimension.label}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`font-bold text-xl ${getScoreColor(score * 10)}`}>
                              {score}/10
                            </span>
                          </div>
                        </div>
                        <Progress value={score * 10} className="h-3" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Enhanced Question Analysis */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  <span>Detailed Question Analysis</span>
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  In-depth breakdown of each response with strengths and areas for improvement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No interview questions found</p>
                  </div>
                ) : (
                  questions.map((q) => (
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
                              {getScoreIcon(q.evaluation_score || 0)}
                              <span className={`font-bold text-lg ${getScoreColor(q.evaluation_score || 0)}`}>
                                {q.evaluation_score || 0}%
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
                            {/* Combined User Response */}
                            {(q.user_response || q.user_text_response || q.user_code_response) && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Your Response</span>
                                </h4>
                                <div className="space-y-3">
                                  {q.user_response && (
                                    <div className="bg-white p-4 rounded-lg border">
                                      <p className="text-sm text-gray-600 mb-2">Speech Response:</p>
                                      <p className="text-gray-700 leading-relaxed">{q.user_response}</p>
                                    </div>
                                  )}
                                  {q.user_text_response && (
                                    <div className="bg-white p-4 rounded-lg border">
                                      <p className="text-sm text-gray-600 mb-2">Text Response:</p>
                                      <p className="text-gray-700 leading-relaxed">{q.user_text_response}</p>
                                    </div>
                                  )}
                                  {q.user_code_response && (
                                    <div className="bg-white p-4 rounded-lg border">
                                      <p className="text-sm text-gray-600 mb-2">Code Response ({q.response_language}):</p>
                                      <pre className="text-gray-700 bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                        <code>{q.user_code_response}</code>
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {q.evaluation_feedback && (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-blue-800 flex items-center space-x-2">
                                  <Brain className="h-4 w-4" />
                                  <span>AI Assessment</span>
                                </h4>
                                <p className="text-blue-700 bg-blue-50 p-4 rounded-lg border border-blue-200 leading-relaxed">
                                  {q.evaluation_feedback}
                                </p>
                              </div>
                            )}

                            {/* Enhanced Strengths and Improvements */}
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
                                        <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
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
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Personalized Summary Box */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span>Personalized Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
                  <div className={`text-5xl font-bold ${getScoreColor(overallScore)} mb-3`}>
                    {overallScore}%
                  </div>
                  <Progress value={overallScore} className="h-3 mb-4" />
                  {performanceLevel && (
                    <Badge className={`border ${getPerformanceLevelColor(performanceLevel)} font-semibold px-4 py-2`}>
                      {performanceLevel}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-4 p-4 bg-white rounded-xl border">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span>Your Interview Insights</span>
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {personalizedSummary}
                  </p>
                </div>

                {interviewData && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Interview Details</span>
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Role:</span>
                        <Badge variant="outline" className="font-medium">{interviewData.job_role}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Domain:</span>
                        <Badge variant="outline" className="font-medium">{interviewData.domain}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Experience:</span>
                        <Badge variant="outline" className="font-medium">{interviewData.experience}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="outline" className="font-medium">{interviewData.question_type}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={onStartNewInterview}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 shadow-lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Start New Interview
                </Button>
                
                <Button variant="outline" className="w-full font-semibold py-3 border-2 hover:bg-gray-50">
                  <Download className="mr-2 h-5 w-5" />
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
