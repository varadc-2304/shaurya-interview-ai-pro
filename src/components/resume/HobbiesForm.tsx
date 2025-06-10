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
  userId: string;
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
    console.log('Fetching hobbies for user:', userId);
    try {
      const { data, error } = await supabase
        .from('hobbies_activities')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching hobbies:', error);
      } else {
        console.log('Fetched hobbies:', data);
        setHobbies(data || []);
      }
    } catch (error) {
      console.error('Error in fetchHobbies:', error);
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
      console.log('Deleting hobby with id:', hobby.id);
      const { error } = await supabase.from('hobbies_activities').delete().eq('id', hobby.id);
      if (error) {
        console.error('Error deleting hobby:', error);
        toast({
          title: "Error",
          description: "Failed to delete hobby.",
          variant: "destructive"
        });
        return;
      }
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
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Saving hobbies:', hobbies);

    try {
      // First, delete all existing hobbies for this user
      await supabase.from('hobbies_activities').delete().eq('user_id', userId);

      // Then insert all current hobbies (non-empty ones)
      const hobbiesToInsert = hobbies
        .filter(hobby => hobby.activity_name.trim())
        .map(hobby => ({
          user_id: userId,
          activity_name: hobby.activity_name.trim(),
          description: hobby.description.trim() || null
        }));

      if (hobbiesToInsert.length > 0) {
        console.log('Inserting hobbies:', hobbiesToInsert);
        const { error } = await supabase
          .from('hobbies_activities')
          .insert(hobbiesToInsert);
        
        if (error) {
          console.error('Error inserting hobbies:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "Hobbies and activities saved successfully.",
      });
      
      // Refresh the data
      await fetchHobbies();
    } catch (error) {
      console.error('Error saving hobbies:', error);
      toast({
        title: "Error",
        description: "Failed to save hobbies and activities. Please try again.",
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
