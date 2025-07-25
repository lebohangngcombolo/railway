import React from "react";
import { useParams, useNavigate } from "react-router-dom";

// Example: You'd fetch this from your backend or context in a real app
import { IDEALS } from "./IDeals"; // Export your deals array from IDeals.tsx

const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deal = IDEALS.find(d => d.id === Number(id));

  if (!deal) {
    return <div className="p-8 text-center text-red-500">Deal not found.</div>;
  }

  // Example: Customize this for your stokvel group logic
  const stokvelGroup = deal.category === "Burial"
    ? "For Burial Stokvels"
    : deal.category === "Groceries"
    ? "For Savings Stokvels"
    : "For All Stokvel Groups";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        className="mb-6 text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        &larr; Back to i-Deals
      </button>
      <div className="bg-white rounded-xl shadow p-6">
        <img
          src={deal.image}
          alt={deal.title}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
        <h1 className="text-2xl font-bold mb-2">{deal.title}</h1>
        <div className="flex items-center mb-2">
          <span className="text-blue-700 font-semibold mr-4">{deal.partner}</span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
            {deal.category}
          </span>
        </div>
        <div className="mb-4 text-sm text-green-700 font-semibold">{stokvelGroup}</div>
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
        <div className="mt-6">
          <a
            href={deal.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-bold"
          >
            Go to Partner Site
          </a>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;
