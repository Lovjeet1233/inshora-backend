"use client";

import { useCampaign } from "@/hooks/useCampaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Play, Pause, Download } from "lucide-react";
import { formatDateTime, getCampaignStatusColor, getCampaignTypeColor } from "@/lib/utils";
import Link from "next/link";
import { use } from "react";

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { campaign, isLoading } = useCampaign(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const progressPercentage = campaign.totalContacts > 0
    ? (campaign.results.length / campaign.totalContacts) * 100
    : 0;

  const successRate = campaign.results.length > 0
    ? (campaign.successCount / campaign.results.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">Campaign details and results</p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "running" && (
            <Button variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          {(campaign.status === "draft" || campaign.status === "paused") && (
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getCampaignTypeColor(campaign.type)}>
              {campaign.type.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getCampaignStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.totalContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {campaign.status === "running" && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processed</span>
                <span>
                  {campaign.results.length} / {campaign.totalContacts}
                </span>
              </div>
              <Progress value={progressPercentage} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {campaign.successCount}
                </div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {campaign.failureCount}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">
                  {campaign.totalContacts - campaign.results.length}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Overall Status</TableHead>
                <TableHead>Methods</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.results.length > 0 ? (
                campaign.results.map((result, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.contactName}</div>
                          <div className="text-sm text-muted-foreground">
                            Contact #{parseInt(result.contactId) + 1}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.overallStatus === "success" ? "default" : 
                            result.overallStatus === "partial" ? "secondary" : 
                            "destructive"
                          }
                        >
                          {result.overallStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {result.methods.map((method, mIndex) => (
                            <div key={mIndex} className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  method.status === "sent" 
                                    ? "border-green-500 text-green-700" 
                                    : "border-red-500 text-red-700"
                                }
                              >
                                {method.method.toUpperCase()}: {method.status}
                              </Badge>
                              {method.error && (
                                <span className="text-xs text-red-500 truncate max-w-[200px]">
                                  {method.error}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(result.timestamp)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No results yet. Start the campaign to begin processing contacts.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
