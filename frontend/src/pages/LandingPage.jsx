import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
    useEffect(() => {
        // Add animation class after component mounts
        const elements = document.querySelectorAll('.animate-on-scroll');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));

        return () => elements.forEach(el => observer.unobserve(el));
    }, []);

    return (
        <div className="landing-container">
            <section className="hero-section">
                <div className="hero-content animate-on-scroll">
                    <h1>Adaptive Learning Management System</h1>
                    <p>Personalized learning experiences tailored to your needs</p>
                    <div className="cta-buttons">
                        <Link to="/login" className="cta-button primary">Login</Link>
                        <Link to="/register" className="cta-button secondary">Register</Link>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="image-container">
                        <img src="./heroo.avif" alt="" />
                    </div>
                </div>
            </section>

            <section className="features-section">
                <h2 className="section-title animate-on-scroll">Key Features</h2>
                <div className="features-grid">
                    <div className="feature-card animate-on-scroll">
                        <div className="feature-icon">📚</div>
                        <h3>Interactive Content</h3>
                        <p>Access a wide range of learning materials tailored to your level</p>
                    </div>
                    <div className="feature-card animate-on-scroll">
                        <div className="feature-icon">📝</div>
                        <h3>Quizzes</h3>
                        <p>Test your knowledge with structured quizzes and assessments</p>
                    </div>
                    <div className="feature-card animate-on-scroll">
                        <div className="feature-icon">👥</div>
                        <h3>Teacher-Student Connection</h3>
                        <p>Connect with teachers and track your learning progress with detailed insights</p>
                    </div>
                    <div className="feature-card animate-on-scroll">
                        <div className="feature-icon">📋</div>
                        <h3>Content Management</h3>
                        <p>Teachers can create and manage learning materials easily</p>
                    </div>
                </div>
            </section>

            <section className="testimonials-section">
                <h2 className="section-title animate-on-scroll">What Our Users Say</h2>
                <div className="testimonials-container">
                    <div className="testimonial-card animate-on-scroll">
                        <p>"This platform has made learning more organized and accessible. The quizzes help me track my understanding."</p>
                        <div className="testimonial-author">- Sarah K., Student</div>
                    </div>
                    <div className="testimonial-card animate-on-scroll">
                        <p>"As an educator, I've seen significant improvement in student engagement since using this LMS."</p>
                        <div className="testimonial-author">- Prof. James Wilson</div>
                    </div>
                </div>
            </section>

            <section className="cta-section animate-on-scroll">
                <h2>Ready to Start Your Learning Journey?</h2>
                <p>Join our community of students and educators</p>
                <Link to="/register" className="cta-button primary">Get Started Now</Link>
            </section>
        </div>
    );
};

export default LandingPage; 