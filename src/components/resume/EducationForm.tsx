
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EducationFormProps {
  userId: string | undefined;
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
  const [educations, setEducations] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchEducations();
    }
  }, [userId]);

  const fetchEducations = async () => {
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (data && !error) {
      setEducations(data.map(edu => ({
        ...edu,
        gpa: edu.gpa?.toString() || ""
      })));
    }
  };

  const addEducation = () => {
    setEducations([...educations, {
      institution_name: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      gpa: "",
      description: ""
    }]);
  };

  const removeEducation = async (index: number) => {
    const education = educations[index];
    if (education.id) {
      await supabase.from('education').delete().eq('id', education.id);
    }
    setEducations(educations.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const education of educations) {
        const eduData = {
          user_id: userId,
          institution_name: education.institution_name,
          degree: education.degree,
          field_of_study: education.field_of_study,
          start_date: education.start_date || null,
          end_date: education.end_date || null,
          gpa: education.gpa ? parseFloat(education.gpa) : null,
          description: education.description,
          updated_at: new Date().toISOString()
        };

        if (education.id) {
          await supabase.from('education').update(eduData).eq('id', education.id);
        } else {
          await supabase.from('education').insert(eduData);
        }
      }

      toast({
        title: "Success",
        description: "Education information saved successfully.",
      });
      fetchEducations();
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
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <CardDescription>Add your educational background</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {educations.map((education, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Education {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeEducation(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution Name</Label>
                  <Input
                    value={education.institution_name}
                    onChange={(e) => updateEducation(index, 'institution_name', e.target.value)}
                    placeholder="University/College Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input
                    value={education.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    placeholder="Bachelor's, Master's, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={education.field_of_study}
                    onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                    placeholder="Computer Science, Business, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>GPA</Label>
                  <Input
                    value={education.gpa}
                    onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                    placeholder="3.8"
                    type="number"
                    step="0.01"
                    max="4.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={education.start_date}
                    onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={education.end_date}
                    onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={education.description}
                    onChange={(e) => updateEducation(index, 'description', e.target.value)}
                    placeholder="Relevant coursework, achievements, etc."
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addEducation}>
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Education"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EducationForm;
