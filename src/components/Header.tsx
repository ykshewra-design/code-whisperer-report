import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn("text-center space-y-2", className)}>
      <h1 className="text-5xl font-bold gradient-text tracking-tight">
        Senvo
      </h1>
      <p className="text-muted-foreground text-lg">
        Meet someone new, instantly
      </p>
    </header>
  );
};

export default Header;
