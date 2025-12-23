"use client";

import { useState } from "react";
import { useInbound } from "@/hooks/useInbound";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Link2, FileText, Table, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type IngestType = "url" | "pdf" | "csv" | null;

export default function InboundPage() {
  const { ingestedData, isLoading, ingestData, isIngesting } = useInbound();
  
  const [showDialog, setShowDialog] = useState(false);
  const [ingestType, setIngestType] = useState<IngestType>(null);
  const [urls, setUrls] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleIngestClick = () => {
    setShowDialog(true);
    setIngestType(null);
    setUrls("");
    setSelectedFiles([]);
  };

  const handleTypeSelect = (type: IngestType) => {
    setIngestType(type);
    setUrls("");
    setSelectedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!ingestType) return;

    const formData = new FormData();
    // Collection name is always "inshora" - hardcoded on backend

    if (ingestType === "url" && urls) {
      formData.append("urls", urls);
    } else if (ingestType === "pdf" && selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("pdfs", file);
      });
    } else if (ingestType === "csv" && selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("csvs", file);
      });
    } else {
      return;
    }

    try {
      await ingestData(formData);
      setShowDialog(false);
      setIngestType(null);
      setUrls("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Ingestion failed:", error);
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "url":
        return <Link2 className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "csv":
        return <Table className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inbound Agent Data</h1>
          <p className="text-muted-foreground">
            Ingest your data for the inbound agent knowledge base
          </p>
        </div>
        <Button onClick={handleIngestClick} disabled={isIngesting}>
          <Upload className="w-4 h-4 mr-2" />
          Ingest Data
        </Button>
      </div>

      {/* Ingested Data Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Previously Ingested Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingestedData && ingestedData.length > 0 ? (
            ingestedData.map((item) => (
              <Card key={item._id} className="hover:border-primary transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {getFileTypeIcon(item.type)}
                    <Badge variant={item.status === "success" ? "default" : "destructive"}>
                      {item.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Collection</Label>
                    <p className="text-sm font-medium">inshora</p>
                  </div>
                  
                  {item.type === "url" && item.url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline block truncate"
                      >
                        {item.url}
                      </a>
                    </div>
                  )}
                  
                  {(item.type === "pdf" || item.type === "csv") && item.source && (
                    <div>
                      <Label className="text-xs text-muted-foreground">File</Label>
                      <a
                        href={item.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline block truncate"
                      >
                        {item.filename || item.source.split("/").pop()}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.ingestedAt)}
                  </div>
                  
                  {item.status === "success" ? (
                    <div className="flex items-center gap-2 text-xs text-green-500">
                      <CheckCircle className="w-3 h-3" />
                      Ingested Successfully
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      {item.error || "Ingestion Failed"}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                No data ingested yet. Click &quot;Ingest Data&quot; to get started!
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ingest Data Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ingest Data</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!ingestType ? (
              <>
                <p className="text-sm text-muted-foreground">
                  What type of data do you want to ingest?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => handleTypeSelect("url")}
                  >
                    <Link2 className="w-8 h-8 mb-2" />
                    URL
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => handleTypeSelect("pdf")}
                  >
                    <FileText className="w-8 h-8 mb-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex-col"
                    onClick={() => handleTypeSelect("csv")}
                  >
                    <Table className="w-8 h-8 mb-2" />
                    CSV/Excel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIngestType(null)}
                  className="mb-2"
                >
                  ← Back
                </Button>

                {ingestType === "url" && (
                  <div className="space-y-2">
                    <Label>URLs (comma-separated)</Label>
                    <Textarea
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      placeholder="https://example.com/page1, https://example.com/page2"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one or more URLs separated by commas
                    </p>
                  </div>
                )}

                {ingestType === "pdf" && (
                  <div className="space-y-2">
                    <Label>PDF Files</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileChange}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedFiles.length} file(s) selected
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can select multiple PDF files
                    </p>
                  </div>
                )}

                {ingestType === "csv" && (
                  <div className="space-y-2">
                    <Label>CSV/Excel Files</Label>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      multiple
                      onChange={handleFileChange}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedFiles.length} file(s) selected
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can select multiple CSV or Excel files
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isIngesting ||
                      (ingestType === "url" && !urls) ||
                      ((ingestType === "pdf" || ingestType === "csv") && selectedFiles.length === 0)
                    }
                    className="flex-1"
                  >
                    {isIngesting ? (
                      <>
                        <LoadingSpinner size={16} className="mr-2" />
                        Ingesting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Ingest
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

