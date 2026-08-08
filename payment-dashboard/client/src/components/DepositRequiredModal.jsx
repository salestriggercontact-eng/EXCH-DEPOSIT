import { X } from 'lucide-react';

export default function DepositRequiredModal({ onClose, onMakeDeposit }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Deposit Required</h2>
            <p className="text-sm text-gray-400 mt-0.5">Functionality is unavailable until first deposit</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-3">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-4 mb-6">
          Access to dashboard functionality is blocked until you make your first USDT deposit.
        </p>

        <button
          onClick={onMakeDeposit}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg text-sm"
        >
          Make Deposit
        </button>
      </div>
    </div>
  );
}
