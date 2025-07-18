import React, { useState } from "react";
import { Link } from "react-router-dom";
import DealDetailModal from "../components/DealDetailModal";

// Example deals data (add your own images to public/ideals/)
export const IDEALS = [
  {
    id: 1,
    category: "Travel",
    title: "Durban Beach Holiday",
    image: "/ideals/durban.jpg",
    description: "Save R500 per member on group bookings for 5+ people.",
    price: "From R2,999 pp",
    partner: "UCount Travel",
    link: "/i-deals/1"
  },
  {
    id: 2,
    category: "Groceries",
    title: "Bulk Grocery Combo",
    image: "/ideals/groceries.png",
    description: "R200 OFF when your stokvel buys in bulk at Makro.",
    price: "Save R200",
    partner: "Makro",
    link: "/i-deals/2"
  },
  {
    id: 3,
    category: "Education",
    title: "Back-to-School Supplies",
    image: "/ideals/school.jpg",
    description: "Get 15% off on all school supply bundles for stokvels.",
    price: "Save 15%",
    partner: "Shoprite",
    link: "/i-deals/3"
  },
  {
    id: 4,
    category: "Insurance",
    title: "Family Funeral Plan",
    image: "/ideals/funeral.jpg",
    description: "Affordable family funeral cover for stokvel members.",
    price: "From R99/month",
    partner: "AVBOB",
    link: "/i-deals/4"
  }
  // ...more deals if you have them
];

// Get unique categories
const categories = ["All", ...Array.from(new Set(IDEALS.map(d => d.category)))];

const IDeals: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDeal, setSelectedDeal] = useState(null);

  const filteredDeals =
    selectedCategory === "All"
      ? IDEALS
      : IDEALS.filter(d => d.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">i-Deals</h1>
      <div className="flex space-x-4 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full border font-semibold ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredDeals.map(deal => (
          <div
            key={deal.id}
            className="bg-white rounded-xl shadow p-6 flex flex-col"
          >
            <img
              src={deal.image}
              alt={deal.title}
              className="w-full h-40 object-cover rounded-lg mb-4"
              onError={e => (e.currentTarget.src = "/ideals/default.jpg")}
            />
            <h2 className="text-lg font-bold mb-2">{deal.title}</h2>
            <p className="text-gray-600 mb-2">{deal.description}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 font-semibold">{deal.price}</span>
              <span className="text-xs text-gray-500">by {deal.partner}</span>
            </div>
            <button
              onClick={() => setSelectedDeal(deal)}
              className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold text-center"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
      {selectedDeal && (
        <DealDetailModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  );
};

export default IDeals;