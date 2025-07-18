import React from 'react';
import { useNavigate } from 'react-router-dom';
import realistic from '../assets/realistic.png';
import stokvelHero from '../assets/stokvel-hero-section (4).png';
import Button from '../components/Button';
import Layout from '../components/Layout';
import ChatBot from '../components/ChatBot';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero Section with new background image */}
      <div className="relative pt-12 md:pt-20 pb-20 md:pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={stokvelHero}
            alt="Stokvel Hero Section"
            className="w-full h-full object-cover object-center"
            style={{
              opacity: 0.97,
              filter: 'drop-shadow(0 8px 32px rgba(44, 62, 80, 0.18))',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-full md:w-1/2 md:pr-16 mt-10 md:mt-0 text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
                We make stokvels smarter,<br />
                <span className="text-blue-200">secure and more rewarding for free</span>
              </h1>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6 md:px-8 py-3 text-base md:text-lg w-full sm:w-auto shadow-lg"
                >
                  Get Started
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/about')}
                  className="bg-white/10 backdrop-blur-sm text-white border-2 border-white hover:bg-white/20 px-6 md:px-8 py-3 text-base md:text-lg w-full sm:w-auto shadow-lg"
                >
                  Learn More
                </Button>
              </div>
            </div>
            {/* The right half is left empty to let the image show */}
            <div className="hidden md:block w-1/2"></div>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose <span className="text-blue-600">i-STOKVEL</span>?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the future of stokvel management with our innovative platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Digital Stokvel Management - Blue Theme */}
            <div className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-300">Digital Stokvel Management</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Manage contributions, track payouts, and monitor group finances all in one place. 
                Automated reminders and real-time updates keep everyone informed and organized.
              </p>
            </div>

            {/* Real-time Chat Assistance - Purple Theme */}
            <div className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-purple-50">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-600 group-hover:text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors duration-300">Real-time Chat Assistance</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Get instant support whenever you need it. Our AI-powered chat assistant is available 24/7 
                to answer your questions, guide you through processes, and provide immediate solutions.
              </p>
            </div>

            {/* Secure & Cashless Transactions - Green Theme */}
            <div className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-50">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-emerald-600 group-hover:text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors duration-300">Secure & Cashless Transactions</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Enjoy peace of mind with our secure, cashless payment system. Make contributions, receive 
                payouts, and transfer funds safely without handling physical cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Programs</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose from our variety of Stokvel programs designed to meet your financial goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Monthly Savings Program */}
            <div className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Monthly Savings</h3>
              <p className="text-gray-600 mb-4">
                Regular monthly contributions with flexible amounts. Perfect for building emergency funds and achieving short-term goals.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Flexible contribution amounts
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Monthly payouts
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Digital tracking
                </li>
              </ul>
            </div>

            {/* Investment Program */}
            <div className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Investment Stokvel</h3>
              <p className="text-gray-600 mb-4">
                Long-term investment program focused on wealth building through collective investments in various assets.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Professional portfolio management
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Quarterly returns
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Diversified investments
                </li>
              </ul>
            </div>

            {/* Funeral Program */}
            <div className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Funeral Program</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive funeral coverage program providing financial support during difficult times.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Immediate payout
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Comprehensive coverage
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Financial support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Modern Design */}
      <div className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <p className="text-gray-600 text-sm md:text-base">Active Members</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">R5M+</div>
              <p className="text-gray-600 text-sm md:text-base">Total Savings</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600 text-sm md:text-base">Savings Groups</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">98%</div>
              <p className="text-gray-600 text-sm md:text-base">Member Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">Ready to Start Your Savings Journey?</h2>
            <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8">
              Join thousands of members who are already growing their wealth with <span className="text-blue-600">i-STOKVEL</span>
            </p>
            <Button 
              onClick={() => navigate('/signup')} 
              className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 md:px-8 py-3 text-base md:text-lg w-full sm:w-auto"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>

      {/* ChatBot Component */}
      <ChatBot />
    </Layout>
  );
};

export default LandingPage;
