import { useEffect, useState, useRef } from 'react';
import { X, Copy, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';

const MINIMUM_UNLOCK_DEPOSIT = 2000;

function formatRemaining(ms) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function UnlockDepositModal({ onClose, onSubmitted }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1); // 1 = form, 2 = pay & confirm
  const [amount, setAmount] = useState(String(MINIMUM_UNLOCK_DEPOSIT));
  const [network, setNetwork] = useState('TRC20');
  const [creating, setCreating] = useState(false);
  const [deposit, setDeposit] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (step !== 2 || !deposit?.expiresAt) return;
    const tick = () => {
      const ms = new Date(deposit.expiresAt).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0) clearInterval(intervalRef.current);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [step, deposit]);

  const handleProceed = async (e) => {
    e.preventDefault();
    if (Number(amount) < MINIMUM_UNLOCK_DEPOSIT) {
      return showToast(`Minimum deposit is ${MINIMUM_UNLOCK_DEPOSIT} USDT`, 'error');
    }
    setCreating(true);
    try {
      const res = await api.post('/deposits/unlock/init', { amount, network });
      setDeposit(res.data.deposit);
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create deposit request', 'error');
    } finally {
      setCreating(false);
    }
  };

  const copyAddress = () => {
    if (!deposit) return;
    navigator.clipboard.writeText(deposit.depositAddress);
    showToast('Address copied to clipboard');
  };

  const handleCancel = async () => {
    if (!deposit) return onClose();
    setBusy(true);
    try {
      await api.patch(`/deposits/unlock/${deposit._id}/cancel`);
      showToast('Deposit cancelled');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSentFunds = async () => {
    if (!deposit) return;
    setBusy(true);
    try {
      await api.patch(`/deposits/unlock/${deposit._id}/sent`);
      showToast('Deposit submitted for admin review');
      onSubmitted?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit', 'error');
    } finally {
      setBusy(false);
    }
  };

  const expired = step === 2 && remainingMs <= 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Deposit USDT</h2>
            <p className="text-sm text-gray-400">Add USDT to your balance</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleProceed} className="space-y-5">
              <p className="text-sm text-gray-600">Create a new deposit request to unlock your account.</p>

              <div>
                <label className="text-sm font-medium text-gray-700">Amount (USDT)</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1.5 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">Minimum: {MINIMUM_UNLOCK_DEPOSIT} USDT</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Network</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {['TRC20', 'BEP20'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNetwork(n)}
                      className={`py-2.5 rounded-lg text-sm font-medium border ${
                        network === n ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60"
              >
                {creating ? 'Creating request...' : 'Proceed'}
              </button>
            </form>
          )}

          {step === 2 && deposit && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium border ${
                  expired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <Clock size={16} />
                {expired ? 'This request has expired' : `Time Remaining ${formatRemaining(remainingMs)}`}
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">Amount To Send</p>
                <p className="text-xl font-semibold text-gray-800 mt-1">
                  {Number(deposit.amount).toFixed(6)} <span className="text-base font-medium">USDT</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-lg px-3 py-2.5">
                Make sure the network matches exactly, otherwise funds may be lost.
              </div>

              {!expired && (
                <div className="flex justify-center py-2">
                  <QRCodeSVG value={deposit.depositAddress} size={180} />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">{deposit.network} Wallet Address</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    readOnly
                    value={deposit.depositAddress}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-mono"
                  />
                  <button onClick={copyAddress} className="border border-gray-300 rounded-lg px-3 text-gray-600 hover:bg-gray-50">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <p className="text-sm font-medium text-blue-700 mb-1">Instructions</p>
                <ul className="text-sm text-blue-700 space-y-0.5 list-disc list-inside">
                  <li>Send exactly {Number(deposit.amount).toFixed(0)} USDT to the address above</li>
                  <li>Use {deposit.network} network only</li>
                  <li>Complete within the time limit</li>
                  <li>Your balance updates once admin reviews and approves the deposit</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60"
                >
                  Cancel deposit
                </button>
                <button
                  onClick={handleSentFunds}
                  disabled={busy || expired}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60"
                >
                  I sent funds
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
