import { useEffect, useState } from 'react';
import { ChevronDown, Copy, QrCode, CreditCard, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function Paying() {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [minimumUnlockDeposit, setMinimumUnlockDeposit] = useState(2000);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/deposits/addresses')
      .then((res) => {
        setAddresses(res.data.addresses);
        setMinimumUnlockDeposit(res.data.minimumUnlockDeposit);
        if (res.data.addresses.length) setSelectedCoin(res.data.addresses[0]);
      })
      .catch(() => showToast('Failed to load deposit options', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const popularCoins = addresses.filter((a) => a.isPopular);

  const copyAddress = () => {
    if (!selectedCoin) return;
    navigator.clipboard.writeText(selectedCoin.address);
    showToast('Address copied to clipboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoin) return showToast('Select a coin first', 'error');
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    if (!referenceId) return showToast('Enter your transaction reference ID', 'error');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('coin', selectedCoin.coin);
      formData.append('network', selectedCoin.network);
      formData.append('depositAddress', selectedCoin.address);
      formData.append('referenceId', referenceId);
      if (proofFile) formData.append('paymentProof', proofFile);

      await api.post('/deposits', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Deposit request submitted for review');
      setAmount('');
      setReferenceId('');
      setProofFile(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit deposit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  if (!addresses.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 max-w-2xl">
        No deposit options are available right now. Please check back later.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-8">
        {/* Step 1 */}
        <div>
          <StepHeading n={1} title="Select coin to deposit" subtitle="Select the cryptocurrency you want to deposit into your account" />
          <div className="relative mt-3">
            <button
              onClick={() => setCoinDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3 text-sm hover:border-gray-400"
            >
              <span className="flex items-center gap-2 font-medium text-gray-800">
                <span className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                  {selectedCoin?.coinSymbol?.[0]}
                </span>
                {selectedCoin?.coin}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {coinDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {addresses.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => {
                      setSelectedCoin(a);
                      setCoinDropdownOpen(false);
                      setShowQR(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    {a.coin} <span className="text-gray-400">({a.coinSymbol})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {popularCoins.length > 0 && (
            <div className="mt-4">
              <span className="text-xs text-gray-500">Popular coins:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {popularCoins.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => {
                      setSelectedCoin(a);
                      setShowQR(false);
                    }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                      selectedCoin?._id === a._id ? 'border-primary-500 text-primary-700 bg-primary-50' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {a.coinSymbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled
            title="Card deposits are not available"
            className="mt-4 flex items-center gap-2 bg-gray-200 text-gray-500 text-sm font-medium px-4 py-2.5 rounded-lg cursor-not-allowed"
          >
            <CreditCard size={16} /> Buy crypto with card
          </button>
        </div>

        {/* Step 2 */}
        <div>
          <StepHeading n={2} title="Select network" subtitle="Make sure you selected the same network on the platform where you are withdrawing funds for this deposit" />
          <div className="relative mt-3">
            <button
              onClick={() => setNetworkDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3 text-sm hover:border-gray-400"
            >
              <span className="font-medium text-gray-800">{selectedCoin?.network}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {networkDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="px-4 py-2.5 text-sm text-gray-800 bg-gray-50">{selectedCoin?.network}</div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3 */}
        <div>
          <StepHeading n={3} title="Copy address/Scan QR code" subtitle="Go to your other wallet and paste the address that you copied or you can scan QR code from your mobile device" />
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={selectedCoin?.address || ''}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono"
            />
            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <button
            onClick={() => setShowQR((s) => !s)}
            className="mt-3 flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
          >
            <QrCode size={14} /> {showQR ? 'Hide QR' : 'Show QR'}
          </button>
          {showQR && selectedCoin && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg inline-block">
              <QRCodeSVG value={selectedCoin.address} size={180} />
            </div>
          )}
        </div>

        {/* Submit deposit request */}
        <div className="border-t border-gray-100 pt-6">
          <StepHeading n={4} title="Submit deposit request" subtitle="After sending, enter the amount and transaction reference so admin can verify and approve it" />
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="text-sm text-gray-600">Amount ({selectedCoin?.coinSymbol})</label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`Minimum ${selectedCoin?.minimumDeposit} ${selectedCoin?.coinSymbol}`}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Transaction / reference ID</label>
              <input
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="TXID or reference number"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Upload payment proof (optional)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full mt-1 text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 border-b-2 border-primary-500 inline-block pb-1 mb-3">Important information</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              Send only <strong>{selectedCoin?.coinSymbol}</strong> to this deposit address
            </li>
            <li>
              Ensure the network is <strong>{selectedCoin?.network}</strong>
            </li>
            <li>Deposits via smart contracts are not supported</li>
            <li>Do not send NFTs to this address</li>
          </ul>
          <div className="mt-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700">
            <ShieldAlert size={16} className="text-gray-400" />
            Minimum deposit: {selectedCoin?.minimumDeposit} {selectedCoin?.coinSymbol}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Initial unlock deposit required: {minimumUnlockDeposit} USDT equivalent
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 text-sm">
          <FAQ q="Is it safe to deposit and store my funds here?" a="Yes. Deposits are manually reviewed and approved by our admin team, and your balance is only ever updated after verification - never automatically." />
          <FAQ q="Why don't I see my deposit right away?" a="Deposits are processed manually. Once your transaction is confirmed and reviewed by our team, your balance will be updated and you'll get a notification." />
        </div>
      </div>
    </div>
  );
}

function StepHeading({ n, title, subtitle }) {
  return (
    <div className="flex gap-3">
      <span className="h-6 w-6 shrink-0 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
        {n}
      </span>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div>
      <p className="font-medium text-gray-800">{q}</p>
      <p className="text-gray-500 mt-1">{a}</p>
    </div>
  );
}
