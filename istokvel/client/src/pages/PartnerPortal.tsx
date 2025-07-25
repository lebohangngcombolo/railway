// src/pages/PartnerPortal.tsx

import React, { useState } from "react";

const PARTNERS = [
  {
    id: 1,
    name: "Checkers",
    logo: "/logos/checkers.jpg", // <-- changed from .png to .jpg
    category: "Grocery",
    reward: "Get up to 30% back in rewards points on all purchases.",
    link: "https://www.checkers.co.za/",
  },
  {
    id: 2,
    name: "Makro",
    logo: "/logos/makro.jpg", // <-- changed from .png to .jpg
    category: "Grocery",
    reward: "R200 OFF Bulk Grocery Combo for stokvels.",
    link: "https://www.makro.co.za/",
  },
  {
    id: 3,
    name: "AVBOB",
    logo: "/logos/avbob.png",
    category: "Burial",
    reward: "Affordable family funeral cover for members.",
    link: "https://www.avbob.co.za/",
  },
  // ...more partners
];

const categories = ["All", ...Array.from(new Set(PARTNERS.map(p => p.category)))];

const PartnerPortal: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPartners = selectedCategory === "All"
    ? PARTNERS
    : PARTNERS.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Partner Retailers</h1>
      <div className="flex space-x-4 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full border ${selectedCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredPartners.map(partner => (
          <div key={partner.id} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <img
              src={partner.logo}
              alt={partner.name}
              className="w-20 h-20 object-contain mb-4"
              onError={e => (e.currentTarget.src = "/logos/default.png")}
            />
            <h2 className="text-lg font-bold mb-2">{partner.name}</h2>
            <p className="text-gray-600 mb-4 text-center">{partner.reward}</p>
            <a
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Shop Now
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerPortal;
