import React from "react";

interface DealDetailModalProps {
  deal: any;
  onClose: () => void;
}

const DealDetailModal: React.FC<DealDetailModalProps> = ({ deal, onClose }) => {
  if (!deal) return null;

  // Example: Customize this for your stokvel group logic
  const stokvelGroup = deal.category === "Burial"
    ? "For Burial Stokvels"
    : deal.category === "Groceries"
    ? "For Savings Stokvels"
    : "For All Stokvel Groups";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-0 relative flex flex-col md:flex-row animate-fade-in">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl z-10"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {/* Image Section */}
        <div className="md:w-1/2 w-full flex-shrink-0">
          <img
            src={deal.image}
            alt={deal.title}
            className="w-full h-64 md:h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none"
          />
        </div>
        {/* Details Section */}
        <div className="md:w-1/2 w-full p-6 flex flex-col">
          <h1 className="text-xl font-bold mb-2">{deal.title}</h1>
          <div className="flex items-center mb-2">
            <span className="text-blue-700 font-semibold mr-4">{deal.partner}</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
              {deal.category}
            </span>
          </div>
          <div className="mb-2 text-sm text-green-700 font-semibold">{stokvelGroup}</div>
          <p className="mb-4 text-gray-700">{deal.description}</p>
          <div className="mb-4">
            <span className="text-lg font-bold text-blue-700">{deal.price}</span>
          </div>
          <div className="mb-4">
            <h2 className="font-semibold mb-1">How to Claim/Book:</h2>
            <ul className="list-disc list-inside text-gray-600">
              <li>
                Contact the partner:{" "}
                <span className="text-gray-400 underline cursor-not-allowed" title="Coming soon">
                  {deal.partner}
                </span>
              </li>
              <li>Show your stokvel membership or use your group code at checkout.</li>
              <li>Follow any instructions provided by the partner.</li>
            </ul>
          </div>
          <div className="mb-4">
            <h2 className="font-semibold mb-1">Terms & Conditions:</h2>
            <p className="text-gray-500 text-sm">
              Offer valid for registered stokvel members only. Subject to availability. See partner website for full details.
            </p>
          </div>
          <div className="mt-auto flex justify-end">
            <button
              type="button"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold cursor-default"
              disabled
            >
              Claim This Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailModal;
