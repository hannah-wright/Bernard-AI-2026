import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Friendly illustration */}
        <div className="mb-8">
          <div className="text-8xl font-serif font-bold text-muted-foreground/20">
            404
          </div>
        </div>
        
        {/* Message */}
        <h1 className="text-2xl font-semibold mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => window.history.back()}>
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </button>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;