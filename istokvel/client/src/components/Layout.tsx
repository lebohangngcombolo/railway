import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from './Button';
import logo2 from '../assets/iSTOKVEL2.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hideAuthButtons = location.pathname === "/signup" || 
                         location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center h-16">
              <img src={logo2} alt="i-STOKVEL Logo" className="h-12 w-auto" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-emerald-700 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">Home</Link>
              <Link to="/programs" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">Programs</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">About Us</Link>
              <Link to="/news" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">News</Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">Contact</Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex space-x-4">
              {!hideAuthButtons && (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/login')} 
                    className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-6 py-2 text-base"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/signup')} 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-base"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} pb-4`}>
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">Home</Link>
              <Link to="/programs" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">Programs</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">About Us</Link>
              <Link to="/news" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">News</Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-700 transition-colors duration-200">Contact</Link>
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
                {!hideAuthButtons && (
                  <>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate('/login')} 
                      className="w-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-6 py-2 text-base"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => navigate('/signup')} 
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 text-base"
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with top padding to account for fixed header */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">i-STOKVEL</h3>
              <p className="text-gray-400">Together We Save, Together We Grow.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-blue-400">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Home</Link></li>
                <li><Link to="/programs" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Programs</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-blue-400">Contact Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@istokvel.co.za</li>
                <li>Phone: +27 12 345 6789</li>
                <li>Address: Johannesburg, South Africa</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-blue-400">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} i-STOKVEL. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 