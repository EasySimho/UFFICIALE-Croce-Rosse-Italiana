import express from 'express';
import cors from 'cors';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const DB_PATH = join(__dirname, 'database.xlsx');
const REPORT_PATH = join(__dirname, 'report.xlsx');

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

// Initialize Excel files if they don't exist
async function initializeDB() {
  try {
    await readFile(DB_PATH);
  } catch {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    await writeFile(DB_PATH, XLSX.write(wb, { type: 'buffer' }));
  }
}

// Read data from Excel
async function readData() {
  try {
    const buffer = await readFile(DB_PATH);
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    // Parse deliverySchedule from string if needed
    return data.map(person => ({
      ...person,
      deliverySchedule: typeof person.deliverySchedule === 'string' 
        ? JSON.parse(person.deliverySchedule)
        : person.deliverySchedule || {
            type: 'weekly',
            startDate: new Date().toISOString().split('T')[0],
            nextDelivery: new Date().toISOString().split('T')[0]
          }
    }));
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
}

// Write data to both Excel files
async function writeData(data) {
  // Prepare data for Excel
  const preparedData = data.map(person => ({
    ...person,
    deliverySchedule: JSON.stringify(person.deliverySchedule)
  }));

  // Write complete database
  const dbWorkbook = XLSX.utils.book_new();
  const dbSheet = XLSX.utils.json_to_sheet(preparedData);
  XLSX.utils.book_append_sheet(dbWorkbook, dbSheet, "Database");
  await writeFile(DB_PATH, XLSX.write(dbWorkbook, { type: 'buffer' }));
  
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
  await writeFile(REPORT_PATH, XLSX.write(reportWorkbook, { type: 'buffer' }));
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

// Initialize database and start server
initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta: ${PORT}`);
  });
});