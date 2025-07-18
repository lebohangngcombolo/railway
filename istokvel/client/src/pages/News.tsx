import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { Calendar, User } from 'lucide-react'; // Icons for date and author
import { newsAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const News: React.FC = () => {
  const [newsArticles, setNewsArticles] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await newsAPI.getNews();
        setNewsArticles(response.data);
      } catch (err) {
        console.error('Error fetching news:', err);
        // Handle error appropriately
      }
    };

    fetchNews();
  }, []);

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
            Latest News
          </h1>
          <p className="text-xl text-blue-600 font-semibold">
            Stay updated with the latest from i-STOKVEL.
          </p>
        </motion.div>

        {/* News Articles Grid */}
        <motion.div
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {newsArticles.map(article => (
            <motion.div
              key={article.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col transform hover:scale-[1.02] transition-transform duration-300"
              variants={itemVariants}
            >
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">{article.title}</h3>
                <p className="text-gray-700 text-sm mb-4 flex-grow">{article.excerpt}</p>
                <div className="flex items-center text-gray-500 text-xs mt-auto">
                  <Calendar size={14} className="mr-1" />
                  <span>{article.date}</span>
                  <User size={14} className="ml-4 mr-1" />
                  <span>{article.author}</span>
                </div>
                <a
                  href={article.link}
                  className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium"
                >
                  Read More
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
};

export default News; 