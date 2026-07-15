import CalendarView from '../components/calendar/CalendarView';

const CalendarPage = () => (
  <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <p className="text-sm text-slate-500">Every deadline, across every task.</p>
    </div>
    <CalendarView />
  </div>
);

export default CalendarPage;
