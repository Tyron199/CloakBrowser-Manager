import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  Trash2,
  Download,
  FolderOpen,
  Copy,
  Check,
  File,
  AlertCircle,
} from "lucide-react";
import { api, type SharedFile } from "../lib/api";

interface SharedFilesModalProps {
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SharedFilesModal({ onClose }: SharedFilesModalProps) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [directory, setDirectory] = useState("/data/shared");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listFiles();
      setFiles(data.files);
      setDirectory(data.directory);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    const toUpload = Array.from(fileList);
    if (toUpload.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of toUpload) {
        try {
          await api.uploadFile(file);
        } catch (err) {
          // Conflict → offer overwrite for this file
          const status = err && typeof err === "object" && "status" in err
            ? (err as { status: number }).status
            : 0;
          if (status === 409) {
            const ok = window.confirm(
              `"${file.name}" already exists. Overwrite?`,
            );
            if (ok) {
              await api.uploadFile(file, true);
            }
          } else {
            throw err;
          }
        }
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.deleteFile(name);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const copyText = async (text: string, which: "dir" | string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "dir") {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 1500);
      } else {
        setCopiedFile(which);
        setTimeout(() => setCopiedFile(null), 1500);
      }
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-surface-1 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Shared Files</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 p-1"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Path hint */}
        <div className="px-5 py-3 border-b border-border bg-surface-2/50">
          <p className="text-xs text-gray-400 mb-2">
            Files uploaded here are available inside every browser profile.
            When a site asks you to upload a file, navigate to this folder:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-surface-0 border border-border rounded px-2.5 py-1.5 text-accent font-mono truncate">
              {directory}
            </code>
            <button
              onClick={() => copyText(directory, "dir")}
              className="btn-secondary flex items-center gap-1.5 shrink-0"
              title="Copy path"
            >
              {copiedPath ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="text-xs">{copiedPath ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div className="px-5 pt-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent/10"
                : "border-border hover:border-border-hover hover:bg-surface-2/40"
            }`}
          >
            <Upload className="h-5 w-5 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-300">
              {uploading ? "Uploading…" : "Drop files here or click to browse"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Max 100 MB per file</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) uploadFiles(e.target.files);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 flex items-start gap-2 rounded-md bg-red-600/15 border border-red-600/30 px-3 py-2 text-red-400 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {loading ? (
            <p className="text-center text-gray-500 text-xs py-8">Loading…</p>
          ) : files.length === 0 ? (
            <p className="text-center text-gray-500 text-xs py-8">
              No shared files yet
            </p>
          ) : (
            <ul className="space-y-1">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-surface-2 border border-transparent hover:border-border transition-colors group"
                >
                  <File className="h-4 w-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-100 truncate">{file.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatSize(file.size)} · {formatDate(file.modified_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                    <button
                      onClick={() => copyText(file.path, file.name)}
                      className="p-1.5 text-gray-500 hover:text-gray-200 rounded"
                      title="Copy browser path"
                    >
                      {copiedFile === file.name ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={api.downloadFileUrl(file.name)}
                      download={file.name}
                      className="p-1.5 text-gray-500 hover:text-gray-200 rounded"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {files.length} file{files.length === 1 ? "" : "s"}
          </span>
          <button onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
