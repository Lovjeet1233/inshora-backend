"use client";

import { useState, useEffect } from "react";
import { api, handleApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Mail,
  Phone,
  Building,
  MapPin,
  Trash2,
  FolderPlus,
  Search,
  Plus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contact {
  _id: string;
  apolloId: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  departments?: string[];
  seniority?: string;
}

interface ContactList {
  _id: string;
  name: string;
  description?: string;
  contacts: string[];
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [addingToList, setAddingToList] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchLists();
  }, []);

  const fetchContacts = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get("/contacts", { params });
      setContacts(response.data.data);
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const response = await api.get("/contacts/lists");
      setLists(response.data.data);
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    }
  };

  const handleSearch = () => {
    fetchContacts(search);
  };

  const toggleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const selectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((c) => c._id)));
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await api.delete(`/contacts/${contactId}`);
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    setCreatingList(true);
    try {
      const response = await api.post("/contacts/lists", {
        name: newListName,
        description: newListDescription,
        contact_ids: Array.from(selectedContacts),
      });

      toast.success(response.data.message);
      setNewListName("");
      setNewListDescription("");
      setSelectedContacts(new Set());
      setShowNewListDialog(false);
      fetchLists();
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setCreatingList(false);
    }
  };

  const handleAddToList = async () => {
    if (!selectedListId) {
      toast.error("Please select a list");
      return;
    }

    if (selectedContacts.size === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    setAddingToList(true);
    try {
      const response = await api.post(
        `/contacts/lists/${selectedListId}/add-contacts`,
        {
          contact_ids: Array.from(selectedContacts),
        }
      );

      toast.success(response.data.message);
      setSelectedContacts(new Set());
      setSelectedListId("");
      setShowAddToListDialog(false);
      fetchLists();
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setAddingToList(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Contacts</h1>
        <p className="text-slate-600">
          Manage your saved contacts and organize them into lists
        </p>
      </div>

      {/* Search and Actions */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={selectAll}>
              {selectedContacts.size === contacts.length
                ? "Deselect All"
                : "Select All"}
            </Button>

            {selectedContacts.size > 0 && (
              <>
                <Dialog
                  open={showNewListDialog}
                  onOpenChange={setShowNewListDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      New List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New List</DialogTitle>
                      <DialogDescription>
                        Create a new list with {selectedContacts.size} selected
                        contact(s)
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          List Name
                        </label>
                        <Input
                          placeholder="e.g. Texas Leads"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Description (Optional)
                        </label>
                        <Input
                          placeholder="Brief description"
                          value={newListDescription}
                          onChange={(e) =>
                            setNewListDescription(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewListDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateList} disabled={creatingList}>
                        {creatingList ? <LoadingSpinner size={16} /> : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={showAddToListDialog}
                  onOpenChange={setShowAddToListDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Add to List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to List</DialogTitle>
                      <DialogDescription>
                        Add {selectedContacts.size} selected contact(s) to an
                        existing list
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select List
                      </label>
                      <Select value={selectedListId} onValueChange={setSelectedListId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a list" />
                        </SelectTrigger>
                        <SelectContent>
                          {lists.map((list) => (
                            <SelectItem key={list._id} value={list._id}>
                              {list.name} ({list.contacts.length} contacts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddToListDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddToList} disabled={addingToList}>
                        {addingToList ? <LoadingSpinner size={16} /> : "Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {selectedContacts.size > 0 && (
          <div className="mt-4 text-sm text-slate-600">
            {selectedContacts.size} contact(s) selected
          </div>
        )}
      </Card>

      {/* Contacts List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : contacts.length > 0 ? (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <Card
              key={contact._id}
              className={`p-4 transition-all ${
                selectedContacts.has(contact._id)
                  ? "ring-2 ring-indigo-500 bg-indigo-50/50"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedContacts.has(contact._id)}
                  onCheckedChange={() => toggleSelectContact(contact._id)}
                  className="mt-1"
                />

                {contact.photoUrl && (
                  <img
                    src={contact.photoUrl}
                    alt={contact.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {contact.name}
                      </h3>
                      {contact.title && (
                        <p className="text-sm text-slate-600">{contact.title}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {contact.seniority && (
                        <Badge variant="outline">{contact.seniority}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-indigo-600"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}

                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{contact.phone}</span>
                      </div>
                    )}

                    {contact.company && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>{contact.company}</span>
                      </div>
                    )}

                    {(contact.city || contact.state || contact.country) && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>
                          {[contact.city, contact.state, contact.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {contact.departments && contact.departments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.departments.map((dept, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-slate-500">
            No contacts found. Start by generating leads from the Lead Generation
            page.
          </p>
        </Card>
      )}
    </div>
  );
}

