
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface EducationFormProps {
  userId: string;
}

interface Education {
  id?: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
  description: string;
}

const EducationForm = ({ userId }: EducationFormProps) => {
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEducation();
  }, [userId]);

  const fetchEducation = async () => {
    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching education:', error);
        return;
      }

      setEducationList(data || []);
    } catch (error) {
      console.error('Error fetching education:', error);
    }
  };

  const addEducation = () => {
    setEducationList([...educationList, {
      institution_name: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      gpa: '',
      description: ''
    }]);
  };

  const removeEducation = async (index: number) => {
    const education = educationList[index];
    if (education.id) {
      try {
        const { error } = await supabase
          .from('education')
          .delete()
          .eq('id', education.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting education:', error);
        toast({
          title: "Error",
          description: "Failed to delete education entry.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = educationList.filter((_, i) => i !== index);
    setEducationList(newList);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newList = [...educationList];
    newList[index] = { ...newList[index], [field]: value };
    setEducationList(newList);
  };

  const saveEducation = async () => {
    setIsLoading(true);

    try {
      for (const education of educationList) {
        const educationData = {
          user_id: userId,
          institution_name: education.institution_name,
          degree: education.degree,
          field_of_study: education.field_of_study,
          start_date: education.start_date || null,
          end_date: education.end_date || null,
          gpa: education.gpa ? parseFloat(education.gpa) : null,
          description: education.description
        };

        if (education.id) {
          const { error } = await supabase
            .from('education')
            .update(educationData)
            .eq('id', education.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('education')
            .insert(educationData);
          if (error) throw error;
        }
      }

      await fetchEducation();
      toast({
        title: "Success!",
        description: "Education information saved successfully.",
      });
    } catch (error) {
      console.error('Error saving education:', error);
      toast({
        title: "Error",
        description: "Failed to save education information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <CardDescription>Your educational background and qualifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {educationList.map((education, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Education {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Institution Name</Label>
                  <Input
                    value={education.institution_name}
                    onChange={(e) => updateEducation(index, 'institution_name', e.target.value)}
                    placeholder="University/College name"
                  />
                </div>
                <div>
                  <Label>Degree</Label>
                  <Input
                    value={education.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    placeholder="Bachelor's, Master's, etc."
                  />
                </div>
                <div>
                  <Label>Field of Study</Label>
                  <Input
                    value={education.field_of_study}
                    onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                    placeholder="Computer Science, Engineering, etc."
                  />
                </div>
                <div>
                  <Label>GPA</Label>
                  <Input
                    value={education.gpa}
                    onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                    placeholder="3.8"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={education.start_date}
                    onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={education.end_date}
                    onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={education.description}
                  onChange={(e) => updateEducation(index, 'description', e.target.value)}
                  placeholder="Relevant coursework, achievements, etc."
                  rows={3}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addEducation} className="flex items-center gap-2">
              <Plus size={16} />
              Add Education
            </Button>
            <Button onClick={saveEducation} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationForm;
