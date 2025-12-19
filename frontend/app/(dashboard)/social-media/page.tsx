"use client";

import { useState } from "react";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Sparkles, Heart, MessageCircle, Share2, Trash2, RefreshCw, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SocialMediaPost } from "@/types";
import { formatDate, truncate } from "@/lib/utils";
import Image from "next/image";

export default function SocialMediaPage() {
  const { 
    posts, 
    isLoading, 
    tokenInfo, 
    isValidatingToken, 
    revalidateToken,
    generateImages, 
    isGenerating, 
    postToFacebook, 
    isPosting, 
    deletePost, 
    refreshInsights, 
    updatePost 
  } = useSocialPosts();
  
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState("professional");
  const [generatedData, setGeneratedData] = useState<{ images: string[]; caption: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [editedCaption, setEditedCaption] = useState("");

  const handleGenerateImages = async () => {
    if (!idea) return;
    
    const result = await generateImages({ idea, style, platform: "facebook" });
    
    // Images are now full GCS URLs, no need to prepend anything
    setGeneratedData(result);
  };

  const handlePostToFacebook = (imageUrl: string) => {
    if (!generatedData) return;
    postToFacebook({ imageUrl, caption: generatedData.caption });
  };

  const handleOpenPostModal = (post: SocialMediaPost) => {
    setSelectedPost(post);
    setEditedCaption(post.caption);
  };

  const handleUpdatePost = () => {
    if (selectedPost) {
      updatePost({ postId: selectedPost.postId, caption: editedCaption });
      setSelectedPost(null);
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
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media Studio</h1>
        <p className="text-muted-foreground">
          Create AI-powered content and manage your social media posts
        </p>
      </div>

      {/* Facebook Token Status */}
      {!isValidatingToken && (
        <Card className={tokenInfo?.isValid ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {tokenInfo?.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {tokenInfo?.isValid ? "Facebook Connected" : "Facebook Token Issue"}
                  </h3>
                  {tokenInfo?.isValid ? (
                    <div className="text-sm text-muted-foreground space-y-1 mt-1">
                      <p>Token Type: {tokenInfo.type}</p>
                      <p>
                        Expires: {tokenInfo.expiresAt ? new Date(tokenInfo.expiresAt).toLocaleDateString() : "Never"}
                      </p>
                      <p>Permissions: {tokenInfo.permissions.join(", ")}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Please check your Facebook token settings. Token must be a Page Access Token with required permissions.
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => revalidateToken()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Revalidate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Content Idea (min. 10 characters)</Label>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe what you want to create... e.g., 'A professional insurance infographic about health coverage'"
              rows={3}
              className={idea.length > 0 && idea.length < 10 ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {idea.length < 10 && idea.length > 0 && (
                  <span className="text-red-500">At least 10 characters required</span>
                )}
              </span>
              <span className={idea.length > 5000 ? "text-red-500" : ""}>
                {idea.length}/5000
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Style</Label>
            <div className="flex gap-2 flex-wrap">
              {["professional", "modern", "vibrant", "luxury", "minimalist"].map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={style === s ? "default" : "outline"}
                  onClick={() => setStyle(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerateImages} disabled={isGenerating || !idea || idea.length < 10 || idea.length > 5000}>
            {isGenerating ? (
              <>
                <LoadingSpinner size={16} className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Images
              </>
            )}
          </Button>

          {/* Generated Images */}
          {generatedData && (
            <div className="mt-6 space-y-4">
              <div>
                <Label>Generated Caption</Label>
                <p className="mt-2 p-3 bg-slate-800 rounded-lg text-sm">
                  {generatedData.caption}
                </p>
              </div>

              <div>
                <Label>Generated Images</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {generatedData.images.map((imageUrl, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-800">
                        <Image
                          src={imageUrl}
                          alt={`Generated ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handlePostToFacebook(imageUrl)}
                        disabled={isPosting || !tokenInfo?.isValid}
                      >
                        {isPosting ? "Posting..." : !tokenInfo?.isValid ? "Token Invalid" : "Post to Facebook"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card
                key={post._id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleOpenPostModal(post)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={post.imageUrl}
                    alt={post.caption}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <Badge
                    className="absolute top-2 right-2"
                    variant={post.status === "published" ? "default" : "secondary"}
                  >
                    {post.status}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm line-clamp-2">{truncate(post.caption, 100)}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.insights.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.insights.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      {post.insights.shares}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                No posts yet. Generate your first AI-powered content above!
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={selectedPost.imageUrl}
                  alt={selectedPost.caption}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <div className="text-2xl font-bold">{selectedPost.insights.likes}</div>
                  <div className="text-xs text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <MessageCircle className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-2xl font-bold">{selectedPost.insights.comments}</div>
                  <div className="text-xs text-muted-foreground">Comments</div>
                </div>
                <div className="text-center">
                  <Share2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <div className="text-2xl font-bold">{selectedPost.insights.shares}</div>
                  <div className="text-xs text-muted-foreground">Shares</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                  <div className="text-2xl font-bold">{selectedPost.insights.engagement.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Engagement</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => refreshInsights(selectedPost.postId)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Insights
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUpdatePost}
                  disabled={editedCaption === selectedPost.caption}
                >
                  Save Caption
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletePost(selectedPost.postId);
                    setSelectedPost(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
