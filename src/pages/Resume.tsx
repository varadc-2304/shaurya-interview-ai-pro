
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, Briefcase, Code, FolderOpen, Award, Trophy, Heart, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonalInfoForm from "@/components/resume/PersonalInfoForm";
import EducationForm from "@/components/resume/EducationForm";
import WorkExperienceForm from "@/components/resume/WorkExperienceForm";
import SkillsForm from "@/components/resume/SkillsForm";
import ProjectsForm from "@/components/resume/ProjectsForm";
import PositionsForm from "@/components/resume/PositionsForm";
import AchievementsForm from "@/components/resume/AchievementsForm";
import HobbiesForm from "@/components/resume/HobbiesForm";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const Resume = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeSummary, setResumeSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user data exists in localStorage (from the custom auth system)
    const userData = localStorage.getItem('currentUser');
    console.log('Checking localStorage for user data:', userData);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Found user in localStorage:', user);
        setCurrentUser(user);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        setIsLoading(false);
      }
    } else {
      console.log('No user data found in localStorage');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchResumeSummary();
    }
  }, [currentUser]);

  const fetchResumeSummary = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('resume_summary')
        .select('summary_text')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching resume summary:', error);
      } else if (data) {
        setResumeSummary(data.summary_text);
      }
    } catch (error) {
      console.error('Error in fetchResumeSummary:', error);
    }
  };

  const generateSummary = async () => {
    if (!currentUser?.id) return;

    try {
      setIsGeneratingSummary(true);
      
      const { data, error } = await supabase.functions.invoke('generate-resume-summary', {
        body: { userId: currentUser.id }
      });

      if (error) throw error;

      setResumeSummary(data.summary);
      toast({
        title: "Summary Generated",
        description: "Your resume summary has been generated successfully.",
      });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your resume...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              Please log in to access your resume builder. <a href="/" className="text-primary hover:underline">Go to login</a>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold shaurya-text-gradient">Resume Builder</h1>
          <p className="text-muted-foreground">Build your comprehensive resume for better interview preparation</p>
        </div>

        {/* AI Summary Card */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>AI-Generated Resume Summary</span>
            </CardTitle>
            <CardDescription>
              Generate a professional summary of your resume data using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeSummary ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed">{resumeSummary}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No summary generated yet</p>
            )}
            <Button 
              onClick={generateSummary}
              disabled={isGeneratingSummary}
              className="shaurya-gradient hover:opacity-90"
            >
              {isGeneratingSummary ? "Generating..." : "Generate AI Summary"}
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="personal" className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center space-x-1">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center space-x-1">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Work</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center space-x-1">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-1">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center space-x-1">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Leadership</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-1">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Awards</span>
            </TabsTrigger>
            <TabsTrigger value="hobbies" className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Hobbies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalInfoForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="education">
            <EducationForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="work">
            <WorkExperienceForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="positions">
            <PositionsForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsForm userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="hobbies">
            <HobbiesForm userId={currentUser.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Resume;
