import React from 'react';
import { motion } from 'framer-motion';
import { 
  PiggyBank, 
  ShoppingBasket, 
  Cross, 
  Briefcase, 
  TrendingUp,
  ArrowRight,
  Users,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProgramCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  path: string;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ icon: Icon, title, description, features, path }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
  >
    <div className="flex items-center space-x-4 mb-4">
      <div className="bg-blue-100 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 mb-4">{description}</p>
    <ul className="space-y-2 mb-6">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-gray-700">
          <ArrowRight className="w-4 h-4 text-blue-600 mr-2" />
          {feature}
        </li>
      ))}
    </ul>
    <Link 
      to={path}
      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
    >
      Learn More
      <ArrowRight className="w-4 h-4 ml-2" />
    </Link>
  </motion.div>
);

const Programs: React.FC = () => {
  const programs = [
    {
      icon: PiggyBank,
      title: "Savings Stokvel",
      description: "Join a traditional savings group where members contribute regularly and receive payouts on a rotating basis.",
      features: [
        "Regular monthly contributions",
        "Predictable payout schedule",
        "Community support network",
        "Financial discipline tracking"
      ],
      path: "/dashboard/savings"
    },
    {
      icon: ShoppingBasket,
      title: "Grocery Stokvel",
      description: "Pool resources with other members to purchase groceries in bulk at discounted prices.",
      features: [
        "Bulk purchasing power",
        "Regular grocery distributions",
        "Cost savings",
        "Quality product selection"
      ],
      path: "/dashboard/grocery"
    },
    {
      icon: Cross,
      title: "Burial Society",
      description: "Financial support for funeral expenses, providing peace of mind during difficult times.",
      features: [
        "Comprehensive funeral coverage",
        "Emotional support network",
        "Financial assistance",
        "Community support"
      ],
      path: "/dashboard/burial"
    },
    {
      icon: Briefcase,
      title: "Business Stokvel",
      description: "Support for entrepreneurial ventures through collective funding and business mentorship.",
      features: [
        "Business startup funding",
        "Mentorship opportunities",
        "Business networking",
        "Growth support"
      ],
      path: "/dashboard/business"
    },
    {
      icon: TrendingUp,
      title: "Investment Stokvel",
      description: "Group investment in various financial instruments to maximize returns and share profits.",
      features: [
        "Diversified investment portfolio",
        "Professional management",
        "Regular investment updates",
        "Profit sharing"
      ],
      path: "/dashboard/investment"
    }
  ];

  const horizontalNavItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'programs', label: 'Programs', path: '/programs' },
    { id: 'about', label: 'About Us', path: '/about' },
    { id: 'news', label: 'News', path: '/news' },
    { id: 'contact', label: 'Contact', path: '/contact' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              i-STOKVEL
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {horizontalNavItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`text-gray-600 hover:text-blue-700 transition-colors duration-200 ${
                    item.path === '/programs' ? 'font-semibold text-blue-600' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex space-x-4">
              <Link
                to="/login"
                className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg text-base"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg text-base"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Stokvel Programs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our range of stokvel programs designed to help you achieve your financial goals through collective savings and investment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <ProgramCard
              key={index}
              icon={program.icon}
              title={program.title}
              description={program.description}
              features={program.features}
              path={program.path}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Join a Program?
          </h2>
          <p className="text-gray-600 mb-6">
            Sign up today and start your journey towards financial empowerment.
          </p>
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-block"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Programs; 