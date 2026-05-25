import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, CheckCircle, XCircle, ShieldOff, Loader2, RefreshCw } from "lucide-react";

type EmailLog = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Stats = { total: number; sent: number; failed: number; suppressed: number; rate_limited: number };

const TIME_RANGES = [
  { label: "Last 24h", value: "24h", hours: 24 },
  { label: "Last 7 days", value: "7d", hours: 168 },
  { label: "Last 30 days", value: "30d", hours: 720 },
];

const statusColor: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  dlq: "bg-red-100 text-red-800 border-red-200",
  suppressed: "bg-amber-100 text-amber-800 border-amber-200",
  rate_limited: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-blue-100 text-blue-800 border-blue-200",
};

const PAGE_SIZE = 50;

export default function EmailDashboard() {
  const [timeRange, setTimeRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, suppressed: 0, rate_limited: 0 });
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const since = () => {
    const r = TIME_RANGES.find((t) => t.value === timeRange)!;
    return new Date(Date.now() - r.hours * 3600_000).toISOString();
  };

  const fetchData = async () => {
    setLoading(true);
    const start = since();

    // Fetch all rows in time range (service_role via RLS lets admin see)
    let query = supabase
      .from("email_send_log")
      .select("*")
      .gte("created_at", start)
      .order("created_at", { ascending: false })
      .range(0, 999);

    const { data: allRows } = await query;

    if (!allRows) {
      setLoading(false);
      return;
    }

    // Deduplicate by message_id (latest row wins)
    const deduped = new Map<string, EmailLog>();
    for (const row of allRows) {
      const key = row.message_id || row.id;
      if (!deduped.has(key)) {
        deduped.set(key, row as EmailLog);
      }
    }
    const unique = Array.from(deduped.values());

    // Templates
    const tplSet = new Set(unique.map((r) => r.template_name));
    setTemplates(Array.from(tplSet).sort());

    // Stats
    const s: Stats = { total: unique.length, sent: 0, failed: 0, suppressed: 0, rate_limited: 0 };
    for (const r of unique) {
      if (r.status === "sent") s.sent++;
      else if (r.status === "failed" || r.status === "dlq") s.failed++;
      else if (r.status === "suppressed") s.suppressed++;
      else if (r.status === "rate_limited") s.rate_limited++;
    }
    setStats(s);

    // Filter
    let filtered = unique;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) =>
        statusFilter === "failed" ? r.status === "failed" || r.status === "dlq" : r.status === statusFilter
      );
    }
    if (templateFilter !== "all") {
      filtered = filtered.filter((r) => r.template_name === templateFilter);
    }

    const start_idx = page * PAGE_SIZE;
    setHasMore(filtered.length > start_idx + PAGE_SIZE);
    setLogs(filtered.slice(start_idx, start_idx + PAGE_SIZE));
    setLoading(false);
  };

  useEffect(() => {
    setPage(0);
  }, [timeRange, statusFilter, templateFilter]);

  useEffect(() => {
    fetchData();
  }, [timeRange, statusFilter, templateFilter, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-sans text-foreground">Email Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">Track survey email delivery, failures, and suppression</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Mail className="h-5 w-5 text-primary" />} label="Total Emails" value={stats.total} />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} label="Sent" value={stats.sent} />
        <StatCard icon={<XCircle className="h-5 w-5 text-red-600" />} label="Failed" value={stats.failed} />
        <StatCard icon={<ShieldOff className="h-5 w-5 text-amber-600" />} label="Suppressed" value={stats.suppressed} />
        <StatCard icon={<Mail className="h-5 w-5 text-blue-600" />} label="Rate Limited" value={stats.rate_limited} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={timeRange === r.value ? "default" : "outline"}
              onClick={() => setTimeRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
            <SelectItem value="rate_limited">Rate Limited</SelectItem>
          </SelectContent>
        </Select>
        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No emails found for the selected filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-xs">{log.template_name}</TableCell>
                    <TableCell className="text-xs">{log.recipient_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColor[log.status] || ""}`}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                      {log.error_message || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {(page > 0 || hasMore) && (
          <div className="flex justify-between items-center p-4 border-t">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {icon}
        <div>
          <p className="text-2xl font-semibold font-sans text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
