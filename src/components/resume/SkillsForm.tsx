
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface SkillsFormProps {
  userId: string;
}

interface Skill {
  id?: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: string;
}

const SkillsForm = ({ userId }: SkillsFormProps) => {
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSkills();
  }, [userId]);

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_skills')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching skills:', error);
        return;
      }

      setSkillsList(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const addSkill = () => {
    setSkillsList([...skillsList, {
      skill_name: '',
      skill_category: '',
      proficiency_level: ''
    }]);
  };

  const removeSkill = async (index: number) => {
    const skill = skillsList[index];
    if (skill.id) {
      try {
        const { error } = await supabase
          .from('resume_skills')
          .delete()
          .eq('id', skill.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting skill:', error);
        toast({
          title: "Error",
          description: "Failed to delete skill.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = skillsList.filter((_, i) => i !== index);
    setSkillsList(newList);
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const newList = [...skillsList];
    newList[index] = { ...newList[index], [field]: value };
    setSkillsList(newList);
  };

  const saveSkills = async () => {
    setIsLoading(true);

    try {
      for (const skill of skillsList) {
        const skillData = {
          user_id: userId,
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          proficiency_level: skill.proficiency_level
        };

        if (skill.id) {
          const { error } = await supabase
            .from('resume_skills')
            .update(skillData)
            .eq('id', skill.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('resume_skills')
            .insert(skillData);
          if (error) throw error;
        }
      }

      await fetchSkills();
      toast({
        title: "Success!",
        description: "Skills saved successfully.",
      });
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
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Your technical and professional skills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {skillsList.map((skill, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Skill {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSkill(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Skill Name</Label>
                  <Input
                    value={skill.skill_name}
                    onChange={(e) => updateSkill(index, 'skill_name', e.target.value)}
                    placeholder="React, Python, Leadership, etc."
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={skill.skill_category} onValueChange={(value) => updateSkill(index, 'skill_category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="framework">Framework</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="soft-skills">Soft Skills</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Proficiency Level</Label>
                  <Select value={skill.proficiency_level} onValueChange={(value) => updateSkill(index, 'proficiency_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addSkill} className="flex items-center gap-2">
              <Plus size={16} />
              Add Skill
            </Button>
            <Button onClick={saveSkills} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsForm;
