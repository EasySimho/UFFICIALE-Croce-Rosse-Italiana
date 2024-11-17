import axios from 'axios';
import { Person } from '../types';

const API_URL = 'http://localhost:3000/api';

export const api = {
  getPeople: async () => {
    const response = await axios.get(`${API_URL}/people`);
    return response.data;
  },

  addPerson: async (person: Omit<Person, 'id' | 'boxesReceived' | 'completed'>) => {
    const response = await axios.post(`${API_URL}/people`, person);
    return response.data;
  },

  updatePerson: async (id: string, updates: Partial<Person>) => {
    const response = await axios.put(`${API_URL}/people/${id}`, updates);
    return response.data;
  },

  deletePerson: async (id: string) => {
    const response = await axios.delete(`${API_URL}/people/${id}`);
    return response.data;
  }
};