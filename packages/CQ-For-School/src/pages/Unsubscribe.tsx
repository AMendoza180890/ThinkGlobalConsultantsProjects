import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(
      `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
      { headers: { apikey: anonKey } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "handle-email-unsubscribe",
        { body: { token } }
      );
      if (error) throw error;
      if (data?.success) {
        setStatus("done");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="font-sans text-xl font-semibold text-foreground">
              CQ Impact
            </span>
          </div>

          {status === "loading" && (
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          )}

          {status === "valid" && (
            <>
              <h1 className="font-sans text-xl font-semibold text-foreground mb-3">
                Unsubscribe from emails
              </h1>
              <p className="text-muted-foreground mb-6">
                You'll stop receiving weekly survey reminder emails. You can
                still access the survey directly.
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={busy}
                variant="destructive"
                className="w-full h-11"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {busy ? "Processing..." : "Confirm Unsubscribe"}
              </Button>
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="font-sans text-xl font-semibold text-foreground mb-2">
                You've been unsubscribed
              </h1>
              <p className="text-muted-foreground">
                You won't receive any more survey reminder emails.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-sans text-xl font-semibold text-foreground mb-2">
                Already unsubscribed
              </h1>
              <p className="text-muted-foreground">
                You're already unsubscribed from survey reminder emails.
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="font-sans text-xl font-semibold text-foreground mb-2">
                Invalid link
              </h1>
              <p className="text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="font-sans text-xl font-semibold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                Please try again later or contact support.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
