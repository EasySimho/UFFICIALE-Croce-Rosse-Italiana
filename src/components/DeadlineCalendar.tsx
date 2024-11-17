import { format, addWeeks, addMonths, isBefore } from "date-fns";
import { Calendar } from "lucide-react";
import { Person } from "../types";

interface DeadlineCalendarProps {
  people: Person[];
}

export function DeadlineCalendar({ people }: DeadlineCalendarProps) {
  const getNextDeliveries = (person: Person): Date => {
    const currentDate = new Date();

    if (!person.deliverySchedule?.startDate) {
      return currentDate;
    }

    const nextDelivery = new Date(
      person.deliverySchedule.nextDelivery || person.deliverySchedule.startDate
    );

    if (isBefore(nextDelivery, currentDate)) {
      switch (person.deliverySchedule.type) {
        case "weekly":
          return addWeeks(nextDelivery, 1);
        case "monthly":
          return addMonths(nextDelivery, 1);
        case "custom":
          const customDays = person.deliverySchedule.customDays || [];
          if (customDays.length === 0) return nextDelivery;

          const currentDay = currentDate.getDate();
          const nextDay =
            customDays.find((day) => day > currentDay) || customDays[0];
          const nextDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            nextDay
          );

          if (isBefore(nextDate, currentDate)) {
            return new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              customDays[0]
            );
          }
          return nextDate;
        default:
          return nextDelivery;
      }
    }
    return nextDelivery;
  };

  const nextDeliveries = people
    .filter(
      (person) =>
        !person.completed &&
        person.deliverySchedule?.startDate &&
        person.deliverySchedule?.type
    )
    .map((person) => ({
      person,
      nextDelivery: getNextDeliveries(person),
    }))
    .sort((a, b) => a.nextDelivery.getTime() - b.nextDelivery.getTime())
    .slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar className="text-red-600 dark:text-red-400" />
        Prossime Consegne
      </h2>

      <div className="space-y-2">
        {nextDeliveries.length > 0 ? (
          nextDeliveries.map(({ person, nextDelivery }) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {person.surname} {person.name}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {format(nextDelivery, "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {person.deliverySchedule.type === "weekly" &&
                    "Consegna Settimanale"}
                  {person.deliverySchedule.type === "monthly" &&
                    "Consegna Mensile"}
                  {person.deliverySchedule.type === "custom" &&
                    `Giorni: ${person.deliverySchedule.customDays?.join(", ")}`}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            Nessuna consegna programmata
          </div>
        )}
      </div>
    </div>
  );
}
