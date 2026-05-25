import { Crown, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  title: string;
  description: string;
  valueProp: string;
  bullets: string[];
  children: React.ReactNode;
  locked?: boolean;
}

export function PremiumGate({
  title,
  description,
  valueProp,
  bullets,
  children,
  locked = true,
}: PremiumGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative min-h-[600px] overflow-hidden">
      {/* Blurred content preview */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(4px)", opacity: 0.45 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Gate overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-md bg-background border-2 border-primary/20 rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-xl font-bold mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 mb-5 text-left">
            <p className="text-sm font-semibold text-primary mb-2">{valueProp}</p>
            <ul className="space-y-1.5">
              {bullets.map(b => (
                <li key={b} className="text-xs text-foreground/70 flex gap-2">
                  <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <Button className="w-full gap-2" size="lg">
            <Crown className="h-4 w-4" />
            Upgrade to Premium
          </Button>
          <p className="text-[11px] text-muted-foreground mt-3">
            Contact your CQ Impact account manager to unlock.
          </p>
        </div>
      </div>
    </div>
  );
}
