import { useState } from 'react';

//Libs
import {
  format,
  getDay,
  parse,
  startOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';

//Types
import { Task } from '../types';
import { enUS } from 'date-fns/locale';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './data-calendar.css';

//Components
import { EventCard } from './event-card';
import { CustomToolbar } from './custom-toolbar';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DataCalendarProps {
  data: Task[];
}

type Action = 'PREV' | 'NEXT' | 'TODAY';

export const DataCalendar = ({ data }: DataCalendarProps) => {
  const [value, setValue] = useState(
    data.length > 0 ? new Date(data[0].dueDate) : new Date(),
  );

  const events = data.map((task) => ({
    start: new Date(task.dueDate),
    end: new Date(task.dueDate),
    title: task.name,
    project: task.project,
    assignee: task.assignee,
    status: task.status,
    id: task.$id,
  }));

  const handleNavigate = (action: Action) => {
    setValue((value) => {
      if (action === 'PREV') {
        return subMonths(value, 1);
      } else if (action === 'NEXT') {
        return addMonths(value, 1);
      } else if (action === 'TODAY') {
        return new Date();
      }
      return value;
    });
  };

  return (
    <Calendar
      localizer={localizer}
      date={value}
      events={events}
      views={['month']}
      defaultView="month"
      toolbar
      showAllEvents
      className="h-full"
      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
      formats={{
        weekdayFormat: (date, culture, localizer) =>
          localizer?.format(date, 'EEE', culture) ?? '',
      }}
      components={{
        eventWrapper: ({ event }) => (
          <EventCard
            id={event.id}
            title={event.title}
            project={event.project}
            assignee={event.assignee}
            status={event.status}
          />
        ),
        toolbar: () => (
          <CustomToolbar
            date={value}
            onNavigate={handleNavigate}
            format={format}
          />
        ),
      }}
    />
  );
};
