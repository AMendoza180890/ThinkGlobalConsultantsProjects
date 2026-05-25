import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2 } from "lucide-react";
import type { AccreditationDocument } from "@/hooks/useAccreditationDocuments";
import { format } from "date-fns";

interface DocumentUploadCardProps {
  domainId: string;
  documents: AccreditationDocument[];
  onUpload: (params: { domainId: string; file: File }) => void;
  onDelete: (doc: AccreditationDocument) => void;
  isUploading: boolean;
  isDeleting: boolean;
}

const ACCEPTED_TYPES = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function DocumentUploadCard({
  domainId,
  documents,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload({ domainId, file });
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-600 dark:text-red-400">
        No survey data covers this standard. Upload a supporting document to include evidence in your report.
      </p>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.file_name}</p>
            <p className="text-xs text-muted-foreground">
              Uploaded {format(new Date(doc.created_at), "MMM d, yyyy")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(doc)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? "Uploading…" : "Upload Document"}
      </Button>
    </div>
  );
}
