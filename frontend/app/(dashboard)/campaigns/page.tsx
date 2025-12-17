"use client";

import { useState } from "react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Plus, Play, Pause, Mail, Phone, MessageSquare } from "lucide-react";
import { formatDate, getCampaignStatusColor, getCampaignTypeColor } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Contact } from "@/types";
import { toast } from "sonner";

export default function CampaignsPage() {
  const [filter, setFilter] = useState<string>("");
  const { campaigns, isLoading, createCampaign, isCreating, startCampaign, pauseCampaign, uploadCSV } = useCampaigns();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: "",
    type: "sms" as "sms" | "email" | "call" | "all",
    contacts: [] as Contact[],
    messageTemplate: {
      subject: "",
      body: "",
      isHtml: false,
    },
  });

  const [manualContact, setManualContact] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const contacts = await uploadCSV(file);
      setCampaignData((prev) => ({ ...prev, contacts }));
      toast.success(`Uploaded ${contacts.length} contacts`);
    } catch (error) {
      toast.error("Failed to upload CSV");
    }
  };

  const handleAddManualContact = () => {
    if (!manualContact.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    setCampaignData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { ...manualContact }],
    }));

    setManualContact({ name: "", email: "", phone: "" });
    toast.success("Contact added");
  };

  const handleRemoveContact = (index: number) => {
    setCampaignData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
    toast.success("Contact removed");
  };

  const handleCreateCampaign = () => {
    // Validation
    if (!campaignData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    if (campaignData.contacts.length === 0) {
      toast.error("Please add at least one contact");
      return;
    }

    if ((campaignData.type === "email" || campaignData.type === "all") && !campaignData.messageTemplate.subject.trim()) {
      toast.error("Email subject is required");
      return;
    }

    if ((campaignData.type === "sms" || campaignData.type === "email" || campaignData.type === "all") && !campaignData.messageTemplate.body.trim()) {
      toast.error("Message body is required");
      return;
    }

    createCampaign(campaignData as any);
    setShowCreateModal(false);
    setCampaignData({
      name: "",
      type: "sms",
      contacts: [],
      messageTemplate: { subject: "", body: "", isHtml: false },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const filteredCampaigns = campaigns?.filter((campaign) =>
    filter ? campaign.status === filter : true
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your SMS, email, and call campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("")}
        >
          All
        </Button>
        <Button
          variant={filter === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("draft")}
        >
          Draft
        </Button>
        <Button
          variant={filter === "running" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("running")}
        >
          Running
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns && filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
                <TableRow key={campaign._id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge className={getCampaignTypeColor(campaign.type)}>
                      {campaign.type === "sms" && <MessageSquare className="w-3 h-3 mr-1" />}
                      {campaign.type === "email" && <Mail className="w-3 h-3 mr-1" />}
                      {campaign.type === "call" && <Phone className="w-3 h-3 mr-1" />}
                      {campaign.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCampaignStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.totalContacts}</TableCell>
                  <TableCell>
                    {campaign.totalContacts > 0
                      ? `${((campaign.successCount / campaign.totalContacts) * 100).toFixed(1)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {campaign.status === "draft" || campaign.status === "paused" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startCampaign(campaign._id)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      ) : campaign.status === "running" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseCampaign(campaign._id)}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No campaigns found. Create your first campaign to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={campaignData.name}
                onChange={(e) =>
                  setCampaignData({ ...campaignData, name: e.target.value })
                }
                placeholder="Enter campaign name"
              />
            </div>

            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <div className="flex gap-2 flex-wrap">
                {(["sms", "email", "call", "all"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={campaignData.type === type ? "default" : "outline"}
                    onClick={() => setCampaignData({ ...campaignData, type })}
                  >
                    {type === "all" ? "ALL (SMS + Email + Call)" : type.toUpperCase()}
                  </Button>
                ))}
              </div>
              {campaignData.type === "all" && (
                <p className="text-sm text-muted-foreground">
                  ℹ️ All contacts will receive SMS, Email, AND Call one by one
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Upload Contacts (CSV)</Label>
              <Input type="file" accept=".csv" onChange={handleFileUpload} />
              {campaignData.contacts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {campaignData.contacts.length} contacts uploaded
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Or Add Contacts Manually</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Input
                    placeholder="Name *"
                    value={manualContact.name}
                    onChange={(e) =>
                      setManualContact({ ...manualContact, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={manualContact.email}
                    onChange={(e) =>
                      setManualContact({ ...manualContact, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Input
                    placeholder="Phone"
                    type="tel"
                    value={manualContact.phone}
                    onChange={(e) =>
                      setManualContact({ ...manualContact, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddManualContact}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>

              {campaignData.contacts.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium">
                    Contacts ({campaignData.contacts.length})
                  </p>
                  {campaignData.contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact.email && contact.email}
                          {contact.email && contact.phone && " • "}
                          {contact.phone && contact.phone}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContact(index)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(campaignData.type === "email" || campaignData.type === "all") && (
              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input
                  value={campaignData.messageTemplate.subject}
                  onChange={(e) =>
                    setCampaignData({
                      ...campaignData,
                      messageTemplate: {
                        ...campaignData.messageTemplate,
                        subject: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter email subject"
                />
              </div>
            )}

            {(campaignData.type === "sms" || campaignData.type === "email" || campaignData.type === "all") && (
              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea
                  value={campaignData.messageTemplate.body}
                  onChange={(e) =>
                    setCampaignData({
                      ...campaignData,
                      messageTemplate: {
                        ...campaignData.messageTemplate,
                        body: e.target.value,
                      },
                    })
                  }
                  placeholder={
                    campaignData.type === "all" 
                      ? "Enter message body (will be used for SMS, Email, and Call)" 
                      : "Enter message body"
                  }
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
