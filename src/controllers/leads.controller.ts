import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { searchPeople, enrichPeople } from '../services/apollo.service';
import Contact from '../models/Contact';
import Settings from '../models/Settings';
import { logger } from '../utils/logger';

// @desc    Search for leads using Apollo.io
// @route   POST /api/leads/search
// @access  Private
export const searchLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Get Apollo API key from settings
  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.apollo?.apiKey) {
    return res.status(400).json({
      success: false,
      message: 'Apollo API key not configured. Please add it in Settings.'
    });
  }

  const { person_titles, person_locations, per_page = 10, page = 1 } = req.body;

  logger.info(`Lead search request: titles=${person_titles}, locations=${person_locations}`);

  const result = await searchPeople({
    person_titles,
    person_locations,
    per_page,
    page
  }, settings.apollo.apiKey);

  return res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Enrich lead profiles
// @route   POST /api/leads/enrich
// @access  Private
export const enrichLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Get Apollo API key from settings
  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.apollo?.apiKey) {
    return res.status(400).json({
      success: false,
      message: 'Apollo API key not configured. Please add it in Settings.'
    });
  }

  const { person_ids } = req.body;

  if (!Array.isArray(person_ids) || person_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'person_ids must be a non-empty array'
    });
  }

  logger.info(`Enriching ${person_ids.length} lead profiles`);

  const result = await enrichPeople(person_ids, settings.apollo.apiKey);

  return res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Search and enrich leads in one call
// @route   POST /api/leads/search-and-enrich
// @access  Private
export const searchAndEnrichLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Get Apollo API key from settings
  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.apollo?.apiKey) {
    return res.status(400).json({
      success: false,
      message: 'Apollo API key not configured. Please add it in Settings.'
    });
  }

  const { person_titles, person_locations, per_page = 10, page = 1 } = req.body;

  logger.info(`Search and enrich request: titles=${person_titles}, locations=${person_locations}`);

  // First, search for people
  const searchResult = await searchPeople({
    person_titles,
    person_locations,
    per_page,
    page
  }, settings.apollo.apiKey);

  if (!searchResult.people || searchResult.people.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        total_entries: 0,
        search_results: [],
        enriched_results: []
      }
    });
  }

  // Extract IDs
  const personIds = searchResult.people.map(person => person.id);

  // Enrich the profiles
  const enrichResult = await enrichPeople(personIds, settings.apollo.apiKey);

  return res.status(200).json({
    success: true,
    data: {
      total_entries: searchResult.total_entries,
      search_results: searchResult.people,
      enriched_results: enrichResult.matches
    }
  });
});

// @desc    Save leads to contacts
// @route   POST /api/leads/save-to-contacts
// @access  Private
export const saveLeadsToContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { leads } = req.body;

  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'leads must be a non-empty array'
    });
  }

  logger.info(`Saving ${leads.length} leads to contacts`);

  const savedContacts = [];
  const errors_list = [];

  for (const lead of leads) {
    try {
      // Check if contact already exists
      const existingContact = await Contact.findOne({
        userId: req.userId,
        apolloId: lead.id
      });

      if (existingContact) {
        logger.info(`Contact already exists: ${lead.name}`);
        savedContacts.push(existingContact);
        continue;
      }

      // Create new contact
      const contact = await Contact.create({
        userId: req.userId,
        apolloId: lead.id,
        firstName: lead.first_name,
        lastName: lead.last_name || lead.last_name_obfuscated || '',
        name: lead.name,
        email: lead.email,
        phone: lead.phone || lead.direct_phone,
        title: lead.title,
        company: lead.organization?.name,
        linkedinUrl: lead.linkedin_url,
        location: lead.formatted_address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        photoUrl: lead.photo_url,
        organization: lead.organization,
        employmentHistory: lead.employment_history,
        departments: lead.departments,
        seniority: lead.seniority,
        rawData: lead
      });

      savedContacts.push(contact);
      logger.info(`Contact saved: ${contact.name}`);
    } catch (error: any) {
      logger.error(`Failed to save contact: ${error.message}`);
      errors_list.push({
        lead: lead.name || lead.id,
        error: error.message
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: `${savedContacts.length} contacts saved successfully`,
    data: {
      saved: savedContacts,
      errors: errors_list
    }
  });
});

export default {
  searchLeads,
  enrichLeads,
  searchAndEnrichLeads,
  saveLeadsToContacts
};

