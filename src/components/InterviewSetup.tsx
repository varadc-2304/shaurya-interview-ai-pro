
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Building, Target, MessageSquare, Plus, Play, Sparkles, Clock, Users, Trophy } from "lucide-react";

interface InterviewSetupProps {
  onStartInterview: (config: InterviewConfig) => void;
}

export interface InterviewConfig {
  jobRole: string;
  domain: string;
  experienceLevel: string;
  questionType: string;
  additionalConstraints: string;
}

const InterviewSetup = ({ onStartInterview }: InterviewSetupProps) => {
  const [config, setConfig] = useState<InterviewConfig>({
    jobRole: "",
    domain: "",
    experienceLevel: "",
    questionType: "",
    additionalConstraints: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview(config);
  };

  const isFormValid = config.jobRole && config.domain && config.experienceLevel && config.questionType;

  const features = [
    {
      icon: Clock,
      title: "Real-time AI Analysis",
      description: "Get instant feedback on your responses"
    },
    {
      icon: Users,
      title: "Industry-specific Questions",
      description: "Tailored questions for your target role"
    },
    {
      icon: Trophy,
      title: "Performance Tracking",
      description: "Monitor your progress over time"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10 px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg animate-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold shaurya-text-gradient mb-6 leading-tight">
            AI Mock Interview
            <span className="block text-4xl md:text-5xl mt-2">Setup</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Configure your personalized AI interview experience. Our advanced AI will create 
            tailored questions based on your target role and provide real-time feedback.
          </p>
        </div>

        {/* Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Configuration Card */}
        <Card className="glass border-0 shadow-2xl backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="space-y-1 pb-8 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-t-lg">
            <CardTitle className="text-2xl md:text-3xl flex items-center justify-center space-x-3 text-gray-800">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span>Interview Configuration</span>
            </CardTitle>
            <CardDescription className="text-center text-lg text-gray-600">
              Customize every aspect of your interview experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Job Role and Domain Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="jobRole" className="text-base font-semibold flex items-center space-x-2 text-gray-700">
                    <div className="bg-blue-100 p-1.5 rounded-md">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Target Job Role</span>
                  </Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Senior Software Engineer, Product Manager"
                    value={config.jobRole}
                    onChange={(e) => setConfig({ ...config, jobRole: e.target.value })}
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="domain" className="text-base font-semibold flex items-center space-x-2 text-gray-700">
                    <div className="bg-purple-100 p-1.5 rounded-md">
                      <Building className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Industry/Domain</span>
                  </Label>
                  <Input
                    id="domain"
                    placeholder="e.g., Technology, Healthcare, Finance, E-commerce"
                    value={config.domain}
                    onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                    className="h-12 text-base border-2 border-gray-200 focus:border-purple-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Experience and Question Type Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center space-x-2 text-gray-700">
                    <div className="bg-green-100 p-1.5 rounded-md">
                      <Trophy className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Experience Level</span>
                  </Label>
                  <Select
                    value={config.experienceLevel}
                    onValueChange={(value) => setConfig({ ...config, experienceLevel: value })}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-green-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">🌱 Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">🚀 Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">⭐ Senior Level (6-10 years)</SelectItem>
                      <SelectItem value="lead">👑 Lead/Principal (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center space-x-2 text-gray-700">
                    <div className="bg-orange-100 p-1.5 rounded-md">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                    </div>
                    <span>Interview Focus</span>
                  </Label>
                  <Select
                    value={config.questionType}
                    onValueChange={(value) => setConfig({ ...config, questionType: value })}
                  >
                    <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-orange-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm">
                      <SelectValue placeholder="Choose question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">💬 Behavioral Questions</SelectItem>
                      <SelectItem value="technical">⚡ Technical Questions</SelectItem>
                      <SelectItem value="mixed">🎯 Mixed (Behavioral + Technical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Constraints */}
              <div className="space-y-3">
                <Label htmlFor="constraints" className="text-base font-semibold flex items-center space-x-2 text-gray-700">
                  <div className="bg-indigo-100 p-1.5 rounded-md">
                    <Plus className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span>Additional Preferences</span>
                  <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="constraints"
                  placeholder="e.g., Focus on system design, include coding challenges, emphasize leadership scenarios, discuss specific technologies like React/Node.js..."
                  value={config.additionalConstraints}
                  onChange={(e) => setConfig({ ...config, additionalConstraints: e.target.value })}
                  className="min-h-[120px] resize-none text-base border-2 border-gray-200 focus:border-indigo-500 transition-colors duration-200 bg-white/70 backdrop-blur-sm"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={!isFormValid}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Play className="mr-3 h-5 w-5" />
                  Start Your AI Interview
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <p className="text-gray-600 leading-relaxed">
              🎯 <strong>Pro Tip:</strong> Your interview will be dynamically generated based on these preferences. 
              <br />
              The AI will adapt questions in real-time based on your responses for a truly personalized experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
