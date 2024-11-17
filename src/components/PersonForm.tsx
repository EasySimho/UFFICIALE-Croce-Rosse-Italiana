import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Person, DeliverySchedule } from '../types';

interface PersonFormProps {
  onSubmit: (person: Omit<Person, 'id' | 'boxesReceived' | 'completed'>) => void;
}

export function PersonForm({ onSubmit }: PersonFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    adults: 0,
    children: 0,
    address: '',
    comune: '',
    phone: '',
    boxesNeeded: 0,
    notes: '',
    deliverySchedule: {
      type: 'weekly',
      startDate: '',
      nextDelivery: ''
    } as DeliverySchedule
  });

  const [customDays, setCustomDays] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      deliverySchedule: {
        ...formData.deliverySchedule,
        customDays: formData.deliverySchedule.type === 'custom' 
          ? customDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
          : undefined,
        nextDelivery: formData.deliverySchedule.startDate
      }
    };
    onSubmit(finalData);
    setFormData({
      name: '',
      surname: '',
      adults: 0,
      children: 0,
      address: '',
      comune: '',
      phone: '',
      boxesNeeded: 0,
      notes: '',
      deliverySchedule: {
        type: 'weekly',
        startDate: '',
        nextDelivery: ''
      }
    });
    setCustomDays('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name='Nome'
          type="text"
          placeholder="Nome"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
          required
        />
        <input
          name='Cognome'
          type="text"
          placeholder="Cognome"
          value={formData.surname}
          onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
          className="input-field"
          required
        />
        <div className="flex flex-col space-y-4 md:space-y-0 md:space-x-2 md:flex-row">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numero Adulti (18+)
            </label>
            <input
              name='Numero Adulti'
              type="number"
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
              className="input-field"
              min="0"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numero Minori
            </label>
            <input
              name='Numero Minori'
              type="number"
              value={formData.children}
              onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
              className="input-field"
              min="0"
              required
            />
          </div>
        </div>
        <input
          name='Indirizzo'
          type="text"
          placeholder="Indirizzo"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="input-field"
          required
        />
        <input
          name='Comune'
          type="text"
          placeholder="Comune"
          value={formData.comune}
          onChange={(e) => setFormData({ ...formData, comune: e.target.value })}
          className="input-field"
          required
        />
        <input
          name='Telefono'
          type="tel"
          placeholder="Telefono"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="input-field"
          required
        />
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pacchi da Ricevere
          </label>
          <input
            name='Pacchi da Ricevere'
            type="number"
            value={formData.boxesNeeded}
            onChange={(e) => setFormData({ ...formData, boxesNeeded: parseInt(e.target.value) })}
            className="input-field"
            min="1"
            required
          />
        </div>
        
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequenza Consegne
            </label>
            <select

              value={formData.deliverySchedule.type}
              onChange={(e) => setFormData({
                ...formData,
                deliverySchedule: {
                  ...formData.deliverySchedule,
                  type: e.target.value as DeliverySchedule['type']
                }
              })}
              name='Frequenza Consegne'
              className="input-field"
              required
            >
              <option value="weekly">Settimanale</option>
              <option value="monthly">Mensile</option>
              <option value="custom">Giorni Specifici</option>
            </select>
          </div>
          
          {formData.deliverySchedule.type === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giorni del Mese (separati da virgola)
              </label>
              <input
                type="text"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="1, 15, 30"
                className="input-field"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Inizio
            </label>
            <input
              name='Data Inizio'
              type="date"
              value={formData.deliverySchedule.startDate}
              onChange={(e) => setFormData({
                ...formData,
                deliverySchedule: {
                  ...formData.deliverySchedule,
                  startDate: e.target.value
                }
              })}
              className="input-field"
              required
            />
          </div>
        </div>
      </div>
      
      <textarea
        name='Note'
        placeholder="Note specifiche"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="input-field h-24 w-full"
      />
      
      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Aggiungi Persona
      </button>
    </form> 
  );
}