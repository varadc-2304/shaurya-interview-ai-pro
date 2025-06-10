
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SkillsFormProps {
  userId: string | undefined;
}

interface Skill {
  id?: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: string;
}

const SkillsForm = ({ userId }: SkillsFormProps) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = ["Programming", "Tools", "Languages", "Frameworks", "Databases", "Other"];
  const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    if (userId) {
      fetchSkills();
    }
  }, [userId]);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('resume_skills')
      .select('*')
      .eq('user_id', userId);

    if (data && !error) {
      setSkills(data);
    }
  };

  const addSkill = () => {
    setSkills([...skills, {
      skill_name: "",
      skill_category: "",
      proficiency_level: ""
    }]);
  };

  const removeSkill = async (index: number) => {
    const skill = skills[index];
    if (skill.id) {
      await supabase.from('resume_skills').delete().eq('id', skill.id);
    }
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const skill of skills) {
        // Skip empty skills
        if (!skill.skill_name.trim()) continue;

        const skillData = {
          user_id: userId,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          proficiency_level: skill.proficiency_level
        };

        if (skill.id) {
          await supabase.from('resume_skills').update(skillData).eq('id', skill.id);
        } else {
          await supabase.from('resume_skills').insert(skillData);
        }
      }

      toast({
        title: "Success",
        description: "Skills saved successfully.",
      });
      fetchSkills();
    } catch (error) {
      console.error('Error saving skills:', error);
      toast({
        title: "Error",
        description: "Failed to save skills.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Add your technical and professional skills</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {skills.map((skill, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Skill {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSkill(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Skill Name</Label>
                  <Input
                    value={skill.skill_name}
                    onChange={(e) => updateSkill(index, 'skill_name', e.target.value)}
                    placeholder="JavaScript, Python, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={skill.skill_category} onValueChange={(value) => updateSkill(index, 'skill_category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proficiency Level</Label>
                  <Select value={skill.proficiency_level} onValueChange={(value) => updateSkill(index, 'proficiency_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {proficiencyLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addSkill}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Skills"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SkillsForm;
