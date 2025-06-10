
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface WorkExperienceFormProps {
  userId: string;
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
  const [experienceList, setExperienceList] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkExperience();
  }, [userId]);

  const fetchWorkExperience = async () => {
    try {
      const { data, error } = await supabase
        .from('work_experience')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching work experience:', error);
        return;
      }

      setExperienceList(data || []);
    } catch (error) {
      console.error('Error fetching work experience:', error);
    }
  };

  const addExperience = () => {
    setExperienceList([...experienceList, {
      company_name: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    }]);
  };

  const removeExperience = async (index: number) => {
    const experience = experienceList[index];
    if (experience.id) {
      try {
        const { error } = await supabase
          .from('work_experience')
          .delete()
          .eq('id', experience.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting work experience:', error);
        toast({
          title: "Error",
          description: "Failed to delete work experience entry.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = experienceList.filter((_, i) => i !== index);
    setExperienceList(newList);
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: string | boolean) => {
    const newList = [...experienceList];
    newList[index] = { ...newList[index], [field]: value };
    setExperienceList(newList);
  };

  const saveExperience = async () => {
    setIsLoading(true);

    try {
      for (const experience of experienceList) {
        const experienceData = {
          user_id: userId,
          company_name: experience.company_name,
          position: experience.position,
          location: experience.location,
          start_date: experience.start_date || null,
          end_date: experience.is_current ? null : (experience.end_date || null),
          is_current: experience.is_current,
          description: experience.description
        };

        if (experience.id) {
          const { error } = await supabase
            .from('work_experience')
            .update(experienceData)
            .eq('id', experience.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('work_experience')
            .insert(experienceData);
          if (error) throw error;
        }
      }

      await fetchWorkExperience();
      toast({
        title: "Success!",
        description: "Work experience saved successfully.",
      });
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
    <Card>
      <CardHeader>
        <CardTitle>Work Experience</CardTitle>
        <CardDescription>Your professional work history and experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {experienceList.map((experience, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Experience {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeExperience(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={experience.company_name}
                    onChange={(e) => updateExperience(index, 'company_name', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    value={experience.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={experience.location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                    placeholder="City, State/Country"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={experience.start_date}
                    onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
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
                {!experience.is_current && (
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={experience.end_date}
                      onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={experience.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  placeholder="Key responsibilities and achievements"
                  rows={4}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addExperience} className="flex items-center gap-2">
              <Plus size={16} />
              Add Experience
            </Button>
            <Button onClick={saveExperience} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkExperienceForm;
