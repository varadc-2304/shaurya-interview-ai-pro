
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface HobbiesFormProps {
  userId: string;
}

interface Hobby {
  id?: string;
  activity_name: string;
  description: string;
}

const HobbiesForm = ({ userId }: HobbiesFormProps) => {
  const [hobbiesList, setHobbiesList] = useState<Hobby[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHobbies();
  }, [userId]);

  const fetchHobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('hobbies_activities')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching hobbies:', error);
        return;
      }

      setHobbiesList(data || []);
    } catch (error) {
      console.error('Error fetching hobbies:', error);
    }
  };

  const addHobby = () => {
    setHobbiesList([...hobbiesList, {
      activity_name: '',
      description: ''
    }]);
  };

  const removeHobby = async (index: number) => {
    const hobby = hobbiesList[index];
    if (hobby.id) {
      try {
        const { error } = await supabase
          .from('hobbies_activities')
          .delete()
          .eq('id', hobby.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting hobby:', error);
        toast({
          title: "Error",
          description: "Failed to delete hobby.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = hobbiesList.filter((_, i) => i !== index);
    setHobbiesList(newList);
  };

  const updateHobby = (index: number, field: keyof Hobby, value: string) => {
    const newList = [...hobbiesList];
    newList[index] = { ...newList[index], [field]: value };
    setHobbiesList(newList);
  };

  const saveHobbies = async () => {
    setIsLoading(true);

    try {
      for (const hobby of hobbiesList) {
        const hobbyData = {
          user_id: userId,
          activity_name: hobby.activity_name,
          description: hobby.description
        };

        if (hobby.id) {
          const { error } = await supabase
            .from('hobbies_activities')
            .update(hobbyData)
            .eq('id', hobby.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('hobbies_activities')
            .insert(hobbyData);
          if (error) throw error;
        }
      }

      await fetchHobbies();
      toast({
        title: "Success!",
        description: "Hobbies and activities saved successfully.",
      });
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
    <Card>
      <CardHeader>
        <CardTitle>Hobbies & Activities</CardTitle>
        <CardDescription>Your interests and extracurricular activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {hobbiesList.map((hobby, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Activity {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeHobby(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Activity Name</Label>
                  <Input
                    value={hobby.activity_name}
                    onChange={(e) => updateHobby(index, 'activity_name', e.target.value)}
                    placeholder="Photography, Reading, Sports, etc."
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={hobby.description}
                    onChange={(e) => updateHobby(index, 'description', e.target.value)}
                    placeholder="Brief description of your involvement and achievements"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addHobby} className="flex items-center gap-2">
              <Plus size={16} />
              Add Hobby/Activity
            </Button>
            <Button onClick={saveHobbies} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HobbiesForm;
