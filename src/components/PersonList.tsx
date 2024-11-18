import { useState } from 'react';
import { Plus, Minus, Check, AlertCircle, Trash2, Package } from 'lucide-react';
import { PackageHistory } from './PackageHistory';
import { Person } from '../types';
import  LoadingSpinner  from './LoadingSpinner';

interface PersonListProps {
  people: Person[];
  onUpdateBoxes: (id: string, increment: boolean) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PersonList({ people, onUpdateBoxes, onToggleComplete, onDelete }: PersonListProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, increment: boolean) => {
    setLoadingId(id);
    try {
      await onUpdateBoxes(id, increment);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {people.map((person) => {
        const canComplete = person.boxesReceived >= person.boxesNeeded;
        return (
          
                
        <div
          key={person.id}
          className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-all hover:shadow-lg relative group
            ${person.completed ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {person.surname} {person.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {person.address}, {person.comune}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tel: {person.phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Composizione Nucleo: {person.adults} adulti (18+), {person.children} minori
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pacchi</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdate(person.id, false)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                    disabled={person.boxesReceived === 0 || loadingId === person.id}
                  >
                    <Minus size={16} className="text-red-600 dark:text-red-400" />
                  </button>
                  <span className="font-semibold">
                    {person.boxesReceived}/{person.boxesNeeded}
                  </span>
                  {loadingId === person.id ? (
                    <LoadingSpinner />
                  ) : (
                    <button
                      onClick={() => handleUpdate(person.id, true)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                      disabled={person.boxesReceived >= person.boxesNeeded || loadingId === person.id}
                    >
                      <Plus size={16} className="text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
              <button
              onClick={() => onToggleComplete(person.id)}
              disabled={!canComplete && !person.completed}
              title={!canComplete ? "Consegna tutti i pacchi prima di completare" : 
                     person.completed ? "Segna come incompleto" : "Segna come completato"}
              className={`p-2 rounded-full transition-colors ${
                !canComplete && !person.completed
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : person.completed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Check size={20} />
            </button>
              <button
                onClick={() => onDelete(person.id)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 transition-colors"
                title="Elimina"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={() => setSelectedPerson(person)}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 transition-colors"
                title="Traccia Pacchi"
              >
                <Package size={20} />
              </button>
            </div>
          </div>
          
          {person.notes && (
            <div className="absolute invisible group-hover:visible bg-white dark:bg-gray-800 p-2 rounded shadow-lg -bottom-2 left-4 transform translate-y-full z-10 max-w-md">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{person.notes}</p>
              </div>
            </div>
          )}
        </div>
      );
      })}
      {selectedPerson && (
        <PackageHistory person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}
    </div>
  );
}