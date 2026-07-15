import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalSearchModal from '../ui/GlobalSearchModal';
import ActiveTimerBar from '../ui/ActiveTimerBar';
import KaiWidget from '../ai/KaiWidget';

const AppLayout = () => {
  const searchOpen = useSelector((s) => s.ui.searchOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <ActiveTimerBar />
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      {searchOpen && <GlobalSearchModal />}
      <KaiWidget />
    </div>
  );
};

export default AppLayout;
