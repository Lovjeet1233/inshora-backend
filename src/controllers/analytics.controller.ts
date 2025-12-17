import { Response } from 'express';
import Campaign from '../models/Campaign';
import SocialMediaPost from '../models/SocialMediaPost';
import WhatsAppMessage from '../models/WhatsAppMessage';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get date range (default to last 30 days)
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate as string)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : new Date();

  const dateFilter = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  // Campaigns analytics
  const [totalCampaigns, campaignsByStatus, campaignsByType] = await Promise.all([
    Campaign.countDocuments({ userId: req.userId, ...dateFilter }),
    Campaign.aggregate([
      { $match: { userId: req.userId, ...dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Campaign.aggregate([
      { $match: { userId: req.userId, ...dateFilter } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
  ]);

  // Calculate campaign success rate
  const campaignStats = await Campaign.aggregate([
    { $match: { userId: req.userId, ...dateFilter } },
    {
      $group: {
        _id: null,
        totalContacts: { $sum: '$totalContacts' },
        totalSuccess: { $sum: '$successCount' },
        totalFailure: { $sum: '$failureCount' }
      }
    }
  ]);

  const campaignSuccessRate = campaignStats[0]
    ? ((campaignStats[0].totalSuccess / campaignStats[0].totalContacts) * 100).toFixed(2)
    : 0;

  // Social media analytics
  const [totalPosts, postsByStatus] = await Promise.all([
    SocialMediaPost.countDocuments({ userId: req.userId, ...dateFilter }),
    SocialMediaPost.aggregate([
      { $match: { userId: req.userId, ...dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  // Calculate total engagement
  const socialStats = await SocialMediaPost.aggregate([
    { $match: { userId: req.userId, status: 'published' } },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: '$insights.likes' },
        totalComments: { $sum: '$insights.comments' },
        totalShares: { $sum: '$insights.shares' },
        avgEngagement: { $avg: '$insights.engagement' }
      }
    }
  ]);

  const socialEngagement = socialStats[0] || {
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgEngagement: 0
  };

  // WhatsApp analytics
  const [totalMessages, messagesByDirection] = await Promise.all([
    WhatsAppMessage.countDocuments({ userId: req.userId, ...dateFilter }),
    WhatsAppMessage.aggregate([
      { $match: { userId: req.userId, ...dateFilter } },
      { $group: { _id: '$direction', count: { $sum: 1 } } }
    ])
  ]);

  // Get unique conversations
  const uniqueConversations = await WhatsAppMessage.distinct('threadId', {
    userId: req.userId,
    ...dateFilter
  });

  // Recent activity (last 7 days trend)
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = await Campaign.aggregate([
    {
      $match: {
        userId: req.userId,
        createdAt: { $gte: last7Days }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      campaigns: {
        total: totalCampaigns,
        byStatus: campaignsByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: campaignsByType.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        successRate: campaignSuccessRate,
        totalContacts: campaignStats[0]?.totalContacts || 0,
        successfulContacts: campaignStats[0]?.totalSuccess || 0,
        failedContacts: campaignStats[0]?.totalFailure || 0
      },
      socialMedia: {
        totalPosts,
        byStatus: postsByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        engagement: {
          totalLikes: socialEngagement.totalLikes,
          totalComments: socialEngagement.totalComments,
          totalShares: socialEngagement.totalShares,
          averageEngagementRate: socialEngagement.avgEngagement.toFixed(2)
        }
      },
      whatsapp: {
        totalMessages,
        byDirection: messagesByDirection.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        uniqueConversations: uniqueConversations.length
      },
      recentActivity: recentActivity.map(item => ({
        date: item._id,
        campaigns: item.count
      })),
      dateRange: {
        start: startDate,
        end: endDate
      }
    }
  });
});

export default { getDashboard };
