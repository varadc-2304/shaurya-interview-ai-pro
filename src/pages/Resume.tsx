
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Sparkles, User, GraduationCap, Briefcase, Code, FolderOpen, Award, Star, Heart } from "lucide-react";
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

  const tabItems = [
    { value: "personal", label: "Personal", icon: User, color: "text-blue-600" },
    { value: "education", label: "Education", icon: GraduationCap, color: "text-green-600" },
    { value: "experience", label: "Experience", icon: Briefcase, color: "text-purple-600" },
    { value: "skills", label: "Skills", icon: Code, color: "text-orange-600" },
    { value: "projects", label: "Projects", icon: FolderOpen, color: "text-indigo-600" },
    { value: "positions", label: "Leadership", icon: Award, color: "text-red-600" },
    { value: "achievements", label: "Achievements", icon: Star, color: "text-yellow-600" },
    { value: "hobbies", label: "Hobbies", icon: Heart, color: "text-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-6">
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="flex items-center space-x-2 hover:bg-white/80 border-slate-200 shadow-sm"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Resume Builder
              </h1>
              <p className="text-slate-600 text-lg">Build your professional profile with ease</p>
            </div>
          </div>
          <Button 
            onClick={generateSummary} 
            disabled={isGeneratingSummary}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles size={16} />
            <span>{isGeneratingSummary ? "Generating..." : "Generate AI Summary"}</span>
          </Button>
        </div>

        {/* AI Summary Section */}
        {resumeSummary && (
          <Card className="mb-12 border-0 shadow-xl bg-gradient-to-r from-white to-blue-50/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-800">AI-Generated Summary</CardTitle>
                  <CardDescription className="text-slate-600">
                    Professional summary based on your resume data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-white/70 rounded-xl border border-slate-100">
                <p className="text-slate-700 leading-relaxed text-lg">{resumeSummary}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <Tabs defaultValue="personal" className="w-full">
            <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50 rounded-t-xl">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-transparent p-6 h-auto gap-2">
                {tabItems.map((item) => (
                  <TabsTrigger 
                    key={item.value}
                    value={item.value} 
                    className="flex flex-col items-center space-y-2 py-4 px-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-slate-200 rounded-xl transition-all duration-200 hover:bg-white/70"
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfoForm userId={user.id} />
              </TabsContent>

              <TabsContent value="education" className="mt-0">
                <EducationForm userId={user.id} />
              </TabsContent>

              <TabsContent value="experience" className="mt-0">
                <WorkExperienceForm userId={user.id} />
              </TabsContent>

              <TabsContent value="skills" className="mt-0">
                <SkillsForm userId={user.id} />
              </TabsContent>

              <TabsContent value="projects" className="mt-0">
                <ProjectsForm userId={user.id} />
              </TabsContent>

              <TabsContent value="positions" className="mt-0">
                <PositionsForm userId={user.id} />
              </TabsContent>

              <TabsContent value="achievements" className="mt-0">
                <AchievementsForm userId={user.id} />
              </TabsContent>

              <TabsContent value="hobbies" className="mt-0">
                <HobbiesForm userId={user.id} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Resume;
