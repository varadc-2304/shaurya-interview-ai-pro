
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface ProjectsFormProps {
  userId: string;
}

interface Project {
  id?: string;
  project_name: string;
  description: string;
  technologies_used: string[];
  start_date: string;
  end_date: string;
  project_url: string;
  github_url: string;
}

const ProjectsForm = ({ userId }: ProjectsFormProps) => {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjectsList(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const addProject = () => {
    setProjectsList([...projectsList, {
      project_name: '',
      description: '',
      technologies_used: [],
      start_date: '',
      end_date: '',
      project_url: '',
      github_url: ''
    }]);
  };

  const removeProject = async (index: number) => {
    const project = projectsList[index];
    if (project.id) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting project:', error);
        toast({
          title: "Error",
          description: "Failed to delete project.",
          variant: "destructive"
        });
        return;
      }
    }

    const newList = projectsList.filter((_, i) => i !== index);
    setProjectsList(newList);
  };

  const updateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const newList = [...projectsList];
    newList[index] = { ...newList[index], [field]: value };
    setProjectsList(newList);
  };

  const saveProjects = async () => {
    setIsLoading(true);

    try {
      for (const project of projectsList) {
        const projectData = {
          user_id: userId,
          project_name: project.project_name,
          description: project.description,
          technologies_used: project.technologies_used,
          start_date: project.start_date || null,
          end_date: project.end_date || null,
          project_url: project.project_url,
          github_url: project.github_url
        };

        if (project.id) {
          const { error } = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', project.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('projects')
            .insert(projectData);
          if (error) throw error;
        }
      }

      await fetchProjects();
      toast({
        title: "Success!",
        description: "Projects saved successfully.",
      });
    } catch (error) {
      console.error('Error saving projects:', error);
      toast({
        title: "Error",
        description: "Failed to save projects.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Your personal and professional projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projectsList.map((project, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Project {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeProject(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={project.project_name}
                    onChange={(e) => updateProject(index, 'project_name', e.target.value)}
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <Label>Technologies Used (comma-separated)</Label>
                  <Input
                    value={project.technologies_used.join(', ')}
                    onChange={(e) => updateProject(index, 'technologies_used', e.target.value.split(',').map(t => t.trim()))}
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={project.start_date}
                    onChange={(e) => updateProject(index, 'start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={project.end_date}
                    onChange={(e) => updateProject(index, 'end_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Project URL</Label>
                  <Input
                    value={project.project_url}
                    onChange={(e) => updateProject(index, 'project_url', e.target.value)}
                    placeholder="https://project-demo.com"
                  />
                </div>
                <div>
                  <Label>GitHub URL</Label>
                  <Input
                    value={project.github_url}
                    onChange={(e) => updateProject(index, 'github_url', e.target.value)}
                    placeholder="https://github.com/user/project"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  placeholder="Project description, features, and achievements"
                  rows={4}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addProject} className="flex items-center gap-2">
              <Plus size={16} />
              Add Project
            </Button>
            <Button onClick={saveProjects} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsForm;
