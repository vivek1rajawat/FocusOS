import AnalyticsView from '../components/analytics/AnalyticsView';

const AnalyticsPage = () => (
  <div className="space-y-5">
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-slate-500">Your productivity, across everything you're working on.</p>
    </div>
    <AnalyticsView />
  </div>
);

export default AnalyticsPage;
