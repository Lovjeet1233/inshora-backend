"use client";

import { useState, useEffect, useRef } from "react";
import { api, handleApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Check,
  Play,
  Volume2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Prompt {
  _id: string;
  name: string;
  description?: string;
  content: string;
  voiceId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "ash", name: "Ash", description: "Clear and precise" },
  { id: "ballad", name: "Ballad", description: "Melodic and smooth" },
  { id: "coral", name: "Coral", description: "Warm and friendly" },
  { id: "echo", name: "Echo", description: "Resonant and deep" },
  { id: "fable", name: "Fable", description: "Used with tts-1/tts-1-hd" },
  { id: "marin", name: "Marin", description: "Recommended for best quality" },
  { id: "nova", name: "Nova", description: "Used with tts-1/tts-1-hd" },
  { id: "onyx", name: "Onyx", description: "Used with tts-1/tts-1-hd" },
  { id: "sage", name: "Sage", description: "Calm and thoughtful" },
  { id: "shimmer", name: "Shimmer", description: "Bright and energetic" },
  { id: "verse", name: "Verse", description: "Versatile and expressive" },
  { id: "cedar", name: "Cedar", description: "Recommended for best quality" },
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    voiceId: "alloy",
    isDefault: false,
  });
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/prompts");
      setPrompts(response.data.data);
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error("Name and content are required");
      return;
    }

    try {
      const response = await api.post("/prompts", formData);
      toast.success(response.data.message);
      setShowCreateDialog(false);
      resetForm();
      fetchPrompts();
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    }
  };

  const handleEdit = async () => {
    if (!selectedPrompt) return;
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error("Name and content are required");
      return;
    }

    try {
      const response = await api.put(`/prompts/${selectedPrompt._id}`, formData);
      toast.success(response.data.message);
      setShowEditDialog(false);
      setSelectedPrompt(null);
      resetForm();
      fetchPrompts();
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;

    try {
      const response = await api.delete(`/prompts/${id}`);
      toast.success(response.data.message);
      fetchPrompts();
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    }
  };

  const handleTestVoice = async (voiceId: string) => {
    setTestingVoice(voiceId);
    try {
      const response = await api.post("/prompts/test-voice", {
        voiceId,
        text: "Hello! This is a sample of the voice. How do you like it?"
      });

      // Play audio
      if (audioRef.current) {
        audioRef.current.src = response.data.data.audio;
        audioRef.current.play();
      }

      toast.success("Playing voice sample");
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setTestingVoice(null);
    }
  };

  const openEditDialog = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || "",
      content: prompt.content,
      voiceId: prompt.voiceId,
      isDefault: prompt.isDefault,
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      content: "",
      voiceId: "alloy",
      isDefault: false,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Voice Call Prompts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage prompts and voice settings for outbound calls
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
              <DialogDescription>
                Create a new voice call prompt with a selected voice
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Prompt Name</Label>
                <Input
                  placeholder="e.g. Sales Call"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Brief description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Prompt Content</Label>
                <Textarea
                  placeholder="Enter the dynamic instruction for the AI voice agent..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div>
                <Label>Voice Selection</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {VOICES.map((voice) => (
                    <Card
                      key={voice.id}
                      className={`p-3 cursor-pointer transition-all ${
                        formData.voiceId === voice.id
                          ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, voiceId: voice.id })
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm dark:text-slate-200">{voice.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {voice.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(voice.id);
                          }}
                          disabled={testingVoice === voice.id}
                        >
                          {testingVoice === voice.id ? (
                            <LoadingSpinner size={16} />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default prompt
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Prompt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Audio player (hidden) */}
      <audio ref={audioRef} className="hidden" />

      {/* Prompts List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : prompts.length > 0 ? (
        <div className="grid gap-4">
          {prompts.map((prompt) => (
            <Card key={prompt._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {prompt.name}
                      </h3>
                      {prompt.isDefault && (
                        <Badge className="bg-green-500">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {prompt.description}
                      </p>
                    )}
                  </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(prompt)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(prompt._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {prompt.content}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Voice: {VOICES.find((v) => v.id === prompt.voiceId)?.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestVoice(prompt.voiceId)}
                  disabled={testingVoice === prompt.voiceId}
                >
                  {testingVoice === prompt.voiceId ? (
                    <LoadingSpinner size={16} />
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-2" />
                      Test Voice
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No prompts yet. Create your first prompt to get started.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Prompt
          </Button>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update your voice call prompt and voice settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Prompt Name</Label>
              <Input
                placeholder="e.g. Sales Call"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Prompt Content</Label>
              <Textarea
                placeholder="Enter the dynamic instruction for the AI voice agent..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
              />
            </div>

            <div>
              <Label>Voice Selection</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {VOICES.map((voice) => (
                  <Card
                    key={voice.id}
                    className={`p-3 cursor-pointer transition-all ${
                      formData.voiceId === voice.id
                        ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, voiceId: voice.id })
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-slate-200">{voice.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {voice.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(voice.id);
                        }}
                        disabled={testingVoice === voice.id}
                      >
                        {testingVoice === voice.id ? (
                          <LoadingSpinner size={16} />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="editIsDefault" className="cursor-pointer">
                Set as default prompt
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

