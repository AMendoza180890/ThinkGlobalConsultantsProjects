import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, Shield, FileText, Calendar, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { downloadCertificate } from "@/lib/certificates";
import { format } from "date-fns";

interface CertRecord {
  id: string;
  staff_name: string;
  session_title: string;
  session_date: string;
  duration_hours: number;
  standard_code: string | null;
  standard_name: string | null;
  school_name: string;
  issued_at: string;
}

export default function CPDCertificates() {
  const { selectedSchoolId } = useSchoolContext();
  const [certificates, setCertificates] = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedSchoolId) return;
    loadCerts();
  }, [selectedSchoolId]);

  const loadCerts = async () => {
    if (!selectedSchoolId) return;
    setLoading(true);
    const { data } = await (supabase as any).from("cpd_certificates").select("*").eq("school_id", selectedSchoolId).order("issued_at", { ascending: false });
    if (data) setCertificates(data);
    setLoading(false);
  };

  const handleRedownload = (cert: CertRecord) => {
    downloadCertificate({
      staffName: cert.staff_name,
      sessionTitle: cert.session_title,
      date: format(new Date(cert.session_date), "MMMM d, yyyy"),
      durationHours: cert.duration_hours,
      standardCode: cert.standard_code ?? "",
      standardName: cert.standard_name ?? "",
      schoolName: cert.school_name,
    });
  };

  const totalHours = certificates.reduce((sum, c) => sum + c.duration_hours, 0);
  const uniqueStaff = new Set(certificates.map((c) => c.staff_name)).size;
  const standardsCovered = new Set(certificates.map((c) => c.standard_code).filter(Boolean)).size;

  // By staff aggregation for the second tab
  const byStaff = useMemo(() => {
    const map: Record<string, CertRecord[]> = {};
    certificates.forEach((c) => {
      if (!map[c.staff_name]) map[c.staff_name] = [];
      map[c.staff_name].push(c);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [certificates]);

  if (loading) {
    return <div className="space-y-6 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-[400px]" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold font-sans text-foreground flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          CPD Certificates
        </h1>
        <p className="text-muted-foreground mt-1">View and download issued professional development certificates</p>
      </div>

      {/* Accreditation Evidence Callout */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Accreditation Evidence</p>
            <p className="text-xs text-muted-foreground mt-1">
              Each certificate serves as verifiable evidence of professional learning for WASC accreditation. Certificate records are linked to standards and automatically update your A3 Faculty and Staff CPD Evidence scores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Certificates", value: certificates.length, icon: Award },
          { label: "Unique Staff", value: uniqueStaff, icon: Users },
          { label: "CPD Hours", value: totalHours, icon: Clock },
          { label: "Standards Covered", value: standardsCovered, icon: FileText },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <stat.icon className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Certificates</TabsTrigger>
          <TabsTrigger value="by-staff">By Staff Member</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {certificates.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No certificates issued yet. Complete sessions with attendance to generate certificates.</p>
          )}
          <div className="space-y-3">
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">{cert.staff_name}</h3>
                    <p className="text-xs text-muted-foreground">{cert.session_title}</p>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        <Calendar className="h-2.5 w-2.5 mr-1" />{format(new Date(cert.session_date), "MMM d, yyyy")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-1" />{cert.duration_hours}h
                      </Badge>
                      {cert.standard_code && (
                        <Badge variant="outline" className="text-[10px]">{cert.standard_code}</Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleRedownload(cert)}>
                    <Download className="h-3.5 w-3.5 mr-1" />Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-staff">
          {byStaff.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No certificates issued yet.</p>
          )}
          <div className="space-y-4">
            {byStaff.map(([name, certs]) => {
              const totalH = certs.reduce((s, c) => s + c.duration_hours, 0);
              return (
                <Card key={name}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{name}</h3>
                        <p className="text-xs text-muted-foreground">{certs.length} certificate(s) • {totalH}h total CPD</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => certs.forEach((c, i) => setTimeout(() => handleRedownload(c), i * 300))}>
                        <Download className="h-3.5 w-3.5 mr-1" />Download All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {certs.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/50">
                          <span>{c.session_title}</span>
                          <div className="flex gap-2 items-center text-muted-foreground">
                            <span>{format(new Date(c.session_date), "MMM d")}</span>
                            {c.standard_code && <Badge variant="outline" className="text-[9px]">{c.standard_code}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Certificate PDF Layout Spec */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Certificate Layout</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each certificate is a landscape A4 PDF with: double border frame (teal), "CQ Impact Platform" header, "Certificate of Professional Development" title, staff name, session title, date and CPD hours, ACS WASC standard alignment, school name, and "Issued by: CQ Impact Platform" footer. Certificates are generated client-side using jsPDF and downloaded immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
