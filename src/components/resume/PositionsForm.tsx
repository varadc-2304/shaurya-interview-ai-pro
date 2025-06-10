
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PositionsFormProps {
  userId: string | undefined;
}

interface Position {
  id?: string;
  position_title: string;
  organization: string;
  start_date: string;
  end_date: string;
  description: string;
}

const PositionsForm = ({ userId }: PositionsFormProps) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPositions();
    }
  }, [userId]);

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from('positions_of_responsibility')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (data && !error) {
      setPositions(data);
    }
  };

  const addPosition = () => {
    setPositions([...positions, {
      position_title: "",
      organization: "",
      start_date: "",
      end_date: "",
      description: ""
    }]);
  };

  const removePosition = async (index: number) => {
    const position = positions[index];
    if (position.id) {
      await supabase.from('positions_of_responsibility').delete().eq('id', position.id);
    }
    setPositions(positions.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, field: keyof Position, value: string) => {
    const updated = [...positions];
    updated[index] = { ...updated[index], [field]: value };
    setPositions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const position of positions) {
        const positionData = {
          user_id: userId,
          ...position,
          updated_at: new Date().toISOString()
        };

        if (position.id) {
          await supabase.from('positions_of_responsibility').update(positionData).eq('id', position.id);
        } else {
          await supabase.from('positions_of_responsibility').insert(positionData);
        }
      }

      toast({
        title: "Success",
        description: "Positions saved successfully.",
      });
      fetchPositions();
    } catch (error) {
      console.error('Error saving positions:', error);
      toast({
        title: "Error",
        description: "Failed to save positions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Positions of Responsibility</CardTitle>
        <CardDescription>Add leadership roles and positions of responsibility</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {positions.map((position, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Position {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePosition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position Title</Label>
                  <Input
                    value={position.position_title}
                    onChange={(e) => updatePosition(index, 'position_title', e.target.value)}
                    placeholder="Team Lead, President, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input
                    value={position.organization}
                    onChange={(e) => updatePosition(index, 'organization', e.target.value)}
                    placeholder="Company, Club, Committee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={position.start_date}
                    onChange={(e) => updatePosition(index, 'start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={position.end_date}
                    onChange={(e) => updatePosition(index, 'end_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={position.description}
                    onChange={(e) => updatePosition(index, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addPosition}>
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Positions"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PositionsForm;
