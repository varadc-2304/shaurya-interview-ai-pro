
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonalInfoFormProps {
  userId: string;
}

const PersonalInfoForm = ({ userId }: PersonalInfoFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPersonalInfo();
    }
  }, [userId]);

  const fetchPersonalInfo = async () => {
    console.log('Fetching personal info for user:', userId);
    try {
      const { data, error } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching personal info:', error);
      } else if (data) {
        console.log('Fetched personal info:', data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          portfolio_url: data.portfolio_url || ""
        });
      }
    } catch (error) {
      console.error('Error in fetchPersonalInfo:', error);
    }
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
    console.log('Saving personal info:', formData);

    try {
      const personalInfoData = {
        user_id: userId,
        full_name: formData.full_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        portfolio_url: formData.portfolio_url || null,
        updated_at: new Date().toISOString()
      };

      console.log('Data to upsert:', personalInfoData);

      const { data, error } = await supabase
        .from('personal_info')
        .upsert(personalInfoData, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully saved:', data);

      toast({
        title: "Success",
        description: "Personal information saved successfully.",
      });
      
      // Refresh the data to confirm it was saved
      await fetchPersonalInfo();
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast({
        title: "Error",
        description: "Failed to save personal information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Enter your basic contact and personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => handleChange('github_url', e.target.value)}
                placeholder="https://github.com/johndoe"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input
                id="portfolio_url"
                value={formData.portfolio_url}
                onChange={(e) => handleChange('portfolio_url', e.target.value)}
                placeholder="https://johndoe.com"
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="shaurya-gradient hover:opacity-90">
            {isLoading ? "Saving..." : "Save Personal Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
