import React, { useState } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion'; // Import motion for animations
import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Linkedin } from 'lucide-react'; // Importing more icons

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    }
    setIsSubmitting(false);
  };


  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Header Section */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Get in Touch
          </h1>
          <p className="text-xl text-blue-600 font-semibold">
            We'd love to hear from you. Reach out to us through the options below.
          </p>
        </motion.div>

        <motion.div
          className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Contact Information Section */}
          <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">Contact Information</h2>

            <motion.div className="flex items-start space-x-4" variants={itemVariants}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Address</h3>
                <p className="text-gray-700">info@istokvel.co.za</p>
              </div>
            </motion.div>

            <motion.div className="flex items-start space-x-4" variants={itemVariants}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phone Number</h3>
                <p className="text-gray-700">+27 12 345 6789</p>
              </div>
            </motion.div>

             <motion.div className="flex items-start space-x-4" variants={itemVariants}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Our Location</h3>
                <p className="text-gray-700">Johannesburg, South Africa</p>
              </div>
            </motion.div>

             <motion.div className="flex items-start space-x-4" variants={itemVariants}>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
                <p className="text-gray-700">Mon - Fri: 9:00 AM - 5:00 PM</p>
                <p className="text-gray-700">Sat - Sun: Closed</p>
              </div>
            </motion.div>

            {/* Social Media Links */}
            <motion.div className="space-y-4" variants={itemVariants}>
                 <h3 className="text-lg font-semibold text-gray-900">Follow Us</h3>
                 <div className="flex space-x-6">
                     <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                         <Facebook size={28} />
                     </a>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                         <Twitter size={28} />
                     </a>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                         <Linkedin size={28} />
                     </a>
                 </div>
             </motion.div>

          </div>

          {/* Contact Form Section */}
          <motion.div className="space-y-6" variants={itemVariants} transition={{ delay: 0.2 }}>
             <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-4">Send us a Message</h2>

             {submitStatus === 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                    role="alert"
                >
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> Your message has been sent.</span>
                </motion.div>
             )}

             {submitStatus === 'error' && (
                <motion.div
                     initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                >
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> There was an issue sending your message. Please try again later.</span>
                </motion.div>
             )}

             <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                     <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                     <input
                         type="text"
                         id="name"
                         name="name"
                         value={formData.name}
                         onChange={handleChange}
                         required
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                 </div>
                  <div>
                     <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                     <input
                         type="email"
                         id="email"
                         name="email"
                         value={formData.email}
                         onChange={handleChange}
                         required
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                 </div>
                  <div>
                     <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                     <input
                         type="text"
                         id="subject"
                         name="subject"
                         value={formData.subject}
                         onChange={handleChange}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                 </div>
                  <div>
                     <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                     <textarea
                         id="message"
                         name="message"
                         value={formData.message}
                         onChange={handleChange}
                         rows={4}
                         required
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     ></textarea>
                 </div>
                 <div>
                     <button
                         type="submit"
                         disabled={isSubmitting}
                         className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                     >
                         {isSubmitting ? 'Sending...' : 'Send Message'}
                     </button>
                 </div>
             </form>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};


export default Contact; 