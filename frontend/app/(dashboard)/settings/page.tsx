"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Settings as SettingsType } from "@/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    isUpdating,
    testWhatsApp,
    testingWhatsApp,
    testFacebook,
    testingFacebook
  } = useSettings();
  const [formData, setFormData] = useState<Partial<SettingsType>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = (section: string) => {
    updateSettings(formData);
  };

  const updateField = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...((prev as any)[section] || {}),
        [field]: value,
      },
    }));
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
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your integrations and preferences
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="voice">Voice Call</TabsTrigger>
          <TabsTrigger value="apollo">Apollo.io</TabsTrigger>
          <TabsTrigger value="google">Google AI</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
              <CardDescription>
                Configure your WhatsApp Business API integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-token">Access Token</Label>
                <Input
                  id="whatsapp-token"
                  value={formData.whatsapp?.token || ""}
                  onChange={(e) =>
                    updateField("whatsapp", "token", e.target.value)
                  }
                  placeholder="Enter WhatsApp access token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone">Phone Number ID</Label>
                <Input
                  id="whatsapp-phone"
                  value={formData.whatsapp?.phoneNumberId || ""}
                  onChange={(e) =>
                    updateField("whatsapp", "phoneNumberId", e.target.value)
                  }
                  placeholder="Enter phone number ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-verify">Verify Token</Label>
                <Input
                  id="whatsapp-verify"
                  value={formData.whatsapp?.verifyToken || ""}
                  onChange={(e) =>
                    updateField("whatsapp", "verifyToken", e.target.value)
                  }
                  placeholder="Enter verify token"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmit("whatsapp")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!formData.whatsapp?.phoneNumberId || !formData.whatsapp?.token) {
                      toast.error("Please enter Phone Number ID and Token first");
                      return;
                    }
                    testWhatsApp({
                      phoneNumberId: formData.whatsapp.phoneNumberId,
                      token: formData.whatsapp.token
                    });
                  }}
                  disabled={testingWhatsApp}
                >
                  {testingWhatsApp ? "Testing..." : "Test Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <CardTitle>Facebook Settings</CardTitle>
              <CardDescription>
                Configure your Facebook Page integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook-token">Access Token</Label>
                <Input
                  id="facebook-token"
                  value={formData.facebook?.accessToken || ""}
                  onChange={(e) =>
                    updateField("facebook", "accessToken", e.target.value)
                  }
                  placeholder="Enter Facebook access token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook-page">Page ID</Label>
                <Input
                  id="facebook-page"
                  value={formData.facebook?.pageId || ""}
                  onChange={(e) =>
                    updateField("facebook", "pageId", e.target.value)
                  }
                  placeholder="Enter Facebook page ID"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmit("facebook")}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!formData.facebook?.pageId || !formData.facebook?.accessToken) {
                      toast.error("Please enter Page ID and Access Token first");
                      return;
                    }
                    testFacebook({
                      pageId: formData.facebook.pageId,
                      accessToken: formData.facebook.accessToken
                    });
                  }}
                  disabled={testingFacebook}
                >
                  {testingFacebook ? "Testing..." : "Test Connection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure your SMTP email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={formData.email?.smtpHost || ""}
                    onChange={(e) =>
                      updateField("email", "smtpHost", e.target.value)
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={formData.email?.smtpPort || ""}
                    onChange={(e) =>
                      updateField("email", "smtpPort", parseInt(e.target.value))
                    }
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">SMTP User</Label>
                <Input
                  id="smtp-user"
                  value={formData.email?.smtpUser || ""}
                  onChange={(e) =>
                    updateField("email", "smtpUser", e.target.value)
                  }
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={formData.email?.smtpPassword || ""}
                  onChange={(e) =>
                    updateField("email", "smtpPassword", e.target.value)
                  }
                  placeholder="Enter SMTP password"
                />
              </div>
              <Button
                onClick={() => handleSubmit("email")}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Settings</CardTitle>
              <CardDescription>
                Configure your SMS provider settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-provider">Provider</Label>
                <Input
                  id="sms-provider"
                  value={formData.sms?.provider || ""}
                  onChange={(e) =>
                    updateField("sms", "provider", e.target.value)
                  }
                  placeholder="Twilio, AWS SNS, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-api">API Key</Label>
                <Input
                  id="sms-api"
                  value={formData.sms?.apiKey || ""}
                  onChange={(e) =>
                    updateField("sms", "apiKey", e.target.value)
                  }
                  placeholder="Enter API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-from">From Number</Label>
                <Input
                  id="sms-from"
                  value={formData.sms?.fromNumber || ""}
                  onChange={(e) =>
                    updateField("sms", "fromNumber", e.target.value)
                  }
                  placeholder="+1234567890"
                />
              </div>
              <Button
                onClick={() => handleSubmit("sms")}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Call Settings</CardTitle>
              <CardDescription>
                Configure your outbound call settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice-instruction">Dynamic Instruction</Label>
                <Textarea
                  id="voice-instruction"
                  value={formData.voiceCall?.dynamicInstruction || ""}
                  onChange={(e) =>
                    updateField("voiceCall", "dynamicInstruction", e.target.value)
                  }
                  placeholder="Enter dynamic instructions for the AI voice agent"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voice-sip">SIP Trunk ID</Label>
                  <Input
                    id="voice-sip"
                    value={formData.voiceCall?.sipTrunkId || ""}
                    onChange={(e) =>
                      updateField("voiceCall", "sipTrunkId", e.target.value)
                    }
                    placeholder="Enter SIP trunk ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voice-transfer">Transfer To</Label>
                  <Input
                    id="voice-transfer"
                    value={formData.voiceCall?.transferTo || ""}
                    onChange={(e) =>
                      updateField("voiceCall", "transferTo", e.target.value)
                    }
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice-api">API Key</Label>
                <Input
                  id="voice-api"
                  value={formData.voiceCall?.apiKey || ""}
                  onChange={(e) =>
                    updateField("voiceCall", "apiKey", e.target.value)
                  }
                  placeholder="Enter API key"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voice-id">Voice ID</Label>
                  <Input
                    id="voice-id"
                    value={formData.voiceCall?.voiceId || "21m00Tcm4TlvDq8ikWAM"}
                    onChange={(e) =>
                      updateField("voiceCall", "voiceId", e.target.value)
                    }
                    placeholder="21m00Tcm4TlvDq8ikWAM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voice-provider">Provider</Label>
                  <Input
                    id="voice-provider"
                    value={formData.voiceCall?.provider || "openai"}
                    onChange={(e) =>
                      updateField("voiceCall", "provider", e.target.value)
                    }
                    placeholder="openai"
                  />
                </div>
              </div>
              <Button
                onClick={() => handleSubmit("voice")}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apollo">
          <Card>
            <CardHeader>
              <CardTitle>Apollo.io Settings</CardTitle>
              <CardDescription>
                Configure your Apollo.io API key for lead generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apollo-api">Apollo API Key</Label>
                <Input
                  id="apollo-api"
                  type="password"
                  value={formData.apollo?.apiKey || ""}
                  onChange={(e) =>
                    updateField("apollo", "apiKey", e.target.value)
                  }
                  placeholder="Enter Apollo.io API key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://app.apollo.io/#/settings/integrations/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Apollo.io Settings
                  </a>
                </p>
              </div>
              <Button
                onClick={() => handleSubmit("apollo")}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google">
          <Card>
            <CardHeader>
              <CardTitle>Google AI Settings</CardTitle>
              <CardDescription>
                Configure your Google Gemini API key for AI image generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-api">Google API Key</Label>
                <Input
                  id="google-api"
                  type="password"
                  value={formData.google?.apiKey || ""}
                  onChange={(e) =>
                    updateField("google", "apiKey", e.target.value)
                  }
                  placeholder="Enter Google Gemini API key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <Button
                onClick={() => handleSubmit("google")}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
