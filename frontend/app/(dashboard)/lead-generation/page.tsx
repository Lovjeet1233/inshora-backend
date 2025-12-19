"use client";

import { useState } from "react";
import { api, handleApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Search, Mail, Phone, Building, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EnrichedLead {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email?: string;
  phone?: string;
  direct_phone?: string;
  title?: string;
  linkedin_url?: string;
  photo_url?: string;
  city?: string;
  state?: string;
  country?: string;
  formatted_address?: string;
  organization?: {
    name?: string;
    [key: string]: any;
  };
  departments?: string[];
  seniority?: string;
  [key: string]: any;
}

export default function LeadGenerationPage() {
  const [titles, setTitles] = useState<string>("");
  const [locations, setLocations] = useState<string>("");
  const [perPage, setPerPage] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EnrichedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!titles.trim() && !locations.trim()) {
      toast.error("Please enter at least one search criteria");
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());

    try {
      const titleArray = titles
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      
      // Parse locations more intelligently
      // Split by pipe (|) or semicolon (;) for multiple locations
      // This allows "Texas, US | California, US" format
      let locationArray: string[] = [];
      if (locations.trim()) {
        if (locations.includes("|")) {
          locationArray = locations.split("|").map((l) => l.trim()).filter((l) => l);
        } else if (locations.includes(";")) {
          locationArray = locations.split(";").map((l) => l.trim()).filter((l) => l);
        } else {
          // Single location
          locationArray = [locations.trim()];
        }
      }

      const response = await api.post("/leads/search-and-enrich", {
        person_titles: titleArray.length > 0 ? titleArray : undefined,
        person_locations: locationArray.length > 0 ? locationArray : undefined,
        per_page: perPage,
      });

      const enrichedResults = response.data.data.enriched_results || [];
      setResults(enrichedResults);
      setTotalEntries(response.data.data.total_entries || 0);

      if (enrichedResults.length === 0) {
        toast.info("No results found. Try different search criteria.");
      } else {
        toast.success(`Found ${enrichedResults.length} leads`);
      }
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    if (selectedLeads.size === results.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(results.map((lead) => lead.id)));
    }
  };

  const handleSaveToContacts = async () => {
    if (selectedLeads.size === 0) {
      toast.error("Please select at least one lead");
      return;
    }

    setSaving(true);

    try {
      const leadsToSave = results.filter((lead) => selectedLeads.has(lead.id));

      const response = await api.post("/leads/save-to-contacts", {
        leads: leadsToSave,
      });

      toast.success(response.data.message);
      setSelectedLeads(new Set());
    } catch (error) {
      const message = await handleApiError(error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Lead Generation
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Search and discover potential leads using Apollo.io
        </p>
      </div>

      {/* Instructions Card */}
      <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              How to Search for Leads
            </h3>
            <div className="space-y-2 text-xs text-blue-800 dark:text-blue-300">
              <div>
                <strong>Job Titles:</strong> Separate multiple titles with commas
                <div className="mt-1 bg-white/50 dark:bg-slate-800/50 p-2 rounded border border-blue-200 dark:border-blue-700 font-mono text-blue-900 dark:text-blue-100">
                  cargo van owner, fleet owner, owner
                </div>
              </div>
              <div>
                <strong>Locations:</strong> Use pipe (|) or semicolon (;) to separate multiple locations
                <div className="mt-1 bg-white/50 dark:bg-slate-800/50 p-2 rounded border border-blue-200 dark:border-blue-700 font-mono text-blue-900 dark:text-blue-100">
                  Texas, US | California, US
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                <strong>💡 Pro Tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                  <li>Keep location format as: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">State, Country</code></li>
                  <li>Try variations of job titles (e.g., "owner" vs "business owner")</li>
                  <li>Start with broader searches, then refine</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Search Form */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Job Titles (comma-separated)
            </label>
            <Input
              placeholder="e.g. cargo van owner, fleet owner, owner"
              value={titles}
              onChange={(e) => setTitles(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Separate multiple titles with commas: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">CEO, Founder, Sales Director</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Locations
            </label>
            <Input
              placeholder="Texas, US | California, US | New York, US"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              disabled={loading}
            />
            <div className="mt-2 space-y-1">
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold min-w-[80px]">Single:</span>
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Texas, US</code>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold min-w-[80px]">Multiple:</span>
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Texas, US | California, US</code>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Important: Keep comma between state and country (e.g., "Texas, US" not "Texas US")
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Results per page
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={perPage}
              onChange={(e) => setPerPage(parseInt(e.target.value) || 10)}
              disabled={loading}
              className="w-32"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <LoadingSpinner size={16} />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Leads
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
              >
                {selectedLeads.size === results.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedLeads.size} of {results.length} selected
              </span>
              {totalEntries > results.length && (
                <Badge variant="secondary">
                  {totalEntries.toLocaleString()} total available
                </Badge>
              )}
            </div>

            {selectedLeads.size > 0 && (
              <Button
                onClick={handleSaveToContacts}
                disabled={saving}
              >
                {saving ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save to Contacts
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {results.map((lead) => (
              <Card
                key={lead.id}
                className={`p-4 transition-all ${
                  selectedLeads.has(lead.id)
                    ? "ring-2 ring-indigo-500 bg-indigo-50/50"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={() => toggleSelectLead(lead.id)}
                    className="mt-1"
                  />

                  {lead.photo_url && (
                    <img
                      src={lead.photo_url}
                      alt={lead.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {lead.name}
                        </h3>
                        {lead.title && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">{lead.title}</p>
                        )}
                      </div>

                      {lead.seniority && (
                        <Badge variant="outline">{lead.seniority}</Badge>
                      )}
                    </div>

                    <div className="space-y-1 mb-3">
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            {lead.email}
                          </a>
                        </div>
                      )}

                      {(lead.phone || lead.direct_phone) && (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>{lead.phone || lead.direct_phone}</span>
                        </div>
                      )}

                      {lead.organization?.name && (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Building className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>{lead.organization.name}</span>
                        </div>
                      )}

                      {(lead.city || lead.state || lead.country) && (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span>
                            {[lead.city, lead.state, lead.country]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {lead.departments && lead.departments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.departments.map((dept, idx) => (
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
        </>
      ) : null}
    </div>
  );
}

