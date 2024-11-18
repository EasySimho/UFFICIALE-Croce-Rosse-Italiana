import express from 'express';
import cors from 'cors';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

const supabase = createClient(
  'https://gewhmnxsxjjowabtldcl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdld2htbnhzeGpqb3dhYnRsZGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MjY0MDAsImV4cCI6MjA0NzUwMjQwMH0.5pPsxBvlDGNfxwLcUgb7eG52vEwCiTHeDnTBGvLqQl8'
);

const db = {
  async getPeople() {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('surname');
    if (error) throw error;
    return data;
  },

  async updatePerson(id, updates) {
    const { data, error } = await supabase
      .from('people')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addPerson(person) {
    const { data, error } = await supabase
      .from('people')
      .insert([{
        ...person,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePerson(id) {
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/people', async (req, res) => {
  try {
    const people = await db.getPeople();
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/people/:id', async (req, res) => {
  try {
    const person = await db.updatePerson(req.params.id, req.body);
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/people', async (req, res) => {
  try {
    const person = await db.addPerson(req.body);
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    await db.deletePerson(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hourly Excel export
cron.schedule('0 * * * *', async () => {
  try {
    const people = await db.getPeople();
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(people);
    XLSX.utils.book_append_sheet(workbook, sheet, "Report");
    
    const buffer = XLSX.write(workbook, { type: 'buffer' });
    await put('reports/latest.xlsx', buffer, { access: 'public' });
  } catch (error) {
    console.error('Export failed:', error);
  }
});

export default app;