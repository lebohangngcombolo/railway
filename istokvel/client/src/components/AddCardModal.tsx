import React, { useState, useRef, useEffect } from "react";
import { X, Lock, CheckCircle } from "lucide-react";
import { toast } from 'react-toastify';

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (card: any) => void;
}

const initialState = {
  cardholder: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  primary: false,
  cardType: "",
};

const AddCardModal: React.FC<AddCardModalProps> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    primary: false,
  });
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);

  const formatCardNumber = (value: string) =>
    value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);

  const formatExpiry = (value: string) => {
    let v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    return v;
  };

  const isCardNumberValid = /^\d{4} \d{4} \d{4} \d{4}$/.test(form.cardNumber);
  const isExpiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry);
  const isCvvValid = /^\d{3}$/.test(form.cvv);
  const isCardholderValid = form.cardholder.length > 2;
  const isFormValid = isCardNumberValid && isExpiryValid && isCvvValid && isCardholderValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setShowSuccess(true);
      setTimeout(() => {
        const payload = {
          cardholder: form.cardholder,
          cardNumber: form.cardNumber,
          expiry: form.expiry,
          cvv: form.cvv,
          primary: form.primary,
        };
        onSave(payload);
        setForm(initialState);
        setShowSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCardApi(cardId);
      toast.success('Successfully deleted');
      // ...other logic, like closing the modal...
    } catch (error) {
      toast.error('Failed to delete card');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (open) {
      setForm(initialState);
      setShowSuccess(false);
      setTouched({});
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-2 p-6 relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Add New Card</h2>

        <div className="flex justify-center mb-6">
          <div className="relative w-80 max-w-full h-44 bg-gradient-to-tr from-blue-700 to-blue-400 rounded-2xl shadow-lg p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="font-mono tracking-widest text-lg">
                {form.cardNumber || "1234 5678 9012 3456"}
              </span>
              <Lock size={18} />
            </div>
            <div className="flex justify-between items-end mt-6">
              <div>
                <div className="uppercase text-xs opacity-70">Cardholder</div>
                <div className="font-semibold text-base">{form.cardholder || "CARDHOLDER"}</div>
              </div>
              <div>
                <div className="uppercase text-xs opacity-70">Expiry</div>
                <div className="font-semibold text-base">{form.expiry || "MM/YY"}</div>
              </div>
            </div>
            {showSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                <CheckCircle className="text-green-400 animate-bounce" size={48} />
              </div>
            )}
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-sm font-medium mb-1">Cardholder Name</label>
            <input
              type="text"
              className="input"
              value={form.cardholder}
              onChange={e => setForm(f => ({ ...f, cardholder: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, cardholder: true }))}
              required
              autoFocus
              placeholder="Full name"
            />
            {!isCardholderValid && touched.cardholder && (
              <div className="text-xs text-red-500 mt-1">Enter a valid name</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Card Number</label>
            <input
              type="text"
              className="input"
              value={form.cardNumber}
              onChange={e => {
                const val = formatCardNumber(e.target.value);
                setForm(f => ({ ...f, cardNumber: val }));
                if (val.replace(/\s/g, "").length === 16) expiryRef.current?.focus();
              }}
              onBlur={() => setTouched(t => ({ ...t, cardNumber: true }))}
              maxLength={19}
              inputMode="numeric"
              required
              placeholder="1234 5678 9012 3456"
            />
            {!isCardNumberValid && touched.cardNumber && (
              <div className="text-xs text-red-500 mt-1">Enter a valid 16-digit card number</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input
                ref={expiryRef}
                type="text"
                className="input"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={e => {
                  const val = formatExpiry(e.target.value);
                  setForm(f => ({ ...f, expiry: val }));
                  if (val.length === 5) cvvRef.current?.focus();
                }}
                onBlur={() => setTouched(t => ({ ...t, expiry: true }))}
                maxLength={5}
                required
              />
              {!isExpiryValid && touched.expiry && (
                <div className="text-xs text-red-500 mt-1">Format: MM/YY</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CVV</label>
              <input
                ref={cvvRef}
                type="password"
                className="input"
                value={form.cvv}
                onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                onBlur={() => setTouched(t => ({ ...t, cvv: true }))}
                maxLength={3}
                inputMode="numeric"
                required
                placeholder="123"
              />
              {!isCvvValid && touched.cvv && (
                <div className="text-xs text-red-500 mt-1">3 digits</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.primary}
              onChange={e => setForm(f => ({ ...f, primary: e.target.checked }))}
              id="primary"
            />
            <label htmlFor="primary" className="text-sm">Set as primary card</label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold mt-2 disabled:opacity-50 transition"
            disabled={!isFormValid || showSuccess}
          >
            {showSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              "Save Card"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;