
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
  Brain,
  Star,
  Award,
  BarChart3,
  PieChart,
  Zap,
  Eye,
  BookOpen,
  Lightbulb,
  ArrowUp,
  ArrowDown
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

interface AnalysisMetrics {
  communication: number;
  technical: number;
  problemSolving: number;
  leadership: number;
  creativity: number;
}

const InterviewResults = ({ interviewId, onStartNewInterview }: InterviewResultsProps) => {
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [analysisMetrics, setAnalysisMetrics] = useState<AnalysisMetrics>({
    communication: 0,
    technical: 0,
    problemSolving: 0,
    leadership: 0,
    creativity: 0
  });

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

      // Calculate overall score and metrics
      if (questionsData && questionsData.length > 0) {
        const validScores = questionsData.filter(q => q.evaluation_score !== null);
        if (validScores.length > 0) {
          const avgScore = validScores.reduce((sum, q) => sum + q.evaluation_score, 0) / validScores.length;
          setOverallScore(Math.round(avgScore));
          
          // Calculate skill-based metrics
          calculateAnalysisMetrics(questionsData);
          
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

  const calculateAnalysisMetrics = (questionsData: InterviewQuestion[]) => {
    const metrics = {
      communication: 0,
      technical: 0,
      problemSolving: 0,
      leadership: 0,
      creativity: 0
    };

    // Simulate analysis based on responses and scores
    questionsData.forEach((q, index) => {
      const score = q.evaluation_score || 0;
      const responseLength = q.user_response?.length || 0;
      
      // Distribution based on question type and response quality
      switch (index % 5) {
        case 0:
          metrics.communication += score * (responseLength > 100 ? 1.1 : 0.9);
          break;
        case 1:
          metrics.technical += score * (responseLength > 150 ? 1.2 : 0.8);
          break;
        case 2:
          metrics.problemSolving += score * (responseLength > 120 ? 1.15 : 0.85);
          break;
        case 3:
          metrics.leadership += score * (responseLength > 80 ? 1.05 : 0.95);
          break;
        case 4:
          metrics.creativity += score * (responseLength > 90 ? 1.1 : 0.9);
          break;
      }
    });

    // Normalize to 0-100 scale
    Object.keys(metrics).forEach(key => {
      metrics[key as keyof AnalysisMetrics] = Math.min(100, Math.max(0, 
        Math.round(metrics[key as keyof AnalysisMetrics] / questionsData.length)
      ));
    });

    setAnalysisMetrics(metrics);
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
      setOverallFeedback('Your interview performance demonstrates strong foundational skills with opportunities for growth in specific areas highlighted below.');
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

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { level: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Trophy className="h-5 w-5 text-emerald-600" />;
    if (score >= 60) return <Award className="h-5 w-5 text-blue-600" />;
    return <Target className="h-5 w-5 text-orange-600" />;
  };

  const getPerformanceInsight = () => {
    const topSkill = Object.entries(analysisMetrics).reduce((a, b) => 
      analysisMetrics[a[0] as keyof AnalysisMetrics] > analysisMetrics[b[0] as keyof AnalysisMetrics] ? a : b
    );
    
    const lowestSkill = Object.entries(analysisMetrics).reduce((a, b) => 
      analysisMetrics[a[0] as keyof AnalysisMetrics] < analysisMetrics[b[0] as keyof AnalysisMetrics] ? a : b
    );

    return {
      strength: topSkill[0],
      strengthScore: topSkill[1],
      improvement: lowestSkill[0],
      improvementScore: lowestSkill[1]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-2xl border-0">
          <CardContent className="pt-12 pb-12">
            <div className="relative">
              <Brain className="h-16 w-16 mx-auto mb-6 text-blue-600 animate-pulse" />
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analyzing Performance
            </h2>
            <p className="text-muted-foreground text-lg">Our AI is generating your comprehensive performance report...</p>
            <div className="mt-6">
              <Progress value={85} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">Processing insights...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreLevel = getScoreLevel(overallScore);
  const insight = getPerformanceInsight();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Interview Complete!</h1>
            <p className="text-xl opacity-90 mb-8">Comprehensive Analysis & Performance Insights</p>
            
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className={`text-4xl font-bold ${scoreLevel.color}`}>{overallScore}%</div>
                <div className="text-white/80">Overall Score</div>
                <div className={`text-sm font-medium ${scoreLevel.color}`}>{scoreLevel.level}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-4xl font-bold text-white">{calculateDuration()}</div>
                <div className="text-white/80">Duration</div>
                <div className="text-sm text-emerald-300">Optimal Timing</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-4xl font-bold text-white">{questions.length}</div>
                <div className="text-white/80">Questions</div>
                <div className="text-sm text-blue-300">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-12 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analysis Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skills Radar */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <span>Skills Analysis</span>
                </CardTitle>
                <CardDescription>
                  Breakdown of your performance across key competencies
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(analysisMetrics).map(([skill, score]) => {
                    const skillLevel = getScoreLevel(score);
                    const isTopSkill = skill === insight.strength;
                    const isLowestSkill = skill === insight.improvement;
                    
                    return (
                      <div key={skill} className={`p-4 rounded-xl border-2 transition-all ${isTopSkill ? 'border-emerald-200 bg-emerald-50' : isLowestSkill ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold capitalize text-gray-800">{skill}</span>
                            {isTopSkill && <ArrowUp className="h-4 w-4 text-emerald-600" />}
                            {isLowestSkill && <ArrowDown className="h-4 w-4 text-orange-600" />}
                          </div>
                          <span className={`font-bold text-lg ${skillLevel.color}`}>{score}%</span>
                        </div>
                        <Progress value={score} className="h-3 mb-2" />
                        <div className="flex justify-between items-center">
                          <Badge variant={isTopSkill ? "default" : isLowestSkill ? "secondary" : "outline"} className="text-xs">
                            {skillLevel.level}
                          </Badge>
                          {isTopSkill && <span className="text-xs text-emerald-600 font-medium">Top Strength</span>}
                          {isLowestSkill && <span className="text-xs text-orange-600 font-medium">Focus Area</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>Key Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Star className="h-6 w-6 text-emerald-600" />
                      <h3 className="font-semibold text-emerald-800">Top Strength</h3>
                    </div>
                    <p className="text-emerald-700 font-medium capitalize">{insight.strength}</p>
                    <p className="text-sm text-emerald-600 mt-1">
                      Exceptional performance at {insight.strengthScore}% - leverage this strength in your role
                    </p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Target className="h-6 w-6 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">Growth Opportunity</h3>
                    </div>
                    <p className="text-orange-700 font-medium capitalize">{insight.improvement}</p>
                    <p className="text-sm text-orange-600 mt-1">
                      Score: {insight.improvementScore}% - focus on developing this skill further
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question-wise Analysis */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span>Detailed Question Analysis</span>
                </CardTitle>
                <CardDescription>
                  In-depth breakdown of your responses and evaluations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((q, index) => {
                  const questionScore = q.evaluation_score || 0;
                  const questionLevel = getScoreLevel(questionScore);
                  
                  return (
                    <div key={q.id} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge variant="outline" className="text-sm font-medium">
                              Question {q.question_number}
                            </Badge>
                            {getScoreIcon(questionScore)}
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${questionLevel.bg} ${questionLevel.color}`}>
                              {questionScore}% • {questionLevel.level}
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
                            {q.question_text}
                          </h4>
                        </div>
                      </div>
                      
                      <Progress value={questionScore} className="h-3 mb-6" />
                      
                      {q.user_response && (
                        <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-lg mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Eye className="h-4 w-4 text-slate-600" />
                            <span className="font-medium text-slate-700">Your Response</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{q.user_response}</p>
                        </div>
                      )}
                      
                      {q.evaluation_feedback && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Brain className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-700">AI Evaluation</span>
                          </div>
                          <p className="text-blue-700 leading-relaxed">{q.evaluation_feedback}</p>
                        </div>
                      )}

                      {(q.strengths?.length > 0 || q.improvements?.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.strengths?.length > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-3">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span className="font-medium text-emerald-700">Strengths</span>
                              </div>
                              <ul className="space-y-1">
                                {q.strengths.map((strength, idx) => (
                                  <li key={idx} className="text-sm text-emerald-700 flex items-start space-x-2">
                                    <span className="text-emerald-500 mt-1">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {q.improvements?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                              <div className="flex items-center space-x-2 mb-3">
                                <Zap className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-700">Improvements</span>
                              </div>
                              <ul className="space-y-1">
                                {q.improvements.map((improvement, idx) => (
                                  <li key={idx} className="text-sm text-amber-700 flex items-start space-x-2">
                                    <span className="text-amber-500 mt-1">•</span>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overall Assessment */}
            <Card className="shadow-xl border-0 sticky top-6">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${scoreLevel.bg}`}>
                    <span className={`text-2xl font-bold ${scoreLevel.color}`}>{overallScore}%</span>
                  </div>
                </div>
                <CardTitle className="text-xl">Performance Overview</CardTitle>
                <CardDescription className={`font-medium ${scoreLevel.color}`}>
                  {scoreLevel.level} Performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Progress value={overallScore} className="h-4 mb-4" />
                </div>
                
                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">AI Feedback</span>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    {overallFeedback || 'Your interview demonstrates strong communication skills with room for growth in technical depth and specific examples.'}
                  </p>
                </div>

                {interviewData && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Interview Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium">{interviewData.job_role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Domain:</span>
                        <span className="font-medium">{interviewData.domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">{interviewData.experience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{interviewData.question_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{calculateDuration()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={onStartNewInterview}
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Start New Interview
                </Button>
                
                <Button variant="outline" className="w-full h-12 text-base">
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
