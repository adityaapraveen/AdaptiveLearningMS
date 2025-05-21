import React, { useState, useEffect } from 'react';
import { joinTeacher, getTeacherStudents, getStudentTeachers, unsubscribeFromTeacher } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/TeacherStudentMapping.css';

const TeacherStudentMapping = ({ userRole, userData }) => {
    const [joinCode, setJoinCode] = useState('');
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [unsubscribeConfirm, setUnsubscribeConfirm] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole === 'teacher') {
            fetchStudents();
        } else if (userRole === 'student') {
            fetchTeachers();
        }
    }, [userRole]);

    const handleJoinTeacher = async (e) => {
        e.preventDefault();
        try {
            await joinTeacher(joinCode);
            setSuccess('Successfully joined teacher\'s class');
            setJoinCode('');
            fetchTeachers(); // Refresh the list of teachers
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to join teacher\'s class');
        }
    };

    const handleUnsubscribe = async (teacherUsername) => {
        try {
            await unsubscribeFromTeacher(teacherUsername);
            setSuccess('Successfully unsubscribed from teacher');
            setUnsubscribeConfirm(null);
            fetchTeachers(); // Refresh the list of teachers
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to unsubscribe from teacher');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await getTeacherStudents();
            setStudents(response.data.students);
        } catch (error) {
            setError('Failed to fetch students');
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await getStudentTeachers();
            setTeachers(response.data.teachers);
        } catch (error) {
            setError('Failed to fetch teachers');
        }
    };

    return (
        <div className="teacher-student-mapping">
            <h2>{userRole === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {userRole === 'teacher' && (
                <div className="teacher-section">
                    <div className="code-section">
                        <h3>Your Teacher Code</h3>
                        <div className="code-display">
                            <span>{userData.teacher_code}</span>
                        </div>
                        <p className="code-instructions">
                            Share this code with your students so they can join your class.
                        </p>
                    </div>

                    <div className="students-section">
                        <h3>Your Students</h3>
                        {students.length > 0 ? (
                            <ul className="students-list">
                                {students.map((student, index) => (
                                    <li key={index}>
                                        {student.student_username}
                                        <span className="join-date">
                                            Joined: {new Date(student.joined_at).toLocaleDateString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No students have joined your class yet.</p>
                        )}
                    </div>
                </div>
            )}

            {userRole === 'student' && (
                <div className="student-section">
                    <div className="join-section">
                        <h3>Join a Teacher's Class</h3>
                        <form onSubmit={handleJoinTeacher} className="join-form">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter teacher's code"
                                required
                            />
                            <button type="submit" className="join-btn">
                                Join Class
                            </button>
                        </form>
                    </div>

                    <div className="teachers-section">
                        <h3>Your Teachers</h3>
                        {teachers.length > 0 ? (
                            <ul className="teachers-list">
                                {teachers.map((teacher, index) => (
                                    <li key={index}>
                                        <div className="teacher-info">
                                            <span className="teacher-name">{teacher.teacher_username}</span>
                                            <span className="join-date">
                                                Joined: {new Date(teacher.joined_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {unsubscribeConfirm === teacher.teacher_username ? (
                                            <div className="unsubscribe-confirm">
                                                <p>Are you sure?</p>
                                                <button
                                                    className="confirm-yes"
                                                    onClick={() => handleUnsubscribe(teacher.teacher_username)}
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    className="confirm-no"
                                                    onClick={() => setUnsubscribeConfirm(null)}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="unsubscribe-btn"
                                                onClick={() => setUnsubscribeConfirm(teacher.teacher_username)}
                                            >
                                                Unsubscribe
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You haven't joined any teacher's class yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherStudentMapping; 