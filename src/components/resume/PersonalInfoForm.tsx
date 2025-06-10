
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonalInfoFormProps {
  userId: string;
}

interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
}

const PersonalInfoForm = ({ userId }: PersonalInfoFormProps) => {
  const [formData, setFormData] = useState<PersonalInfo>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPersonalInfo();
  }, [userId]);

  const fetchPersonalInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching personal info:', error);
        return;
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          portfolio_url: data.portfolio_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching personal info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('personal_info')
        .upsert({
          user_id: userId,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Personal information saved successfully.",
      });
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast({
        title: "Error",
        description: "Failed to save personal information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your basic contact and personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => handleChange('github_url', e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div>
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input
                id="portfolio_url"
                value={formData.portfolio_url}
                onChange={(e) => handleChange('portfolio_url', e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your address"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Saving..." : "Save Personal Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
