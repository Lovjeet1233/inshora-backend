import csv from 'csv-parser';
import { Readable } from 'stream';
import { IContact } from '../models/Campaign';

export const parseCSV = (buffer: Buffer): Promise<IContact[]> => {
  return new Promise((resolve, reject) => {
    const contacts: IContact[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (row) => {
        // Normalize column names (handle various CSV formats)
        const contact: IContact = {
          name: row.name || row.Name || row.NAME || '',
          phone: row.phone || row.Phone || row.PHONE || row.mobile || row.Mobile || '',
          email: row.email || row.Email || row.EMAIL || ''
        };

        // Only add if at least name exists
        if (contact.name) {
          contacts.push(contact);
        }
      })
      .on('end', () => {
        resolve(contacts);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

export default { parseCSV };
