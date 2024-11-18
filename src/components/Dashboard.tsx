import { useState, useEffect } from 'react';
import { PersonForm } from './PersonForm';
import { PersonList } from './PersonList';
import { DeadlineCalendar } from './DeadlineCalendar';
import { ThemeControls } from './ThemeControls';
import { Heart, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Person } from '../types';
import Logo from "../../public/Emblema_CRI.svg";

export function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const data = await api.getPeople();
      setPeople(data);
    } catch (error) {
      console.error('Failed to load people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async (personData: Omit<Person, 'id' | 'boxes_received' | 'completed'>) => {
    try {
      const newPerson = await api.addPerson(personData);
      setPeople([...people, newPerson]);
    } catch (error) {
      console.error('Failed to add person:', error);
    }
  };
  const handleUpdateBoxes = async (id: string, increment: boolean) => {
    const person = people.find(p => p.id === id);
    if (!person) return;

    const newCount = increment ? person.boxes_received + 1 : person.boxes_received - 1;
    const updates = {
      boxes_received: Math.min(Math.max(0, newCount), person.boxes_needed)
    };

    try {
      await api.updatePerson(id, updates);
      setPeople(people.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));
    } catch (error) {
      console.error('Failed to update boxes:', error);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const person = people.find(p => p.id === id);
    if (!person) return;

    try {
      await api.updatePerson(id, { completed: !person.completed });
      setPeople(people.map(p => 
        p.id === id ? { ...p, completed: !p.completed } : p
      ));
    } catch (error) {
      console.error('Failed to toggle complete:', error);
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa persona?')) return;

    try {
      await api.deletePerson(id);
      setPeople(people.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete person:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        <div className="text-xl text-gray-600 dark:text-gray-300">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <header className="bg-red-600 dark:bg-red-800 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <img src={Logo}  className='h-10 w-10'/>
              Croce Rossa Italiana
            </h1>
            <p>
              Comitato di <strong>Biella</strong>
            </p>
            <div className="flex items-center gap-4">
              <ThemeControls />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-700 dark:bg-red-900 hover:bg-red-800 dark:hover:bg-red-950 px-3 py-1 rounded-md transition-colors"
              >
                <LogOut size={16} />
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PersonForm onSubmit={handleAddPerson} />
            <PersonList
              people={people}
              onUpdateBoxes={handleUpdateBoxes}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeletePerson}
            />
          </div>
          <div className="lg:col-span-1">
            <DeadlineCalendar people={people} />
          </div>
        </div>
      </main>
    </div>
  );
}