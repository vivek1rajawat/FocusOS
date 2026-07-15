import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-6`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose}>
          <X size={18} className="text-slate-400" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

export default Modal;
