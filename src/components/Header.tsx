import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  return (
    <header className={cn("text-center space-y-3", className)}>
      <h1 className="text-4xl sm:text-5xl font-bold gradient-text tracking-tight">
        Senvo - Free Random Video, Voice & Text Chat
      </h1>
      <p className="text-muted-foreground text-lg">
        Meet someone new, instantly. 100% Percent Free.
      </p>
    </header>
  );
};

export default Header;
