
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WorkExperienceFormProps {
  userId: string | undefined;
}

interface WorkExperience {
  id?: string;
  company_name: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

const WorkExperienceForm = ({ userId }: WorkExperienceFormProps) => {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchExperiences();
    }
  }, [userId]);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from('work_experience')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (data && !error) {
      setExperiences(data);
    }
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      company_name: "",
      position: "",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: ""
    }]);
  };

  const removeExperience = async (index: number) => {
    const experience = experiences[index];
    if (experience.id) {
      await supabase.from('work_experience').delete().eq('id', experience.id);
    }
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const experience of experiences) {
        const expData = {
          user_id: userId,
          ...experience,
          updated_at: new Date().toISOString()
        };

        if (experience.id) {
          await supabase.from('work_experience').update(expData).eq('id', experience.id);
        } else {
          await supabase.from('work_experience').insert(expData);
        }
      }

      toast({
        title: "Success",
        description: "Work experience saved successfully.",
      });
      fetchExperiences();
    } catch (error) {
      console.error('Error saving work experience:', error);
      toast({
        title: "Error",
        description: "Failed to save work experience.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Work Experience</CardTitle>
        <CardDescription>Add your professional work experience</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {experiences.map((experience, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Experience {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeExperience(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={experience.company_name}
                    onChange={(e) => updateExperience(index, 'company_name', e.target.value)}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    value={experience.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    placeholder="Job Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={experience.location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={experience.start_date}
                    onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={experience.end_date}
                    onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                    disabled={experience.is_current}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`current-${index}`}
                    checked={experience.is_current}
                    onCheckedChange={(checked) => updateExperience(index, 'is_current', checked as boolean)}
                  />
                  <Label htmlFor={`current-${index}`}>Currently working here</Label>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={experience.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addExperience}>
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Work Experience"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkExperienceForm;
