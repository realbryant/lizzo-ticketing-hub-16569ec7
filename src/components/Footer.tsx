import { Zap, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-foreground font-semibold">LIZzo</span>
          </div>

          <p className="text-muted-foreground text-sm">
            Made by LIZzo
          </p>

          {/* Instagram Link */}
          <a
            href="https://instagram.com/realbryant.yb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Instagram className="w-5 h-5" />
            <span className="text-sm">@realbryant.yb</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
