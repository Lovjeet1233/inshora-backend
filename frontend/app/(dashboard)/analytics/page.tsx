"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AnalyticsPage() {
  const { analytics, isLoading } = useAnalytics();
  const { posts } = useSocialPosts();

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

  const topPosts = posts
    ?.sort((a, b) => b.insights.engagement - a.insights.engagement)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into your campaigns and social media performance
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.socialMedia.totalPosts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.socialMedia.byStatus.published || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                analytics.socialMedia.engagement.totalLikes +
                analytics.socialMedia.engagement.totalComments +
                analytics.socialMedia.engagement.totalShares
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Likes, comments & shares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.socialMedia.engagement.averageEngagementRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.campaigns.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.campaigns.successRate}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance by Type</CardTitle>
            <CardDescription>Distribution across SMS, Email, and Calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.campaigns.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{type.toUpperCase()}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{count as number}</div>
                    <div className="text-xs text-muted-foreground">campaigns</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Status Breakdown</CardTitle>
            <CardDescription>Current state of all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.campaigns.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{count as number}</div>
                    <div className="text-xs text-muted-foreground">campaigns</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Media Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Performance</CardTitle>
          <CardDescription>Engagement metrics breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                {analytics.socialMedia.engagement.totalLikes.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Likes</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {analytics.socialMedia.engagement.totalComments.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Comments</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {analytics.socialMedia.engagement.totalShares.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Shares</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      {topPosts && topPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Your best content based on engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div
                  key={post._id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50"
                >
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm line-clamp-1">{post.caption}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold">{post.insights.likes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{post.insights.comments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{post.insights.shares}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
