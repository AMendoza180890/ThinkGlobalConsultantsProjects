import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Check, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PUBLISHED_URL = "https://cq-for-schools-weekly.lovable.app";

export default function AdminSchools() {
  const [name, setName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schools, isLoading } = useQuery({
    queryKey: ["admin-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*, school_members(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createSchool = useMutation({
    mutationFn: async (schoolName: string) => {
      const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data, error } = await supabase
        .from("schools")
        .insert({ name: schoolName, slug })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      const link = `${PUBLISHED_URL}/join/${data.slug}`;
      toast({
        title: "School created!",
        description: `Invite link copied to clipboard`,
      });
      navigator.clipboard.writeText(link);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createSchool.mutate(name.trim());
  };

  const copyLink = (school: { id: string; slug: string }) => {
    const link = `${PUBLISHED_URL}/join/${school.slug}`;
    navigator.clipboard.writeText(link);
    setCopiedId(school.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-sans text-3xl font-semibold mb-2">Manage Schools</h1>
      <p className="text-muted-foreground mb-8">Create schools and share invite links with teachers.</p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              placeholder="School name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createSchool.isPending || !name.trim()}>
              {createSchool.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> Add School</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {schools?.map((school) => (
            <Card key={school.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{(school.school_members as any)?.[0]?.count ?? 0} teachers</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md text-foreground truncate">
                    {PUBLISHED_URL}/join/{school.slug}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(school)}
                    className="shrink-0"
                  >
                    {copiedId === school.id ? (
                      <><Check className="h-4 w-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-1" /> Copy Link</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {schools?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No schools yet. Create your first one above.</p>
          )}
        </div>
      )}
    </div>
  );
}
