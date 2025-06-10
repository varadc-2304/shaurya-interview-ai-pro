
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Play, ChevronRight } from "lucide-react";

interface InterviewSetupProps {
  onStartInterview: (config: InterviewConfig) => void;
}

export interface InterviewConfig {
  jobRole: string;
  domain: string;
  experienceLevel: string;
  questionType: string;
  additionalConstraints: string;
  companyType: string;
  interviewDuration: string;
  focusAreas: string[];
}

const InterviewSetup = ({ onStartInterview }: InterviewSetupProps) => {
  const [config, setConfig] = useState<InterviewConfig>({
    jobRole: "",
    domain: "",
    experienceLevel: "",
    questionType: "",
    additionalConstraints: "",
    companyType: "",
    interviewDuration: "",
    focusAreas: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview(config);
  };

  const handleFocusAreaToggle = (area: string) => {
    setConfig(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const isFormValid = config.jobRole && config.domain && config.experienceLevel && config.questionType && config.companyType && config.interviewDuration;

  const focusAreaOptions = [
    "Leadership", "Problem Solving", "Technical Skills", "Communication",
    "Team Collaboration", "System Design", "Project Management", "Innovation"
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-foreground mb-4">
            Interview <span className="font-medium">Setup</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Configure your personalized AI mock interview experience
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl font-light text-center">Interview Details</CardTitle>
            <CardDescription className="text-center text-base">
              Help us create the perfect interview scenario for you
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="jobRole" className="text-sm font-medium text-foreground">
                      Target Role
                    </Label>
                    <Input
                      id="jobRole"
                      placeholder="e.g., Senior Software Engineer"
                      value={config.jobRole}
                      onChange={(e) => setConfig({ ...config, jobRole: e.target.value })}
                      className="h-12 bg-background/80 border-border/50 focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="domain" className="text-sm font-medium text-foreground">
                      Industry/Domain
                    </Label>
                    <Input
                      id="domain"
                      placeholder="e.g., Financial Technology"
                      value={config.domain}
                      onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                      className="h-12 bg-background/80 border-border/50 focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Experience Level</Label>
                    <Select
                      value={config.experienceLevel}
                      onValueChange={(value) => setConfig({ ...config, experienceLevel: value })}
                    >
                      <SelectTrigger className="h-12 bg-background/80 border-border/50">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                        <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Company Type</Label>
                    <Select
                      value={config.companyType}
                      onValueChange={(value) => setConfig({ ...config, companyType: value })}
                    >
                      <SelectTrigger className="h-12 bg-background/80 border-border/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="mid-size">Mid-size Company</SelectItem>
                        <SelectItem value="enterprise">Enterprise/Fortune 500</SelectItem>
                        <SelectItem value="consulting">Consulting Firm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Duration</Label>
                    <Select
                      value={config.interviewDuration}
                      onValueChange={(value) => setConfig({ ...config, interviewDuration: value })}
                    >
                      <SelectTrigger className="h-12 bg-background/80 border-border/50">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Interview Type</Label>
                  <Select
                    value={config.questionType}
                    onValueChange={(value) => setConfig({ ...config, questionType: value })}
                  >
                    <SelectTrigger className="h-12 bg-background/80 border-border/50">
                      <SelectValue placeholder="Select interview type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral Questions</SelectItem>
                      <SelectItem value="technical">Technical Assessment</SelectItem>
                      <SelectItem value="mixed">Comprehensive (Behavioral + Technical)</SelectItem>
                      <SelectItem value="case-study">Case Study Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-foreground">Focus Areas (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {focusAreaOptions.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleFocusAreaToggle(area)}
                      className={`px-4 py-3 text-sm rounded-lg border transition-all ${
                        config.focusAreas.includes(area)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background/80 text-muted-foreground border-border/50 hover:border-primary/30'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-3">
                <Label htmlFor="constraints" className="text-sm font-medium text-foreground">
                  Additional Notes
                  <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                </Label>
                <Textarea
                  id="constraints"
                  placeholder="Any specific areas you'd like to focus on or particular scenarios you want to practice..."
                  value={config.additionalConstraints}
                  onChange={(e) => setConfig({ ...config, additionalConstraints: e.target.value })}
                  className="min-h-[100px] bg-background/80 border-border/50 focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={!isFormValid}
                  className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                >
                  <Play className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  Start Interview
                  <ChevronRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your interview will be personalized based on these preferences
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
