import React from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Users, Lock, Banknote, TrendingUp, CheckCircle } from 'lucide-react';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const AboutUs: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          className="max-w-4xl mx-auto text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: -50 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Empowering Communities Through Smart Finance
          </h1>
          <p className="text-xl text-blue-600 font-semibold">
            Our mission: make stokvels smarter, secure, and more rewarding for free.
          </p>
        </motion.div>

        <motion.section
          className="mb-16 bg-gradient-to-r from-blue-50 to-indigo-50 py-16 rounded-xl shadow-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={itemVariants}>
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-xl">
                <Users size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 text-center md:text-left">
                What is i-STOKVEL?
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  i-STOKVEL is a platform designed to empower South Africans by providing a modern, secure, and accessible way to manage traditional stokvels.
                </p>
                
              </div>
            </motion.div>
            <motion.div variants={itemVariants} transition={{ delay: 0.2 }}>
              <ul className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Create or join various stokvel groups, including savings, grocery, burial, business, and investment.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Effortlessly track contributions and financial goals for your group with ease.</span>
                </li>
                <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Access exclusive marketplace deals from trusted businesses, adding extra value to your contributions.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="mb-16 bg-white py-16 rounded-xl shadow-lg border border-gray-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
             <motion.div variants={itemVariants}>
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-xl">
                <Banknote size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 text-center md:text-left">
                No User Fees. Ever.
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We believe that essential financial tools should be accessible to everyone, regardless of their income. That's why i-STOKVEL is completely free for all users.
              </p>
            </motion.div>
             <motion.div variants={itemVariants} transition={{ delay: 0.2 }}>
              <ul className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>No monthly subscription fees or hidden costs.</span>
                </li>
                <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Free to join and manage any stokvel group on our platform.</span>
                </li>
                <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Transparent and straightforward - what you see is what you get.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="mb-16 bg-gradient-to-r from-purple-50 to-blue-50 py-16 rounded-xl shadow-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
           <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
             <motion.div variants={itemVariants}>
              <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-xl">
                <TrendingUp size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-purple-800 mb-6 text-center md:text-left">
                Value for Businesses
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                i-STOKVEL offers businesses a unique opportunity to connect with a highly engaged and trusted community of motivated individuals.
              </p>
            </motion.div>
             <motion.div variants={itemVariants} transition={{ delay: 0.2 }}>
              <ul className="space-y-4 text-lg text-gray-700 leading-relaxed">
                 <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Direct access to highly trusted community groups actively saving for various purposes.</span>
                </li>
                <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Target customers based on their specific savings goals (e.g., grocery, insurance, burial, travel).</span>
                </li>
                <li className="flex items-start">
                   <CheckCircle size={24} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <span>Run targeted promotions, loyalty deals, and facilitate financial services onboarding directly with stokvel groups.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="bg-white py-16 rounded-xl shadow-lg border border-gray-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
           <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
             <motion.div variants={itemVariants}>
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-xl">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 text-center md:text-left">
                Why i-STOKVEL Works in South Africa
              </h2>
            </motion.div>
             <motion.div variants={itemVariants} transition={{ delay: 0.2 }}>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  Stokvels are a cornerstone of the South African economy and community, with over R49 billion circulating annually and 11 million people participating in these groups.
                </p>
                <p>
                  i-STOKVEL recognizes the power and potential of this economy and makes it more visible, secure, and seamlessly connected to the digital world. We provide the tools for these vital community financial structures to thrive in the digital age.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

      </div>
    </Layout>
  );
};

export default AboutUs; 