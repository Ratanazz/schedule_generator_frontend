// src/pages/StudentsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StudentModal from './StudentModal'; // Adjust path if needed

const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false); // For modal submit
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [fromStudent, setFromStudent] = useState(0);
    const [toStudent, setToStudent] = useState(0);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const initialNewStudentState = {
        full_name: '',
        sex: 'Male',
        date_of_birth: '',
        grade_id: '',
        gradeclass_id: '',
    };
    const [newStudent, setNewStudent] = useState(initialNewStudentState);
    const [createError, setCreateError] = useState({});

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/students?page=${page}`); 
            const data = res.data;
            setStudents(data.data);
            setCurrentPage(data.current_page);
            setTotalPages(data.last_page);
            setTotalStudents(data.total);
            setFromStudent(data.from);
            setToStudent(data.to);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch students. Please try again.');
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents(currentPage);
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await axios.delete(`/students/${id}`);
                alert('Student deleted successfully.');
                if (students.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                } else {
                    fetchStudents(currentPage); // Refetch current page or adjusted page
                }
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete student.');
            }
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);
        setCreateError({});
        try {
            await axios.post('/students', newStudent);
            alert('Student added successfully.');
            setShowModal(false);
            setNewStudent(initialNewStudentState);
            // Fetch the page where the new student might appear,
            // or simply the current page / or last page if you want to see it immediately.
            // For simplicity, refetching current page or last if it's a new page due to addition.
            if (totalStudents % 10 === 0 && totalStudents > 0) { // Assuming 10 items per page
                 fetchStudents(totalPages + 1); // Or fetch a specific page
            } else {
                 fetchStudents(currentPage);
            }

        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setCreateError(err.response.data.errors);
            } else {
                alert(err.response?.data?.message || 'Failed to create student.');
                console.error("Create error:", err.response);
            }
        } finally {
            setLoadingSubmit(false);
        }
    };

    const openAddModal = () => {
        setNewStudent(initialNewStudentState);
        setCreateError({});
        setShowModal(true);
    };

    if (loading && students.length === 0 && !error) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-lg text-gray-500">Loading students...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Students Management</h1>
                <button
                    onClick={openAddModal}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                    + Add Student
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}


            { !loading && students.length === 0 && !error ? (
                <div className="text-center py-10">
                    <p className="text-xl text-gray-500">No students found.</p>
                    <p className="text-gray-400 mt-2">Try adding a new student or adjust your filters.</p>
                </div>
            ) : (
                <>
                    <div className="shadow-lg overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    {['ID', 'UID', 'Name', 'Sex', 'Birth', 'Grade', 'Class', 'Actions'].map(header => (
                                        <th key={header} className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {loading && students.length > 0 && ( // Skeleton rows while loading new page data
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="animate-pulse">
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-3/4"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-1/2"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-full"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-1/3"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-2/3"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-1/2"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-3/4"></div></td>
                                            <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-300 rounded w-1/2"></div></td>
                                        </tr>
                                    ))
                                )}
                                {!loading && students.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{student.id}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{student.student_uid || <span className="text-gray-400">N/A</span>}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{student.full_name}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{student.sex}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{new Date(student.date_of_birth).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{student.grade?.name || <span className="text-gray-400">N/A</span>}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                            {student.grade_class
                                                ? `${student.grade_class.grade?.name || 'N/A'}  ${student.grade_class.section} (${student.grade_class.shift})`
                                                : <span className="text-gray-400">Unassigned</span>}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm whitespace-nowrap">
                                            <Link
                                                to={`/edit-student/${student.id}`} // Ensure your route matches this
                                                className="text-indigo-600 hover:text-indigo-900 font-medium mr-3 transition duration-150"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(student.id)}
                                                className="text-red-600 hover:text-red-900 font-medium transition duration-150"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="py-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                            <div className="text-sm text-gray-600">
                                Showing <span className="font-medium">{fromStudent || 0}</span> to <span className="font-medium">{toStudent || 0}</span> of <span className="font-medium">{totalStudents}</span> results
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || loading}
                                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || loading}
                                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <StudentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleCreateSubmit}
                studentData={newStudent}
                setStudentData={setNewStudent}
                errors={createError}
                isLoading={loadingSubmit}
            />
        </div>
    );
};

export default StudentsPage;