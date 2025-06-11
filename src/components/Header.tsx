
import { Button } from "@/components/ui/button";
import { Home, FileText, LogOut } from "lucide-react";

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNavigateToResume?: () => void;
  onNavigateToHome?: () => void;
}

const Header = ({ isAuthenticated, onLogout, onNavigateToResume, onNavigateToHome }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1" /> {/* Empty spacer for center alignment */}
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onNavigateToHome}
                  className="flex items-center space-x-2"
                >
                  <Home size={16} />
                  <span>Home</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onNavigateToResume}
                  className="flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>Resume</span>
                </Button>
{/*                 <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </Button> */}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
