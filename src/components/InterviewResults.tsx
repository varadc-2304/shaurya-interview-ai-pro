
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
  Target
} from "lucide-react";
import { InterviewResults as IInterviewResults } from "./InterviewSession";

interface InterviewResultsProps {
  results: IInterviewResults;
  onStartNewInterview: () => void;
}

const InterviewResults = ({ results, onStartNewInterview }: InterviewResultsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const averageScore = Math.round(
    results.questions.reduce((sum, q) => sum + q.score, 0) / results.questions.length
  );

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
                  <p className={`text-2xl font-bold ${getScoreColor(results.overallScore)}`}>
                    {results.overallScore}%
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
                    {formatTime(results.duration)}
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
                    {results.questions.length}
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
                {results.questions.map((q, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          {getScoreIcon(q.score)}
                          <span className={`font-semibold ${getScoreColor(q.score)}`}>
                            {q.score}%
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          {q.question}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <p className="font-medium text-gray-700 mb-1">AI Evaluation:</p>
                      <p className="text-gray-600">{q.aiEvaluation}</p>
                    </div>
                    
                    <Progress value={q.score} className="h-2" />
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
                  <div className={`text-3xl font-bold ${getScoreColor(results.overallScore)} mb-2`}>
                    {results.overallScore}%
                  </div>
                  <Progress value={results.overallScore} className="h-3 mb-4" />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {results.feedback}
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="font-medium text-sm mb-2">Score Breakdown:</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>• Average Question Score: {averageScore}%</div>
                    <div>• Communication: {Math.min(results.overallScore + 5, 100)}%</div>
                    <div>• Content Quality: {Math.max(results.overallScore - 3, 0)}%</div>
                    <div>• Confidence: {Math.min(results.overallScore + 2, 100)}%</div>
                  </div>
                </div>
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
