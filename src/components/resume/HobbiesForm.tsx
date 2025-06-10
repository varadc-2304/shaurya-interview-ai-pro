
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HobbiesFormProps {
  userId: string | undefined;
}

interface Hobby {
  id?: string;
  activity_name: string;
  description: string;
}

const HobbiesForm = ({ userId }: HobbiesFormProps) => {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchHobbies();
    }
  }, [userId]);

  const fetchHobbies = async () => {
    const { data, error } = await supabase
      .from('hobbies_activities')
      .select('*')
      .eq('user_id', userId);

    if (data && !error) {
      setHobbies(data);
    }
  };

  const addHobby = () => {
    setHobbies([...hobbies, {
      activity_name: "",
      description: ""
    }]);
  };

  const removeHobby = async (index: number) => {
    const hobby = hobbies[index];
    if (hobby.id) {
      await supabase.from('hobbies_activities').delete().eq('id', hobby.id);
    }
    setHobbies(hobbies.filter((_, i) => i !== index));
  };

  const updateHobby = (index: number, field: keyof Hobby, value: string) => {
    const updated = [...hobbies];
    updated[index] = { ...updated[index], [field]: value };
    setHobbies(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const hobby of hobbies) {
        // Skip empty hobbies
        if (!hobby.activity_name.trim()) continue;

        const hobbyData = {
          user_id: userId,
          activity_name: hobby.activity_name,
          description: hobby.description
        };

        if (hobby.id) {
          await supabase.from('hobbies_activities').update(hobbyData).eq('id', hobby.id);
        } else {
          await supabase.from('hobbies_activities').insert(hobbyData);
        }
      }

      toast({
        title: "Success",
        description: "Hobbies and activities saved successfully.",
      });
      fetchHobbies();
    } catch (error) {
      console.error('Error saving hobbies:', error);
      toast({
        title: "Error",
        description: "Failed to save hobbies and activities.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Hobbies & Activities</CardTitle>
        <CardDescription>Add your hobbies, interests, and extracurricular activities</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {hobbies.map((hobby, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Activity {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeHobby(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Activity Name</Label>
                  <Input
                    value={hobby.activity_name}
                    onChange={(e) => updateHobby(index, 'activity_name', e.target.value)}
                    placeholder="Photography, Sports, Reading, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={hobby.description}
                    onChange={(e) => updateHobby(index, 'description', e.target.value)}
                    placeholder="Describe your involvement or interest"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addHobby}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hobby/Activity
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Hobbies & Activities"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default HobbiesForm;
