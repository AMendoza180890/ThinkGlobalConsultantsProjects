import { WASC_DOMAINS, DOCUMENT_ONLY_DOMAIN_IDS } from "@/lib/accreditation";
import { FRICTION_CATEGORIES, CQ_WINS } from "@/lib/data";
import { INTERVENTION_LIBRARY } from "@/data/interventionLibrary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Sparkles, AlertTriangle, GraduationCap, CheckCircle } from "lucide-react";

export default function AccreditationDataMapping() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">CQ Data Mapping</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          A definitive structural mapping of how underlying cultural metrics (Friction, Confidence, Wins, and Interventions) automatically fulfill ACS WASC reporting standards.
        </p>
      </div>

      <Accordion type="multiple" className="w-full space-y-4" defaultValue={WASC_DOMAINS.map(d => d.id).slice(0, 1)}>
        {WASC_DOMAINS.map((domain) => {
          const isDocumentOnly = DOCUMENT_ONLY_DOMAIN_IDS.includes(domain.id);
          const mappedFriction = FRICTION_CATEGORIES.filter((cat) => domain.frictionCategoryIds.includes(cat.id));
          const mappedInterventions = INTERVENTION_LIBRARY.filter((int) => int.targetStandards.includes(domain.code));
          
          return (
            <AccordionItem value={domain.id} key={domain.id} className="bg-card border rounded-lg overflow-hidden data-[state=open]:shadow-md transition-all px-2">
              <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/30">
                <div className="flex flex-col items-start gap-1 text-left w-full">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                      {domain.code}
                    </span>
                    <span className="text-lg font-bold">{domain.name}</span>
                    {isDocumentOnly && (
                      <Badge variant="secondary" className="ml-2 font-normal text-xs">Document Upload Only</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-normal line-clamp-1 pr-6 mt-1">
                    {domain.description}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-6 pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  
                  {/* Friction Signals */}
                  <Card className="border shadow-none">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <CardTitle className="text-base text-foreground">Friction Signals Mapped</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        Cultural friction categories that generate severity scores for this standard.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {mappedFriction.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {mappedFriction.map((cat) => (
                            <Badge key={cat.id} variant="outline" className="bg-destructive/5 text-destructive-foreground border-destructive/20 font-medium">
                              {cat.label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Info className="h-4 w-4" /> 
                          {isDocumentOnly ? "No cultural friction mapped locally." : "Relies entirely on qualitative data."}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Interventions / CPD */}
                  <Card className="border shadow-none">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base text-foreground">Workshops / Interventions</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        CQ Lessons or CPD Workshops designed to correct friction in this standard.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {mappedInterventions.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {mappedInterventions.map((int) => (
                            <div key={int.id} className="text-sm">
                              <p className="font-semibold text-foreground">• {int.title}</p>
                              <p className="text-xs text-muted-foreground ml-3 truncate" title={int.description}>
                                {int.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Info className="h-4 w-4" /> 
                          No dedicated CPD models mapped yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Confidence Semantics */}
                  <Card className="border shadow-none">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <CardTitle className="text-base text-foreground">Target Confidence Vectors</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        The 4-point semantic confidence scale directly acts as a lagging indicator for this domain's risk rating.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {domain.code === "A2" ? (
                          <Badge variant="secondary">Administrator Confidence</Badge>
                        ) : domain.code === "C3" ? (
                          <Badge variant="secondary">Parent Confidence</Badge>
                        ) : domain.code === "A3" || domain.code === "C1" || domain.code === "C2" ? (
                          <>
                            <Badge variant="secondary">Colleague Confidence</Badge>
                            <Badge variant="secondary">Administrator Confidence</Badge>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Neutral weighting based on global confidence.</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* CQ Wins */}
                  <Card className="border shadow-none">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-base text-foreground">CQ Wins Contribution</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {isDocumentOnly ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Info className="h-4 w-4" /> 
                          Wins do not statistically support document upload standards.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            When cross-cultural adaptation behaviors are logged below, they automatically supply a positive 20% weight to this area's CQ Health Score:
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {CQ_WINS.map((win) => (
                              <Badge key={win.id} variant="outline" className="text-xs font-normal border-amber-500/30 text-amber-700 dark:text-amber-400">
                                {win.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
