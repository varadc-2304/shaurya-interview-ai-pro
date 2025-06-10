
import { Button } from "@/components/ui/button";
import { User, LogOut, FileText } from "lucide-react";

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNavigateToResume?: () => void;
  isVisible?: boolean;
}

const Header = ({ isAuthenticated, onLogin, onLogout, onNavigateToResume, isVisible = true }: HeaderProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 shaurya-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold shaurya-text-gradient">Shaurya</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onNavigateToResume}
                  className="flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>Resume</span>
                </Button>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User size={16} />
                  <span>Welcome back!</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Button onClick={onLogin} className="shaurya-gradient hover:opacity-90 transition-opacity">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
