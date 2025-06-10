
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface PositionsFormProps {
  userId: string;
}

interface Position {
  id?: string;
  position_title: string;
  organization: string;
  description: string;
  start_date: string;
  end_date: string;
}

const PositionsForm = ({ userId }: PositionsFormProps) => {
  const [positionsList, setPositionsList] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPositions();
  }, [userId]);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions_of_responsibility')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching positions:', error);
        return;
      }

      setPositionsList(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const addPosition = () => {
    setPositionsList([...positionsList, {
      position_title: '',
      organization: '',
      description: '',
      start_date: '',
      end_date: ''
    }]);
  };

  const removePosition = async (index: number) => {
    const position = positionsList[index];
    if (position.id) {
      try {
        const { error } = await supabase
          .from('positions_of_responsibility')
          .delete()
          .eq('id', position.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting position:', error);
        toast({
          title: "Error",
          description: "Failed to delete position.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = positionsList.filter((_, i) => i !== index);
    setPositionsList(newList);
  };

  const updatePosition = (index: number, field: keyof Position, value: string) => {
    const newList = [...positionsList];
    newList[index] = { ...newList[index], [field]: value };
    setPositionsList(newList);
  };

  const savePositions = async () => {
    setIsLoading(true);

    try {
      for (const position of positionsList) {
        const positionData = {
          user_id: userId,
          position_title: position.position_title,
          organization: position.organization,
          description: position.description,
          start_date: position.start_date || null,
          end_date: position.end_date || null
        };

        if (position.id) {
          const { error } = await supabase
            .from('positions_of_responsibility')
            .update(positionData)
            .eq('id', position.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('positions_of_responsibility')
            .insert(positionData);
          if (error) throw error;
        }
      }

      await fetchPositions();
      toast({
        title: "Success!",
        description: "Positions saved successfully.",
      });
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
    <Card>
      <CardHeader>
        <CardTitle>Positions of Responsibility</CardTitle>
        <CardDescription>Leadership roles and responsibilities you've held</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {positionsList.map((position, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Position {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removePosition(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Position Title</Label>
                  <Input
                    value={position.position_title}
                    onChange={(e) => updatePosition(index, 'position_title', e.target.value)}
                    placeholder="Team Lead, President, etc."
                  />
                </div>
                <div>
                  <Label>Organization</Label>
                  <Input
                    value={position.organization}
                    onChange={(e) => updatePosition(index, 'organization', e.target.value)}
                    placeholder="Organization or company name"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={position.start_date}
                    onChange={(e) => updatePosition(index, 'start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={position.end_date}
                    onChange={(e) => updatePosition(index, 'end_date', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={position.description}
                  onChange={(e) => updatePosition(index, 'description', e.target.value)}
                  placeholder="Key responsibilities and achievements in this role"
                  rows={4}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addPosition} className="flex items-center gap-2">
              <Plus size={16} />
              Add Position
            </Button>
            <Button onClick={savePositions} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionsForm;
