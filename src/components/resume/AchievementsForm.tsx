
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface AchievementsFormProps {
  userId: string;
}

interface Achievement {
  id?: string;
  achievement_title: string;
  description: string;
  issuing_organization: string;
  date_achieved: string;
}

const AchievementsForm = ({ userId }: AchievementsFormProps) => {
  const [achievementsList, setAchievementsList] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      console.log('Fetching achievements for user:', userId);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('date_achieved', { ascending: false });

      if (error) {
        console.error('Error fetching achievements:', error);
        toast({
          title: "Error",
          description: "Failed to fetch achievements.",
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched achievements:', data);
      setAchievementsList(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch achievements.",
        variant: "destructive"
      });
    }
  };

  const addAchievement = () => {
    setAchievementsList([...achievementsList, {
      achievement_title: '',
      description: '',
      issuing_organization: '',
      date_achieved: ''
    }]);
  };

  const removeAchievement = async (index: number) => {
    const achievement = achievementsList[index];
    if (achievement.id) {
      try {
        console.log('Deleting achievement with id:', achievement.id);
        const { error } = await supabase
          .from('achievements')
          .delete()
          .eq('id', achievement.id);

        if (error) {
          console.error('Error deleting achievement:', error);
          throw error;
        }
        
        console.log('Achievement deleted successfully');
      } catch (error) {
        console.error('Error deleting achievement:', error);
        toast({
          title: "Error",
          description: "Failed to delete achievement.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = achievementsList.filter((_, i) => i !== index);
    setAchievementsList(newList);
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const newList = [...achievementsList];
    newList[index] = { ...newList[index], [field]: value };
    setAchievementsList(newList);
  };

  const saveAchievements = async () => {
    setIsLoading(true);
    console.log('Saving achievements for user:', userId);
    console.log('Achievements to save:', achievementsList);

    try {
      for (const achievement of achievementsList) {
        // Skip empty achievements
        if (!achievement.achievement_title.trim()) {
          console.log('Skipping empty achievement');
          continue;
        }

        const achievementData = {
          user_id: userId,
          achievement_title: achievement.achievement_title,
          description: achievement.description,
          issuing_organization: achievement.issuing_organization,
          date_achieved: achievement.date_achieved || null
        };

        console.log('Saving achievement data:', achievementData);

        if (achievement.id) {
          const { error } = await supabase
            .from('achievements')
            .update(achievementData)
            .eq('id', achievement.id);
          
          if (error) {
            console.error('Error updating achievement:', error);
            throw error;
          }
          console.log('Achievement updated successfully');
        } else {
          const { data, error } = await supabase
            .from('achievements')
            .insert(achievementData)
            .select();
          
          if (error) {
            console.error('Error inserting achievement:', error);
            throw error;
          }
          console.log('Achievement inserted successfully:', data);
        }
      }

      await fetchAchievements();
      toast({
        title: "Success!",
        description: "Achievements saved successfully.",
      });
    } catch (error) {
      console.error('Error saving achievements:', error);
      toast({
        title: "Error",
        description: `Failed to save achievements: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>Awards, certifications, and notable accomplishments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {achievementsList.map((achievement, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Achievement {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAchievement(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Achievement Title</Label>
                  <Input
                    value={achievement.achievement_title}
                    onChange={(e) => updateAchievement(index, 'achievement_title', e.target.value)}
                    placeholder="Award name or certification"
                  />
                </div>
                <div>
                  <Label>Issuing Organization</Label>
                  <Input
                    value={achievement.issuing_organization}
                    onChange={(e) => updateAchievement(index, 'issuing_organization', e.target.value)}
                    placeholder="Organization that issued the award"
                  />
                </div>
                <div>
                  <Label>Date Achieved</Label>
                  <Input
                    type="date"
                    value={achievement.date_achieved}
                    onChange={(e) => updateAchievement(index, 'date_achieved', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={achievement.description}
                  onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                  placeholder="Description of the achievement and its significance"
                  rows={3}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addAchievement} className="flex items-center gap-2">
              <Plus size={16} />
              Add Achievement
            </Button>
            <Button onClick={saveAchievements} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsForm;
