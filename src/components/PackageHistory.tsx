import { Person } from '../types';
import { format, addWeeks, addMonths, isBefore } from 'date-fns';
import { X, CheckCircle2, Circle } from 'lucide-react';

interface PackageHistoryProps {
  person: Person;
  onClose: () => void;
}

export function PackageHistory({ person, onClose }: PackageHistoryProps) {
  const getNextDeliveries = () => {
    if (!person.delivery_schedule || !person.delivery_schedule.startDate) {
      return [];
    }
    const deliveries = [new Date(person.delivery_schedule.startDate)];
    let nextDelivery = new Date(person.delivery_schedule.startDate);
    
    for (let i = 1; i < person.boxes_needed; i++) {
      switch (person.delivery_schedule.type) {
        case 'weekly':
          nextDelivery = addWeeks(new Date(nextDelivery), 1);
          break;
        case 'monthly':
          nextDelivery = addMonths(new Date(nextDelivery), 1);
          break;
        case 'custom':
          const customDays = person.delivery_schedule.customDays || [];
          const currentDay = nextDelivery.getDate();
          const nextDay = customDays.find(day => day > currentDay) || customDays[0];
          nextDelivery = new Date(
            nextDelivery.getFullYear(),
            nextDelivery.getMonth() + (nextDay <= currentDay ? 1 : 0),
            nextDay
          );
          break;
      }
      deliveries.push(new Date(nextDelivery));
    }
    return deliveries;
  };

  const deliveries = getNextDeliveries();
  const today = new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-96 relative">
        <h2 className="text-xl font-semibold mb-4">Consegne</h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        
        <div className="space-y-2">
          {deliveries.map((date, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 p-2 rounded ${
                index < person.boxes_received 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-gray-50 dark:bg-gray-700/20'
              }`}
            >
              {index < person.boxes_received ? (
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />
              ) : (
                <Circle className="text-gray-400 dark:text-gray-500" size={20} />
              )}
              <span className={
                index < person.boxes_received
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-600 dark:text-gray-400'
              }>
                {format(date, 'dd/MM/yyyy')}
                {isBefore(date, today) && index >= person.boxes_received && 
                  ' (In ritardo)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}