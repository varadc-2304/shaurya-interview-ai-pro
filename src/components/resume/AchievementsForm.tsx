
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AchievementsFormProps {
  userId: string | undefined;
}

interface Achievement {
  id?: string;
  achievement_title: string;
  description: string;
  date_achieved: string;
  issuing_organization: string;
}

const AchievementsForm = ({ userId }: AchievementsFormProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    }
  }, [userId]);

  const fetchAchievements = async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('date_achieved', { ascending: false });

    if (data && !error) {
      setAchievements(data);
    }
  };

  const addAchievement = () => {
    setAchievements([...achievements, {
      achievement_title: "",
      description: "",
      date_achieved: "",
      issuing_organization: ""
    }]);
  };

  const removeAchievement = async (index: number) => {
    const achievement = achievements[index];
    if (achievement.id) {
      await supabase.from('achievements').delete().eq('id', achievement.id);
    }
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const updated = [...achievements];
    updated[index] = { ...updated[index], [field]: value };
    setAchievements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const achievement of achievements) {
        const achievementData = {
          user_id: userId,
          ...achievement
        };

        if (achievement.id) {
          await supabase.from('achievements').update(achievementData).eq('id', achievement.id);
        } else {
          await supabase.from('achievements').insert(achievementData);
        }
      }

      toast({
        title: "Success",
        description: "Achievements saved successfully.",
      });
      fetchAchievements();
    } catch (error) {
      console.error('Error saving achievements:', error);
      toast({
        title: "Error",
        description: "Failed to save achievements.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>Add your awards, certifications, and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {achievements.map((achievement, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Achievement {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAchievement(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Achievement Title</Label>
                  <Input
                    value={achievement.achievement_title}
                    onChange={(e) => updateAchievement(index, 'achievement_title', e.target.value)}
                    placeholder="Award, Certification, or Achievement"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date Achieved</Label>
                  <Input
                    type="date"
                    value={achievement.date_achieved}
                    onChange={(e) => updateAchievement(index, 'date_achieved', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issuing Organization</Label>
                  <Input
                    value={achievement.issuing_organization}
                    onChange={(e) => updateAchievement(index, 'issuing_organization', e.target.value)}
                    placeholder="University, Company, etc."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={achievement.description}
                    onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                    placeholder="Describe the achievement"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addAchievement}>
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Achievements"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AchievementsForm;
