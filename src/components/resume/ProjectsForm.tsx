
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectsFormProps {
  userId: string | undefined;
}

interface Project {
  id?: string;
  project_name: string;
  description: string;
  technologies_used: string;
  start_date: string;
  end_date: string;
  project_url: string;
  github_url: string;
}

const ProjectsForm = ({ userId }: ProjectsFormProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (data && !error) {
      setProjects(data.map(project => ({
        ...project,
        technologies_used: project.technologies_used?.join(', ') || ''
      })));
    }
  };

  const addProject = () => {
    setProjects([...projects, {
      project_name: "",
      description: "",
      technologies_used: "",
      start_date: "",
      end_date: "",
      project_url: "",
      github_url: ""
    }]);
  };

  const removeProject = async (index: number) => {
    const project = projects[index];
    if (project.id) {
      await supabase.from('projects').delete().eq('id', project.id);
    }
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      for (const project of projects) {
        const projectData = {
          user_id: userId,
          project_name: project.project_name,
          description: project.description,
          technologies_used: project.technologies_used.split(',').map(tech => tech.trim()).filter(Boolean),
          start_date: project.start_date || null,
          end_date: project.end_date || null,
          project_url: project.project_url,
          github_url: project.github_url,
          updated_at: new Date().toISOString()
        };

        if (project.id) {
          await supabase.from('projects').update(projectData).eq('id', project.id);
        } else {
          await supabase.from('projects').insert(projectData);
        }
      }

      toast({
        title: "Success",
        description: "Projects saved successfully.",
      });
      fetchProjects();
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
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Projects</CardTitle>
        <CardDescription>Add your personal and professional projects</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {projects.map((project, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Project {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProject(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Project Name</Label>
                  <Input
                    value={project.project_name}
                    onChange={(e) => updateProject(index, 'project_name', e.target.value)}
                    placeholder="Project Name"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Describe your project"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Technologies Used</Label>
                  <Input
                    value={project.technologies_used}
                    onChange={(e) => updateProject(index, 'technologies_used', e.target.value)}
                    placeholder="React, Node.js, MongoDB (comma-separated)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={project.start_date}
                    onChange={(e) => updateProject(index, 'start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={project.end_date}
                    onChange={(e) => updateProject(index, 'end_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project URL</Label>
                  <Input
                    value={project.project_url}
                    onChange={(e) => updateProject(index, 'project_url', e.target.value)}
                    placeholder="https://myproject.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <Input
                    value={project.github_url}
                    onChange={(e) => updateProject(index, 'github_url', e.target.value)}
                    placeholder="https://github.com/user/project"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={addProject}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
              {isLoading ? "Saving..." : "Save Projects"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectsForm;
