"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Phone, Search, Clock } from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface Transcript {
  _id: string;
  caller_id: string;
  name: string;
  contact_number: string;
  transcript: {
    items?: any[];
    [key: string]: any;
  };
  timestamp: string;
  metadata: {
    room_name?: string;
    duration_seconds?: number;
    duration_formatted?: string;
    [key: string]: any;
  };
}

export default function CallsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["transcripts", page, search],
    queryFn: async () => {
      const { data } = await api.get("/transcripts", {
        params: { page, search: search || undefined },
      });
      return data;
    },
  });

  const transcripts: Transcript[] = data?.data || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Call Transcripts</h1>
          <p className="text-muted-foreground">
            View all call transcripts and recordings
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Phone className="w-4 h-4 mr-2" />
          {total} Total Calls
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or phone number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcripts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={32} />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transcripts.length > 0 ? (
                    transcripts.map((transcript) => (
                      <TableRow key={transcript._id}>
                        <TableCell className="font-medium">
                          {transcript.name || "Unknown"}
                        </TableCell>
                        <TableCell>{transcript.contact_number || "—"}</TableCell>
                        <TableCell>
                          {transcript.metadata?.duration_formatted ? (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {transcript.metadata.duration_formatted}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {transcript.timestamp ? formatDateTime(transcript.timestamp) : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTranscript(transcript)}
                          >
                            View Transcript
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No call transcripts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={!!selectedTranscript} onOpenChange={() => setSelectedTranscript(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call Transcript
            </DialogTitle>
          </DialogHeader>
          {selectedTranscript && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedTranscript.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-medium">{selectedTranscript.contact_number || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {selectedTranscript.metadata?.duration_formatted || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {selectedTranscript.timestamp ? formatDateTime(selectedTranscript.timestamp) : "—"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Transcript</h3>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  {selectedTranscript.transcript?.items && selectedTranscript.transcript.items.length > 0 ? (
                    selectedTranscript.transcript.items.map((item: any, index: number) => (
                      <div key={index} className="pb-2 border-b border-border last:border-0">
                        <p className="text-xs text-muted-foreground mb-1">
                          {item.speaker || "Speaker"}
                        </p>
                        <p className="whitespace-pre-wrap">{item.text || item.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No transcript available</p>
                  )}
                </div>
              </div>

              {selectedTranscript.metadata && Object.keys(selectedTranscript.metadata).length > 1 && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Metadata</h3>
                  <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(
                      Object.entries(selectedTranscript.metadata).reduce((acc, [key, value]) => {
                        if (key !== 'duration_formatted') acc[key] = value;
                        return acc;
                      }, {} as any),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
