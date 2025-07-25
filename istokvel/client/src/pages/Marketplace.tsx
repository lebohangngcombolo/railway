import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive, // Example icon for Marketplace tab
  Heart, // Example icon for My Offers
  Users, // Example icon for Partner Portal
  ShieldCheck, // Example icon for Verified badge
  Filter // Add Filter icon import
} from 'lucide-react'; // Import necessary icons
import { toast } from 'react-hot-toast';
import { marketplaceAPI } from '../services/api';
// Removed unused useAuth import
import MarketplacePurchase from "./MarketplacePurchase";
import PartnerPortal from "./PartnerPortal";
import IDeals from "./IDeals";


// --- Mock Data for Offers ---
interface Offer {
  id: number;
  title: string;
  description: string;
  provider?: string; // e.g., "from AVBOB"
  logo?: string; // Path to logo image if available
  tags?: string[]; // e.g., ["Marketrw", "Travel"]
  verified?: boolean;
  buttonText?: string;
  buttonLink?: string;
}

// Removed unused mockOffers


// --- Offer Card Component ---
interface OfferCardProps {
  offer: Offer;
  navigate: ReturnType<typeof useNavigate>;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, navigate }) => {
  return (
    <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">{offer.title}</h3>
         {offer.provider && <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{offer.provider}</p>}
         {offer.verified && (
           <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/50 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 mb-2">
             <ShieldCheck className="-ml-0.5 mr-1.5 h-3 w-3" />
             Verified
           </span>
         )}
        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{offer.description}</p> {/* Use whitespace-pre-line for \n */}
      </div>
      <div className="mt-4">
        {offer.tags && (
          <div className="flex space-x-2 mb-3">
            {offer.tags.map(tag => (
              <span key={tag} className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        )}
        {offer.buttonText && offer.buttonLink && (
           <button
             onClick={() => {
               if (typeof offer.buttonLink === 'string') {
                 navigate(offer.buttonLink);
               } else {
                 toast.error('Invalid offer link');
               }
             }}
             className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
           >
             {offer.buttonText}
           </button>
         )}
      </div>
    </div>
  );
};

const Marketplace: React.FC = () => {
  // Removed unused user
  const [activeTab, setActiveTab] = useState('marketplace');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Define the sidebar navigation items
  // Removed unused sidebarNavItems

  // Define the marketplace navigation item
  // Removed unused marketplaceNavItem

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await marketplaceAPI.getOffers();
        setOffers(response.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading Marketplace...</div>;

  return (
    <div className="flex-1 p-4">
      <div className="flex justify-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-text">iStokvel Deals</h1>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-border mb-6">
        <nav className="flex justify-center space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('marketplace')}
            aria-label="Switch to marketplace tab"
            role="tab"
            aria-selected={activeTab === 'marketplace'}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'marketplace'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Archive className="inline-block w-4 h-4 mr-2" />
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('my-offers')}
            aria-label="Switch to i-Deals tab"
            role="tab"
            aria-selected={activeTab === 'my-offers'}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my-offers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
             <Heart className="inline-block w-4 h-4 mr-2" />
            i-Deals
          </button>
           <button
            onClick={() => setActiveTab('partner-portal')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'partner-portal'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
             <Users className="inline-block w-4 h-4 mr-2" />
            Partner Portal
          </button>
        </nav>
      </div>

      <div className="w-full flex justify-center mb-6">
        <div className="w-full max-w-3xl flex items-center space-x-4">
          <button
            onClick={() => {/* handle search */}}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {/* <Search className="h-5 w-5" /> */}
            <span>Search Offers</span>
          </button>

          <button
            onClick={() => {/* handle filter */}}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Filter className="h-5 w-5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} navigate={useNavigate()} />
        ))}
      </div>
      {activeTab === "marketplace" && <MarketplacePurchase />}
      {activeTab === "my-offers" && <IDeals />}
      {activeTab === "partner-portal" && <PartnerPortal />}
    </div>
  );
};

export default Marketplace; 