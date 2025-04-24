import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';

const Home = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header Section */}
      <Header />

      {/* Main Content Section */}
      <div className="flex-grow-1">
        <Hero />
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Home;
