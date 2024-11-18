import express from 'express';
import cors from 'cors';
import * as XLSX from 'xlsx';
import { put, list, del } from '@vercel/blob';
import NodeCache from 'node-cache';

const DB_FILE = 'database.xlsx';
const REPORT_FILE = 'report.xlsx';
let latestDbUrl = null; // Cache the latest URL
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

let uploadInProgress = false;
let pendingUpdates = [];

async function uploadFile(fileName, buffer) {
  try {
    console.log(`Uploading ${fileName} to Vercel Blob...`);
    
    // Se c'è già un upload in corso, accoda l'operazione
    if (uploadInProgress) {
      console.log('Upload in progress, queuing update...');
      pendingUpdates.push({ fileName, buffer });
      return null;
    }

    uploadInProgress = true;

    // Upload new file
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const { url } = await put(fileName, blob, {
      access: 'public',
      addRandomSuffix: false
    });

    if (fileName === DB_FILE) {
      latestDbUrl = url;
      cache.set('dbData', buffer);
    }

    console.log(`Successfully uploaded ${fileName}`);
    return url;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  } finally {
    uploadInProgress = false;
    // Process pending updates
    if (pendingUpdates.length > 0) {
      const next = pendingUpdates.shift();
      if (next) {
        uploadFile(next.fileName, next.buffer);
      }
    }
  }
}

async function downloadFile(fileName) {
  try {
    console.log(`Downloading ${fileName} from Vercel Blob...`);
    
    // If we have a cached URL for the DB file, use it
    if (fileName === DB_FILE && latestDbUrl) {
      const response = await fetch(latestDbUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        console.log(`Successfully downloaded ${fileName} from cache`);
        return buffer;
      }
    }

    // Otherwise fetch the list and find the latest file
    const { blobs } = await list();
    const fileBlob = blobs.find(b => b.pathname === fileName);
    
    if (!fileBlob) {
      throw new Error(`File ${fileName} not found`);
    }

    const response = await fetch(fileBlob.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    
    // Update cache if it's the DB file
    if (fileName === DB_FILE) {
      latestDbUrl = fileBlob.url;
    }

    console.log(`Successfully downloaded ${fileName}`);
    return buffer;
  } catch (error) {
    console.error(`Error downloading ${fileName}:`, error);
    throw error;
  }
}

async function initializeDB() {
  try {
    console.log('Initializing database...');
    await downloadFile(DB_FILE);
    await downloadFile(REPORT_FILE);
    console.log('Database files exist, initialization complete');
  } catch {
    console.log('Creating new database files...');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Database");
    const buffer = XLSX.write(workbook, { type: 'buffer' });
    
    await uploadFile(DB_FILE, buffer);
    await uploadFile(REPORT_FILE, buffer);
    console.log('Database initialization complete');
  }
}

const app = express();

app.use(cors());
app.use(express.json());

// Excel styling configuration
const headerStyle = {
  font: { bold: true, color: { rgb: "FF0000" } }, // Red color
  alignment: { horizontal: "center" }
};

const ensureDeliverySchedule = (person) => {
  if (!person.deliverySchedule) {
    person.deliverySchedule = {
      type: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      nextDelivery: new Date().toISOString().split('T')[0]
    };
  }
  return person;
};

app.use(async (req, res, next) => {
  try {
    await initializeDB();
    next();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

// Read data from Excel
async function readData() {
  try {
    const buffer = await downloadFile(DB_FILE);
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    return data.map(person => ({
      ...person,
      deliverySchedule: typeof person.deliverySchedule === 'string' 
        ? JSON.parse(person.deliverySchedule)
        : person.deliverySchedule,
      foodList: typeof person.foodList === 'string'
        ? JSON.parse(person.foodList)
        : person.foodList || []
    }));
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
}

// Write data to both Excel files
async function writeData(data) {
  // Prepare data for Excel, ensuring foodList is stringified
  const preparedData = data.map(person => ({
    ...person,
    deliverySchedule: JSON.stringify(person.deliverySchedule),
    foodList: person.foodList ? JSON.stringify(person.foodList) : undefined
  }));

  // Write complete database
  const dbWorkbook = XLSX.utils.book_new();
  const dbSheet = XLSX.utils.json_to_sheet(preparedData);
  XLSX.utils.book_append_sheet(dbWorkbook, dbSheet, "Database");
  
  const dbBuffer = XLSX.write(dbWorkbook, { type: 'buffer' });
  await uploadFile(DB_FILE, dbBuffer);

  // Create human-readable report
  const reportData = data.map(person => ({
    'Nome': person.name,
    'Cognome': person.surname,
    'Adulti': person.adults,
    'Minori': person.children,
    'Indirizzo': person.address,
    'Telefono': person.phone,
    'Pacchi (Ricevuti/Totali)': `${person.boxesReceived}/${person.boxesNeeded}`,
    'Note': person.notes || '',
    'Consegne': JSON.stringify(person.deliverySchedule) // Aggiungi questo
  }));

  const reportWorkbook = XLSX.utils.book_new();
  const reportSheet = XLSX.utils.json_to_sheet(reportData, {
    header: ['Nome', 'Cognome', 'Adulti', 'Minori', 'Indirizzo', 'Telefono', 'Pacchi (Ricevuti/Totali)', 'Note']
  });

  // Apply styles to headers
  const range = XLSX.utils.decode_range(reportSheet['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    reportSheet[address].s = headerStyle;
  }

  // Set column widths
  const colWidths = [
    { wch: 15 }, // Nome
    { wch: 15 }, // Cognome
    { wch: 8 },  // Adulti
    { wch: 8 },  // Minori
    { wch: 30 }, // Indirizzo
    { wch: 15 }, // Telefono
    { wch: 20 }, // Pacchi
    { wch: 40 }  // Note
  ];
  reportSheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(reportWorkbook, reportSheet, "Report Assistenza");
  
  const reportBuffer = XLSX.write(reportWorkbook, { type: 'buffer' });
  await uploadFile(REPORT_FILE, reportBuffer);
}

// Routes
app.get('/api/people', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/people/:id', async (req, res) => {
  try {
    console.log(`Fetching person with ID: ${req.params.id}`);
    const data = await readData();
    const person = data.find(p => p.id === req.params.id);
    
    if (!person) {
      console.log(`Person not found with ID: ${req.params.id}`);
      return res.status(404).json({ 
        error: 'Person not found',
        requestedId: req.params.id 
      });
    }

    // Log successful fetch
    console.log(`Successfully found person: ${person.surname} ${person.name}`);
    res.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/people', async (req, res) => {
  try {
    const data = await readData();
    const newPerson = ensureDeliverySchedule({
      ...req.body,
      id: crypto.randomUUID(),
      boxesReceived: 0,
      completed: false
    });
    data.push(newPerson);
    await writeData(data);
    res.json(newPerson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/people/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Person not found' });
    }
    data[index] = ensureDeliverySchedule({
      ...data[index],
      ...req.body
    });
    await writeData(data);
    res.json(data[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    const data = await readData();
    const filtered = data.filter(p => p.id !== req.params.id);
    await writeData(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

// Initialize database and start server
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}