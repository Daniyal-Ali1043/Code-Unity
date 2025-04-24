import React, { useState } from "react";
import footerLogo from "../assets/vector.png";

const Footer = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <footer className="bg-light py-5">
      <div className="container">
        {/* For mobile screen */}
        <div className="d-block d-md-none">
          <div className="accordion">
            {[
              {
                title: "Categories",
                items: ["C++", "C", "Python", "C#", "Java"],
              },
              {
                title: "About",
                items: [
                  "Careers",
                  "Press & News",
                  "Partnerships",
                  "Privacy Policy",
                  "Terms of Service",
                  "Intellectual Property Claims",
                  "Investor Relations",
                ],
              },
              {
                title: "Support and Education",
                items: [
                  "Help & Support",
                  "Trust & Safety",
                  "Quality Guide",
                  "Fiverr Guides",
                  "Learn (Online Courses)",
                ],
              },
              {
                title: "Community",
                items: [
                  "Register as a Developer",
                  "Invite a Friend",
                  "Discussion Forum",
                ],
              },
              {
                title: "Business Solutions",
                items: ["About Business Solutions", "Codeunity Pro"],
              },
            ].map((section, index) => (
              <div key={index} className="mb-3">
                <h5
                  className="fw-bold d-flex justify-content-between align-items-center"
                  onClick={() => toggleAccordion(index)}
                  style={{ cursor: "pointer" }}
                >
                  {section.title}
                  <span>{activeIndex === index ? "▲" : "▼"}</span>
                </h5>
                {activeIndex === index && (
                  <ul className="list-unstyled mt-2">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* For desktop screen */}
        <div className="row d-none d-md-flex">
          <div className="col-6 col-md-2 mb-4">
            <h5 className="fw-bold">Categories</h5>
            <ul className="list-unstyled">
              <li>C++</li>
              <li>C</li>
              <li>Python</li>
              <li>C#</li>
              <li>Java</li>
            </ul>
          </div>

          <div className="col-6 col-md-2 mb-4">
            <h5 className="fw-bold">About</h5>
            <ul className="list-unstyled">
              <li>Careers</li>
              <li>Press & News</li>
              <li>Partnerships</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Intellectual Property Claims</li>
              <li>Investor Relations</li>
            </ul>
          </div>

          <div className="col-6 col-md-3 mb-4">
            <h5 className="fw-bold">Support and Education</h5>
            <ul className="list-unstyled">
              <li>Help & Support</li>
              <li>Trust & Safety</li>
              <li>Quality Guide</li>
              <li>Fiverr Guides</li>
              <li>Learn (Online Courses)</li>
            </ul>
          </div>

          <div className="col-6 col-md-2 mb-4">
            <h5 className="fw-bold">Community</h5>
            <ul className="list-unstyled">
              <li>Register as a Developer</li>
              <li>Invite a Friend</li>
              <li>Discussion Forum</li>
            </ul>
          </div>

          <div className="col-6 col-md-2 mb-4">
            <h5 className="fw-bold">Business Solutions</h5>
            <ul className="list-unstyled">
              <li>About Business Solutions</li>
              <li>Codeunity Pro</li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <hr />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4">
          <div className="d-flex align-items-center mb-3 mb-md-0">
            <img
              src={footerLogo}
              alt="Logo"
              style={{ width: "40px", height: "auto" }}
              className="me-2"
            />
            <span className="text-muted">
              © Codeunity International Ltd. 2024
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-instagram"></i>
            <i className="fab fa-twitter"></i>
            <i className="fab fa-linkedin-in"></i>
            <i className="fab fa-pinterest"></i>
          </div>

          <div className="d-flex align-items-center gap-3 mt-3 mt-md-0">
            <span>English</span>
            <span>PKR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;