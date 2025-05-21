import React, { useState, useEffect } from 'react';
import quizApi from '../../services/quizApi';
import './Quiz.css';

const QuizList = ({ onSelectQuiz, userData, onEditQuiz }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        subject: '',
        level: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async (subject = null, level = null) => {
        try {
            setLoading(true);
            console.log('Fetching quizzes with filters:', { subject, level });
            const response = await quizApi.getQuizzes(subject, level);
            console.log('Quiz response:', response);
            setQuizzes(response.data.quizzes);
            console.log('Quiz response:', {
                total: response.data.total_quizzes,
                filtered: response.data.filtered_count,
                timestamp: new Date(response.data.timestamp * 1000).toLocaleString()
            });
            setError('');
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError('Failed to fetch quizzes. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        console.log('Applying filters:', filters);
        fetchQuizzes(
            filters.subject.trim() || null,
            filters.level || null
        );
    };

    const resetFilters = () => {
        setFilters({ subject: '', level: '' });
        fetchQuizzes();
    };

    const handleQuizSelect = (quiz) => {
        if (onSelectQuiz && typeof onSelectQuiz === 'function') {
            onSelectQuiz(quiz);
        }
    };

    const handleEditQuiz = (e, quiz) => {
        e.stopPropagation(); // Prevent triggering card click (quiz selection)
        if (onEditQuiz && typeof onEditQuiz === 'function') {
            onEditQuiz(quiz);
        }
    };

    const handleDeleteConfirm = (e, quizId) => {
        e.stopPropagation(); // Prevent triggering card click (quiz selection)
        setDeleteConfirm(quizId);
    };

    const handleDeleteCancel = (e) => {
        e.stopPropagation(); // Prevent triggering card click (quiz selection)
        setDeleteConfirm(null);
    };

    const handleDeleteQuiz = async (e, quizId) => {
        e.stopPropagation(); // Prevent triggering card click (quiz selection)
        try {
            await quizApi.deleteQuiz(quizId);
            // Remove the deleted quiz from the state
            setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete quiz:', err);
            alert('Failed to delete quiz. Please try again later.');
        }
    };

    // Check if user is teacher or admin
    const isTeacherOrAdmin = userData && ['teacher', 'admin'].includes(userData.role);

    return (
        <div className="quiz-list-container">
            <h3>Available Quizzes</h3>

            <div className="filter-section">
                <div className="filter-controls">
                    <div className="filter-group">
                        <label htmlFor="subject">Subject:</label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={filters.subject}
                            onChange={handleFilterChange}
                            placeholder="Enter subject name"
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="level">Level:</label>
                        <select
                            id="level"
                            name="level"
                            value={filters.level}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Levels</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    <div className="filter-buttons">
                        <button className="filter-btn" onClick={applyFilters}>Apply Filters</button>
                        <button className="reset-btn" onClick={resetFilters}>Reset</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading quizzes...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : quizzes.length === 0 ? (
                <div className="no-data">No quizzes available.</div>
            ) : (
                <div className="quiz-grid">
                    {quizzes.map((quiz) => (
                        <div key={quiz._id} className="quiz-card" onClick={() => handleQuizSelect(quiz)}>
                            <h4>{quiz.title}</h4>
                            <div className="quiz-info">
                                <p className="quiz-subject">{quiz.subject}</p>
                                <p className="quiz-level">Level: {quiz.level}</p>
                                <p className="quiz-teacher">Created by: {quiz.teacher_username}</p>
                            </div>
                            <div className="quiz-actions">
                                <button className="take-quiz-btn">Take Quiz</button>

                                {/* Edit/Delete buttons only for teachers and admins */}
                                {isTeacherOrAdmin && (
                                    <div className="admin-actions">
                                        <button
                                            className="edit-quiz-btn"
                                            onClick={(e) => handleEditQuiz(e, quiz)}
                                        >
                                            Edit
                                        </button>

                                        {deleteConfirm === quiz._id ? (
                                            <div className="delete-confirm">
                                                <p>Are you sure?</p>
                                                <button
                                                    className="confirm-yes"
                                                    onClick={(e) => handleDeleteQuiz(e, quiz._id)}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    className="confirm-no"
                                                    onClick={handleDeleteCancel}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="delete-quiz-btn"
                                                onClick={(e) => handleDeleteConfirm(e, quiz._id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizList; 