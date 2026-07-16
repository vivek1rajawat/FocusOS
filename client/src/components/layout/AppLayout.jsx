import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalSearchModal from '../ui/GlobalSearchModal';
import ActiveTimerBar from '../ui/ActiveTimerBar';
import KaiWidget from '../ai/KaiWidget';
import { setMobileSidebarOpen } from '../../features/uiSlice';

const AppLayout = () => {
  const dispatch = useDispatch();
  const searchOpen = useSelector((s) => s.ui.searchOpen);
  const mobileSidebarOpen = useSelector((s) => s.ui.mobileSidebarOpen);
  const closeMobileSidebar = () => dispatch(setMobileSidebarOpen(false));

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={closeMobileSidebar}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onClose={closeMobileSidebar} forceOpen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <ActiveTimerBar />
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      {searchOpen && <GlobalSearchModal />}
      <KaiWidget />
    </div>
  );
};

export default AppLayout;
