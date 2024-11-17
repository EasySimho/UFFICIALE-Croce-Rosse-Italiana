import axios from 'axios';
import { Person } from '../types';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3000/api';
export const api = {
  getPeople: async () => {
    const response = await axios.get(`${BASE_URL}/people`);
    return response.data;
  },

  addPerson: async (person: Omit<Person, 'id' | 'boxesReceived' | 'completed'>) => {
    const response = await axios.post(`${BASE_URL}/people`, person);
    return response.data;
  },

  updatePerson: async (id: string, updates: Partial<Person>) => {
    const response = await axios.put(`${BASE_URL}/people/${id}`, updates);
    return response.data;
  },

  deletePerson: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/people/${id}`);
    return response.data;
  }
};