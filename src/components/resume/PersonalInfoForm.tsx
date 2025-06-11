import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe } from "lucide-react";

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

  const inputFields = [
    { key: 'full_name', label: 'Full Name', icon: User, placeholder: 'Enter your full name', type: 'text' },
    { key: 'email', label: 'Email', icon: Mail, placeholder: 'Enter your email', type: 'email' },
    { key: 'phone', label: 'Phone', icon: Phone, placeholder: 'Enter your phone number', type: 'text' },
    { key: 'linkedin_url', label: 'LinkedIn URL', icon: Linkedin, placeholder: 'https://linkedin.com/in/yourprofile', type: 'url' },
    { key: 'github_url', label: 'GitHub URL', icon: Github, placeholder: 'https://github.com/yourusername', type: 'url' },
    { key: 'portfolio_url', label: 'Portfolio URL', icon: Globe, placeholder: 'https://yourportfolio.com', type: 'url' }
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-800">Personal Information</CardTitle>
            <CardDescription className="text-slate-600 text-lg">
              Your basic contact and personal details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputFields.map((field) => (
              <div key={field.key} className="space-y-3">
                <Label htmlFor={field.key} className="flex items-center space-x-2 text-slate-700 font-medium">
                  <field.icon className="w-4 h-4 text-slate-500" />
                  <span>{field.label}</span>
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData[field.key as keyof PersonalInfo]}
                  onChange={(e) => handleChange(field.key as keyof PersonalInfo, e.target.value)}
                  placeholder={field.placeholder}
                  className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/70 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="address" className="flex items-center space-x-2 text-slate-700 font-medium">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Address</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your address"
              rows={3}
              className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/70 backdrop-blur-sm transition-all duration-200"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-3"
          >
            {isLoading ? "Saving..." : "Save Personal Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
