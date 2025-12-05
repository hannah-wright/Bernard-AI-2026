import { HelpCircle, CheckCircle2, Shield, TrendingUp } from 'lucide-react';
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
  unicornProbability: {
    short: "Unicorn probability score",
    detail: "Calculated using machine learning models trained on 10,000+ historical funding outcomes. Factors include team strength, market size, traction velocity, capital efficiency, and competitive positioning. Updated weekly."
  },
  teamQuality: {
    short: "Team quality score",
    detail: "Composite score analyzing founder track record (exits, prior raises), domain expertise, educational background, team composition, and key hire velocity. Benchmarked against successful founders at similar stages."
  },
  pmfScore: {
    short: "Product-market fit indicator",
    detail: "Derived from retention metrics, revenue growth rate, customer concentration, NPS signals, and engagement patterns. Higher scores indicate stronger customer pull and organic growth."
  },
  investmentReadiness: {
    short: "Investment readiness score",
    detail: "Evaluates capital structure, runway position, burn efficiency, round timing, market conditions, and governance readiness. Indicates likelihood of successful fundraise."
  },
  
  // Estimates
  estimatedRevenue: {
    short: "Estimated revenue range",
    detail: "Revenue estimated using multi-signal analysis: team growth rate, funding stage benchmarks, sector comparables, pricing models, and public hiring patterns. Confidence interval provided."
  },
  estimatedSize: {
    short: "Estimated team size",
    detail: "Team size derived from professional network data, job posting velocity, company announcements, and organizational signals. Updated bi-weekly."
  },
  buzzScore: {
    short: "Media & social engagement score",
    detail: "Engagement score from 50+ signals: media coverage frequency, social mentions, community growth, hiring velocity, conference presence, and industry recognition. Normalized by sector."
  },
  
  // Traction Metrics
  arr: {
    short: "Annual Recurring Revenue",
    detail: "ARR sourced from press releases, investor announcements, or modeled from customer counts × published pricing. Confidence level indicated by source quality."
  },
  payingCustomers: {
    short: "Paying customer count",
    detail: "Customer count from public announcements, case studies, G2/Capterra reviews, and verified customer lists. Conservative estimates used when ranges reported."
  },
  nrr: {
    short: "Net Revenue Retention",
    detail: "NRR measures expansion revenue minus churn. >120% indicates strong upsell/cross-sell motion. Derived from pricing tier analysis and cohort patterns when not disclosed."
  },
  ltvCac: {
    short: "LTV:CAC ratio",
    detail: "Customer lifetime value ÷ acquisition cost. >3x generally indicates efficient, sustainable growth. Calculated from pricing, churn estimates, and marketing spend indicators."
  },
  grossMargin: {
    short: "Gross margin estimate",
    detail: "Gross margin based on business model classification (SaaS: 70-85%, marketplace: 15-30%, hardware: 30-50%) and sector-specific benchmarks. Adjusted for known cost structures."
  },
  runway: {
    short: "Estimated runway",
    detail: "Months of runway calculated from last funding amount, estimated burn rate (based on team size × compensation benchmarks), and known expenditure patterns."
  },
  
  // Unit Economics
  burnMultiple: {
    short: "Burn multiple",
    detail: "Net burn ÷ net new ARR. <1x is excellent, 1-2x is good, >2x warrants scrutiny. Key efficiency metric for growth-stage companies."
  },
  cacPayback: {
    short: "CAC payback period",
    detail: "Months to recover customer acquisition cost from gross margin. <12 months indicates healthy unit economics for SaaS businesses."
  },
  
  // Defensibility
  proprietaryData: {
    short: "Proprietary data moat",
    detail: "Company has unique, hard-to-replicate data assets. Evaluated based on data volume, exclusivity, network effects in data collection, and regulatory barriers to replication."
  },
  networkEffects: {
    short: "Network effects strength",
    detail: "Product value increases with users (direct) or complements (indirect). Assessed by user growth correlation with retention, marketplace liquidity, or platform ecosystem depth."
  },
  switchingCost: {
    short: "Switching cost assessment",
    detail: "Customer effort/cost to switch to competitor. High = data migration + workflow retraining + integration rebuilds. Evaluated from product architecture and customer reviews."
  },
  patents: {
    short: "IP protection status",
    detail: "Intellectual property status from patent database analysis. Includes filed applications, granted patents, and geographic coverage. Not all defensibility requires patents."
  },
  
  // Risk Flags
  keyPersonDependency: {
    short: "Key person risk",
    detail: "Business success highly dependent on specific individual(s). Assessed from leadership visibility, technical founder concentration, and succession planning indicators."
  },
  singleCustomerDependency: {
    short: "Customer concentration risk",
    detail: "Significant revenue from one customer (typically >25%). Identified from case studies, partnership announcements, and revenue disclosure patterns."
  },
  lawsuits: {
    short: "Legal proceedings",
    detail: "Active or pending legal matters from court records and regulatory filings. Includes context on materiality and potential business impact."
  },
  
  // Social Proof
  capTableQuality: {
    short: "Cap table quality assessment",
    detail: "Investor quality scored by track record: portfolio company exits, fund performance percentile, sector expertise, and value-add reputation. Tier 1 = top-quartile returns historically."
  },
  notableInvestors: {
    short: "Notable investor backing",
    detail: "Recognized investors with strong sector track records. Quality assessed by exit outcomes, portfolio company performance, and follow-on investment rates."
  },
};

interface MethodologyTooltipProps {
  text: string | { short: string; detail: string };
  children?: React.ReactNode;
  className?: string;
}

export const MethodologyTooltip = ({ text, children, className }: MethodologyTooltipProps) => {
  const displayText = typeof text === 'string' ? text : text.detail;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center cursor-help", className)}>
            {children || <HelpCircle className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[320px] text-xs leading-relaxed p-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground/80">
              <Shield className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wide font-medium">Methodology</span>
            </div>
            <p>{displayText}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface EstimatedValueProps {
  children: React.ReactNode;
  tooltip: string | { short: string; detail: string };
  className?: string;
}

// Component for estimated values with subtle styling
export const EstimatedValue = ({ children, tooltip, className }: EstimatedValueProps) => {
  const displayText = typeof tooltip === 'string' ? tooltip : tooltip.detail;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center gap-1.5 cursor-help",
            "text-foreground/80", // Subtle opacity for estimated data
            className
          )}>
            {children}
            <HelpCircle className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] text-xs leading-relaxed p-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground/80">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wide font-medium">Estimated</span>
            </div>
            <p>{displayText}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

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
          <CheckCircle2 className="h-3.5 w-3.5 text-success/70" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs p-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Verified from {sources || 'multiple'} independent source{sources !== 1 ? 's' : ''}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface DataLabelProps {
  label: string;
  isEstimated?: boolean;
  tooltip?: string | { short: string; detail: string };
  className?: string;
}

// Label component that shows estimated indicator inline with "Est." text
export const DataLabel = ({ label, isEstimated = true, tooltip, className }: DataLabelProps) => {
  const displayText = typeof tooltip === 'string' ? tooltip : tooltip?.detail;
  
  return (
    <div className={cn("flex items-center justify-between mb-1", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      {isEstimated && tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 cursor-help hover:text-muted-foreground transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
                Est.
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] text-xs p-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wide font-medium">Estimated</span>
                </div>
                <p>{displayText}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
