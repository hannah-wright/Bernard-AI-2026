import { HelpCircle, CheckCircle2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Methodology explanations - provide confidence without revealing sources
export const methodologyText = {
  // AI Scores
  unicornProbability: "Probability score based on historical analysis of 10,000+ funding outcomes, weighing team strength, market size, traction velocity, and capital efficiency patterns.",
  teamQuality: "Composite score analyzing founder track record, domain expertise, educational background, prior exits, and team composition relative to stage.",
  pmfScore: "Product-market fit indicator derived from retention metrics, revenue growth rate, customer concentration, and engagement signals.",
  investmentReadiness: "Readiness score based on capital structure, runway, burn efficiency, round timing, and market conditions alignment.",
  
  // Estimates
  estimatedRevenue: "Revenue range estimated from team size, funding stage, sector benchmarks, and public hiring/growth signals. Actual figures may vary.",
  estimatedSize: "Team size estimated from professional network data, job postings, and company announcements.",
  buzzScore: "Engagement score calculated from media coverage frequency, social mentions, hiring velocity, and industry recognition.",
  
  // Traction Metrics
  arr: "Annual Recurring Revenue as reported in press releases, investor updates, or estimated from customer counts and pricing.",
  payingCustomers: "Customer count from public announcements, case studies, and verified customer lists.",
  nrr: "Net Revenue Retention indicates expansion revenue minus churn. Higher values suggest strong product-market fit.",
  ltvCac: "Customer lifetime value to acquisition cost ratio. >3x generally indicates efficient growth.",
  grossMargin: "Gross margin percentage based on business model benchmarks and industry standards for the sector.",
  runway: "Estimated months of runway based on last funding round, burn rate indicators, and team size.",
  
  // Unit Economics
  burnMultiple: "Net burn divided by net new ARR. Lower values indicate more efficient growth.",
  cacPayback: "Months to recover customer acquisition cost. Shorter payback periods indicate healthier unit economics.",
  
  // Defensibility
  proprietaryData: "Company has unique, hard-to-replicate data assets that create competitive advantage.",
  networkEffects: "Product value increases as more users join, creating natural moat against competitors.",
  switchingCost: "Customer effort/cost required to switch to a competitor. Higher costs indicate stickier product.",
  patents: "Intellectual property protection through filed or granted patents.",
  
  // Risk Flags
  keyPersonDependency: "Business success highly dependent on specific individual(s). Succession risk consideration.",
  singleCustomerDependency: "Significant revenue concentration with one customer. Diversification risk consideration.",
  lawsuits: "Active or pending legal matters that may affect business operations or valuation.",
  
  // Social Proof
  capTableQuality: "Investor quality based on track record of portfolio exits, fund performance, and value-add capabilities.",
  notableInvestors: "Recognized investors with strong track records in the sector.",
};

interface MethodologyTooltipProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
}

export const MethodologyTooltip = ({ text, children, className }: MethodologyTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center cursor-help", className)}>
          {children || <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface EstimatedValueProps {
  children: React.ReactNode;
  tooltip: string;
  className?: string;
}

// Component for estimated values with subtle styling
export const EstimatedValue = ({ children, tooltip, className }: EstimatedValueProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-1.5 cursor-help",
          "text-foreground/80", // Subtle opacity for estimated data
          className
        )}>
          {children}
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
        <div className="flex items-start gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <span>{tooltip}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface VerifiedValueProps {
  children: React.ReactNode;
  sources?: number;
  className?: string;
}

// Component for verified values with solid styling
export const VerifiedValue = ({ children, sources, className }: VerifiedValueProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-1.5 cursor-help",
          "text-foreground", // Full opacity for verified data
          className
        )}>
          {children}
          <CheckCircle2 className="h-2.5 w-2.5 text-success/70" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-success" />
          <span>Verified from {sources || 'multiple'} source{sources !== 1 ? 's' : ''}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface DataLabelProps {
  label: string;
  isEstimated?: boolean;
  tooltip?: string;
  className?: string;
}

// Label component that shows estimated indicator inline with "Est." text
export const DataLabel = ({ label, isEstimated = true, tooltip, className }: DataLabelProps) => (
  <div className={cn("flex items-center justify-between mb-1", className)}>
    <span className="text-xs text-muted-foreground">{label}</span>
    {isEstimated && tooltip && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 cursor-help">
              <HelpCircle className="h-3 w-3" />
              Est.
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);
