export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Settings {
  _id: string;
  userId: string;
  whatsapp: {
    token: string;
    phoneNumberId: string;
    verifyToken: string;
  };
  facebook: {
    accessToken: string;
    pageId: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
  };
  sms: {
    provider: string;
    apiKey: string;
    fromNumber: string;
  };
  voiceCall: {
    dynamicInstruction: string;
    sipTrunkId: string;
    transferTo: string;
    apiKey: string;
    voiceId: string;
    provider: string;
  };
  leadGeneratorEndpoint: string;
}

export interface Contact {
  name: string;
  phone?: string;
  email?: string;
}

export interface MessageTemplate {
  subject?: string;
  body: string;
  isHtml?: boolean;
}

export interface MethodResult {
  method: "sms" | "email" | "call";
  status: "pending" | "sent" | "failed" | "delivered";
  timestamp: string;
  response?: string;
  error?: string;
}

export interface CampaignResult {
  contactId: string;
  contactName: string;
  methods: MethodResult[];
  overallStatus: "pending" | "partial" | "success" | "failed";
  timestamp: string;
}

export interface Campaign {
  _id: string;
  userId: string;
  name: string;
  type: "sms" | "email" | "call" | "all";
  status: "draft" | "running" | "paused" | "completed";
  contacts: Contact[];
  messageTemplate: MessageTemplate;
  schedule: string;
  results: CampaignResult[];
  totalContacts: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMediaPost {
  _id: string;
  userId: string;
  platform: "facebook" | "instagram";
  postId: string;
  imageUrl: string;
  caption: string;
  status: "draft" | "published" | "deleted";
  insights: {
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
    lastFetched?: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  _id: string;
  userId: string;
  from: string;
  to: string;
  message: string;
  threadId: string;
  direction: "inbound" | "outbound";
  timestamp: string;
  messageId?: string;
  status?: "sent" | "delivered" | "read" | "failed";
}

export interface Conversation {
  threadId: string;
  messages: WhatsAppMessage[];
  lastMessage: WhatsAppMessage;
  unreadCount: number;
}

export interface DashboardAnalytics {
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    successRate: string;
    totalContacts: number;
    successfulContacts: number;
    failedContacts: number;
  };
  socialMedia: {
    totalPosts: number;
    byStatus: Record<string, number>;
    engagement: {
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      averageEngagementRate: string;
    };
  };
  whatsapp: {
    totalMessages: number;
    byDirection: Record<string, number>;
    uniqueConversations: number;
  };
  recentActivity: Array<{
    date: string;
    campaigns: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface GeneratedImages {
  images: string[];
  caption: string;
}

export interface FacebookTokenInfo {
  type: string;
  expiresAt: string | null;
  permissions: string[];
  isValid: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
}
