import axios from 'axios';
import { logger } from '../utils/logger';

const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';

interface ApolloSearchParams {
  person_titles?: string[];
  person_locations?: string[];
  per_page?: number;
  page?: number;
}

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name_obfuscated: string;
  title: string;
  last_refreshed_at: string;
  has_email: boolean;
  has_city: boolean;
  has_state: boolean;
  has_country: boolean;
  has_direct_phone: string;
  organization: {
    name: string;
    has_industry: boolean;
    has_phone: boolean;
    has_city: boolean;
    has_state: boolean;
    has_country: boolean;
    has_zip_code: boolean;
    has_revenue: boolean;
    has_employee_count: boolean;
  };
}

interface ApolloSearchResponse {
  total_entries: number;
  people: ApolloPerson[];
}

interface EnrichedPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url: string;
  title: string;
  email_status: string;
  photo_url: string;
  headline: string;
  email: string;
  organization_id: string;
  employment_history: any[];
  street_address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  formatted_address: string;
  time_zone: string;
  organization: any;
  account_id: string;
  account: any;
  departments: string[];
  subdepartments: string[];
  seniority: string;
  functions: string[];
}

interface BulkMatchResponse {
  status: string;
  error_code: string | null;
  error_message: string | null;
  total_requested_enrichments: number;
  unique_enriched_records: number;
  missing_records: number;
  credits_consumed: number;
  matches: EnrichedPerson[];
}

/**
 * Search for people using Apollo.io API
 */
export async function searchPeople(params: ApolloSearchParams, apiKey: string): Promise<ApolloSearchResponse> {
  try {
    if (!apiKey) {
      throw new Error('Apollo API key is not configured. Please add it in Settings.');
    }

    logger.info(`Searching Apollo.io with params: ${JSON.stringify(params)}`);

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.person_titles) {
      params.person_titles.forEach(title => {
        queryParams.append('person_titles[]', title);
      });
    }
    
    if (params.person_locations) {
      params.person_locations.forEach(location => {
        queryParams.append('person_locations[]', location);
      });
    }
    
    queryParams.append('per_page', (params.per_page || 10).toString());
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }

    const url = `${APOLLO_BASE_URL}/mixed_people/api_search?${queryParams.toString()}`;

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🔍 APOLLO SEARCH REQUEST');
    logger.info(`🔗 Full URL: ${url}`);
    logger.info(`📦 Headers: ${JSON.stringify({ 'x-api-key': apiKey ? '***' : 'MISSING' }, null, 2)}`);

    const response = await axios.post(url, {}, {
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'x-api-key': apiKey
      }
    });

    logger.info(`✅ Apollo search returned ${response.data.people?.length || 0} people`);
    logger.info(`📊 Total entries available: ${response.data.total_entries || 0}`);
    if (response.data.people && response.data.people.length > 0) {
      logger.info(`📋 Sample result: ${JSON.stringify(response.data.people[0], null, 2)}`);
    }
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ APOLLO SEARCH FAILED');
    logger.error(`🔗 URL: ${APOLLO_BASE_URL}/mixed_people/api_search`);
    logger.error(`❌ Error: ${error.message}`);
    if (error.response) {
      logger.error(`❌ Response Status: ${error.response.status}`);
      logger.error(`❌ Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to search people: ${error.message}`);
  }
}

/**
 * Enrich people profiles using bulk match
 */
export async function enrichPeople(personIds: string[], apiKey: string): Promise<BulkMatchResponse> {
  try {
    if (!apiKey) {
      throw new Error('Apollo API key is not configured. Please add it in Settings.');
    }

    const details = personIds.map(id => ({ id }));
    const payload = { details };

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('💎 APOLLO BULK ENRICHMENT REQUEST');
    logger.info(`🔗 URL: ${APOLLO_BASE_URL}/people/bulk_match?reveal_personal_emails=false&reveal_phone_number=false`);
    logger.info(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    logger.info(`📊 Enriching ${personIds.length} profiles`);

    const response = await axios.post(
      `${APOLLO_BASE_URL}/people/bulk_match?reveal_personal_emails=false&reveal_phone_number=false`,
      payload,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    logger.info(`✅ Successfully enriched ${response.data.unique_enriched_records} profiles`);
    logger.info(`📊 Total requested: ${response.data.total_requested_enrichments}`);
    logger.info(`📊 Missing records: ${response.data.missing_records}`);
    logger.info(`💳 Credits consumed: ${response.data.credits_consumed}`);
    if (response.data.matches && response.data.matches.length > 0) {
      logger.info(`📋 Sample enriched profile: ${JSON.stringify(response.data.matches[0], null, 2)}`);
    }
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ APOLLO ENRICHMENT FAILED');
    logger.error(`🔗 URL: ${APOLLO_BASE_URL}/people/bulk_match`);
    logger.error(`❌ Error: ${error.message}`);
    if (error.response) {
      logger.error(`❌ Response Status: ${error.response.status}`);
      logger.error(`❌ Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to enrich people: ${error.message}`);
  }
}

export default {
  searchPeople,
  enrichPeople
};

