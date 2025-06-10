
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Sparkles } from "lucide-react";
import PersonalInfoForm from "@/components/resume/PersonalInfoForm";
import EducationForm from "@/components/resume/EducationForm";
import WorkExperienceForm from "@/components/resume/WorkExperienceForm";
import SkillsForm from "@/components/resume/SkillsForm";
import ProjectsForm from "@/components/resume/ProjectsForm";
import PositionsForm from "@/components/resume/PositionsForm";
import AchievementsForm from "@/components/resume/AchievementsForm";
import HobbiesForm from "@/components/resume/HobbiesForm";

interface ResumeProps {
  onBack: () => void;
  user: { id: string; email: string; name: string; role: string };
}

const Resume = ({ onBack, user }: ResumeProps) => {
  const [resumeSummary, setResumeSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchResumeSummary();
  }, [user.id]);

  const fetchResumeSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_summary')
        .select('summary_text')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching resume summary:', error);
        return;
      }

      if (data) {
        setResumeSummary(data.summary_text);
      }
    } catch (error) {
      console.error('Error fetching resume summary:', error);
    }
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume-summary', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      if (data?.summary) {
        setResumeSummary(data.summary);
        toast({
          title: "Summary Generated!",
          description: "Your resume summary has been created and saved.",
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate resume summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Resume</h1>
              <p className="text-muted-foreground">Build and manage your professional profile</p>
            </div>
          </div>
          <Button 
            onClick={generateSummary} 
            disabled={isGeneratingSummary}
            className="flex items-center space-x-2 shaurya-gradient"
          >
            <Sparkles size={16} />
            <span>{isGeneratingSummary ? "Generating..." : "Generate AI Summary"}</span>
          </Button>
        </div>

        {resumeSummary && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI-Generated Summary</CardTitle>
              <CardDescription>Professional summary based on your resume data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{resumeSummary}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalInfoForm userId={user.id} />
          </TabsContent>

          <TabsContent value="education">
            <EducationForm userId={user.id} />
          </TabsContent>

          <TabsContent value="experience">
            <WorkExperienceForm userId={user.id} />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsForm userId={user.id} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsForm userId={user.id} />
          </TabsContent>

          <TabsContent value="positions">
            <PositionsForm userId={user.id} />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsForm userId={user.id} />
          </TabsContent>

          <TabsContent value="hobbies">
            <HobbiesForm userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Resume;
