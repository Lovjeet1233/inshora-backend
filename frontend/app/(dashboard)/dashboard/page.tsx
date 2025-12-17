"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Users, Mail, Share2, TrendingUp, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!analytics) {
    return <div>No data available</div>;
  }

  const stats = [
    {
      title: "Total Campaigns",
      value: analytics.campaigns.total,
      description: `${analytics.campaigns.byStatus.running || 0} active`,
      icon: Mail,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Campaigns",
      value: analytics.campaigns.byStatus.running || 0,
      description: `${analytics.campaigns.successRate}% success rate`,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Social Posts",
      value: analytics.socialMedia.totalPosts,
      description: `${analytics.socialMedia.byStatus.published || 0} published`,
      icon: Share2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Avg Engagement Rate",
      value: `${analytics.socialMedia.engagement.averageEngagementRate}%`,
      description: `${analytics.socialMedia.engagement.totalLikes} total likes`,
      icon: TrendingUp,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your CRM activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Contact reach and success metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Contacts</span>
                <span className="text-2xl font-bold">
                  {analytics.campaigns.totalContacts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-500">
                  Successful
                </span>
                <span className="text-xl font-semibold text-green-500">
                  {analytics.campaigns.successfulContacts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-500">
                  Failed
                </span>
                <span className="text-xl font-semibold text-red-500">
                  {analytics.campaigns.failedContacts}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Engagement</CardTitle>
            <CardDescription>Total interactions across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Likes</span>
                <span className="text-xl font-semibold">
                  {analytics.socialMedia.engagement.totalLikes.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Comments</span>
                <span className="text-xl font-semibold">
                  {analytics.socialMedia.engagement.totalComments.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Shares</span>
                <span className="text-xl font-semibold">
                  {analytics.socialMedia.engagement.totalShares.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
            <CardDescription>Campaigns created per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div
                  key={activity.date}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <span className="text-sm font-medium">
                    {formatDate(activity.date)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {activity.campaigns} campaign{activity.campaigns !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Stats */}
      {analytics.whatsapp && (
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Activity</CardTitle>
            <CardDescription>Messaging statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analytics.whatsapp.totalMessages}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Messages
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {analytics.whatsapp.byDirection.inbound || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Inbound
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {analytics.whatsapp.byDirection.outbound || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Outbound
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
