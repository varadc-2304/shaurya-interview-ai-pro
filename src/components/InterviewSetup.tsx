
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Building, Target, MessageSquare, Plus, Play } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold shaurya-text-gradient mb-3">Setup Your Interview</h1>
          <p className="text-muted-foreground text-lg">
            Configure your AI mock interview to match your target role and preferences
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Interview Configuration</span>
            </CardTitle>
            <CardDescription>
              Provide details about the position you're preparing for
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="jobRole" className="text-sm font-medium flex items-center space-x-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Job Role</span>
                  </Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Software Engineer, Product Manager"
                    value={config.jobRole}
                    onChange={(e) => setConfig({ ...config, jobRole: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-sm font-medium flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Domain/Industry</span>
                  </Label>
                  <Input
                    id="domain"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={config.domain}
                    onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Experience Level</Label>
                  <Select
                    value={config.experienceLevel}
                    onValueChange={(value) => setConfig({ ...config, experienceLevel: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                      <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Question Type</span>
                  </Label>
                  <Select
                    value={config.questionType}
                    onValueChange={(value) => setConfig({ ...config, questionType: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="mixed">Mixed (Behavioral + Technical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints" className="text-sm font-medium flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Additional Constraints</span>
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="constraints"
                  placeholder="e.g., Focus on system design, include coding challenges, emphasize leadership scenarios..."
                  value={config.additionalConstraints}
                  onChange={(e) => setConfig({ ...config, additionalConstraints: e.target.value })}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={!isFormValid}
                  className="w-full shaurya-gradient hover:opacity-90 transition-opacity h-12 text-base font-medium"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Interview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your interview will be tailored based on these preferences. 
            <br />
            You can always adjust settings before starting another interview.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
