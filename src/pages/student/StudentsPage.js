// src/pages/StudentsPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import StudentModal from './StudentModal'; // Adjust path if needed

// Simple SVG Icons (like Heroicons)
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const XCircleIcon = () => ( // For clear search
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const PencilIcon = () => ( // Edit
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);
const TrashIcon = () => ( // Delete
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [fromStudent, setFromStudent] = useState(0); // This will be used for sequential numbering
    const [toStudent, setToStudent] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [perPage, setPerPage] = useState(10);

    // Filtering State
    const [gradesForFilter, setGradesForFilter] = useState([]);
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [selectedSex, setSelectedSex] = useState('');
    const [loadingFilters, setLoadingFilters] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const initialStudentFormState = { full_name: '', sex: 'Male', date_of_birth: '', grade_id: '', gradeclass_id: '' };
    const [studentDataForModal, setStudentDataForModal] = useState(initialStudentFormState);
    const [modalErrors, setModalErrors] = useState({});
    const [isModalSubmitting, setIsModalSubmitting] = useState(false);

    const searchInputRef = useRef(null);

    // Debounce search term
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500); // 500ms delay
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // Fetch Grades for Filter Dropdown
    useEffect(() => {
        const fetchGrades = async () => {
            setLoadingFilters(true);
            try {
                // Replace with your actual API endpoint for grades
                const res = await axios.get('/grades');
                setGradesForFilter(res.data || []);
            } catch (err) {
                console.error("Failed to fetch grades for filter:", err);
                
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchGrades();
    }, []);


    const fetchStudents = useCallback(async (pageToFetch = 1) => {
        setLoading(true);
        setError(null);
        let params = `page=${pageToFetch}&per_page=${perPage}`;
        if (debouncedSearchTerm) {
            params += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
        }
        if (selectedGradeId) {
            params += `&grade_id=${selectedGradeId}`;
        }
        if (selectedSex) {
            params += `&sex=${selectedSex}`;
        }

        try {
            const res = await axios.get(`/students?${params}`);
            const data = res.data;
            setStudents(data.data);
            setCurrentPage(data.current_page);
            setTotalPages(data.last_page);
            setTotalStudents(data.total);
            setFromStudent(data.from); // API 'from' is 1-indexed start for the current page
            setToStudent(data.to);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch students. Please try again.');
            console.error("Fetch error:", err);
            setStudents([]); // Clear students on error
            setFromStudent(0); // Reset pagination info
            setToStudent(0);
            setTotalStudents(0);
            setTotalPages(1);

        } finally {
            setLoading(false);
        }
    }, [perPage, debouncedSearchTerm, selectedGradeId, selectedSex]); // Added dependencies

    useEffect(() => {
        fetchStudents(currentPage);
    }, [currentPage, fetchStudents]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };
    
    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }

    const handlePerPageChange = (event) => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const handleGradeFilterChange = (event) => {
        setSelectedGradeId(event.target.value);
        setCurrentPage(1); // Reset to page 1 when filter changes
    };

    const handleSexFilterChange = (event) => {
        setSelectedSex(event.target.value);
        setCurrentPage(1); // Reset to page 1 when filter changes
    };

    const resetFiltersAndSearch = () => {
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setSelectedGradeId('');
        setSelectedSex('');
        setCurrentPage(1); // Fetch will be triggered by state changes
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await axios.delete(`/students/${id}`);
                alert('Student deleted successfully.');
                if (students.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                } else {
                    fetchStudents(currentPage);
                }
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete student.');
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false); setModalMode(null); setStudentDataForModal(initialStudentFormState); setModalErrors({});
    };
    const openAddModal = () => {
        setModalMode('add'); setStudentDataForModal(initialStudentFormState); setModalErrors({}); setIsModalOpen(true);
    };
    const openEditModal = (student) => {
        setModalMode('edit');
        setStudentDataForModal({
            id: student.id, full_name: student.full_name, sex: student.sex,
            date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
            grade_id: student.grade_class?.grade_id || student.grade?.id || '',
            gradeclass_id: student.grade_class?.id || '',
        });
        setModalErrors({}); setIsModalOpen(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setIsModalSubmitting(true); setModalErrors({});
        try {
            if (modalMode === 'add') {
                await axios.post('/students', studentDataForModal);
                alert('Student added successfully.');
            } else if (modalMode === 'edit') {
                await axios.put(`/students/${studentDataForModal.id}`, studentDataForModal);
                alert('Student updated successfully.');
            }
            closeModal();
            if (modalMode === 'add' && totalStudents > 0 && totalStudents % perPage === 0) {
                 // If a new student makes a full new page
                 fetchStudents(totalPages + 1); // Go to the new last page
            } else if (modalMode === 'add' && students.length < perPage ) {
                 // If adding to current page and it's not full, refresh current
                 fetchStudents(currentPage);
            } else if (modalMode === 'add') {
                 // Default to last page if unsure or other cases
                 fetchStudents(totalPages);
            }
            else { // For edit or other cases
                 fetchStudents(currentPage);
            }
        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setModalErrors(err.response.data.errors);
            } else {
                alert(err.response?.data?.message || `Failed to ${modalMode} student.`);
            }
        } finally {
            setIsModalSubmitting(false);
        }
    };

    const renderPageNumbers = () => {
        if (totalPages <= 1) return null;
    
        const pageNumbers = [];
        const maxVisiblePages = 5; // Total visible page buttons (e.g., 1 ... 4 5 6 ... 10)
        const pageNeighbours = 1; // How many pages to show around current page
    
        // Always show page 1
        pageNumbers.push(
            <button
                key={1}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                className={`px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${currentPage === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'}`}
            >
                1
            </button>
        );
    
        let startEllipsisNeeded = currentPage > pageNeighbours + 2;
        let endEllipsisNeeded = currentPage < totalPages - pageNeighbours - 1;
    
        if (totalPages <= maxVisiblePages) { // Show all pages if total is small
            startEllipsisNeeded = false;
            endEllipsisNeeded = false;
            for (let i = 2; i < totalPages; i++) {
                pageNumbers.push(renderPageButton(i));
            }
        } else {
            if (startEllipsisNeeded) {
                pageNumbers.push(<span key="start-ellipsis" className="px-3 py-1.5 text-sm text-gray-700">...</span>);
            }
    
            let startPage = Math.max(2, currentPage - pageNeighbours);
            let endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
            
            // Adjust range if near start or end to maintain maxVisiblePages
            if (currentPage < maxVisiblePages - pageNeighbours -1) { // Near the beginning
                endPage = Math.min(totalPages -1, maxVisiblePages - 2); // -2 for page 1 and last page
            }
            if (currentPage > totalPages - (maxVisiblePages - pageNeighbours -1) ) { // Near the end
                startPage = Math.max(2, totalPages - (maxVisiblePages - 3) ); // -3 for page 1, last page and one ellipsis
            }
    
            for (let i = startPage; i <= endPage; i++) {
                if (i !== 1 && i !== totalPages) { // Don't duplicate page 1 or last page
                    pageNumbers.push(renderPageButton(i));
                }
            }
    
            if (endEllipsisNeeded && endPage < totalPages -1) {
                pageNumbers.push(<span key="end-ellipsis" className="px-3 py-1.5 text-sm text-gray-700">...</span>);
            }
        }
    
        // Always show last page if different from page 1
        if (totalPages > 1) {
            pageNumbers.push(renderPageButton(totalPages));
        }
    
        return pageNumbers;
    };
    
    const renderPageButton = (pageNumber) => (
        <button
            key={pageNumber}
            onClick={() => setCurrentPage(pageNumber)}
            disabled={loading}
            className={`px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${currentPage === pageNumber ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'}`}
        >
            {pageNumber}
        </button>
    );

    if (loading && students.length === 0 && !error && !debouncedSearchTerm && !selectedGradeId && !selectedSex && currentPage === 1) { // Added currentPage === 1 for true initial load
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-lg text-gray-500">Loading students...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Students Management</h1>
                    <button
                        onClick={openAddModal}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Student
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Controls: Per Page, Search, Filters */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Per Page */}
                    <div>
                        <label htmlFor="perPage" className="block text-sm font-medium text-gray-700 mb-1">Show entries:</label>
                        <select
                            id="perPage"
                            value={perPage}
                            onChange={handlePerPageChange}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            {[5, 10, 15, 20, 25, 50].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                id="search"
                                ref={searchInputRef}
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                disabled={loading}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {searchTerm && (
                                <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center" title="Clear search">
                                    <XCircleIcon />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grade Filter */}
                    <div>
                        <label htmlFor="gradeFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Grade:</label>
                        <select
                            id="gradeFilter"
                            value={selectedGradeId}
                            onChange={handleGradeFilterChange}
                            disabled={loading || loadingFilters}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="">All Grades</option>
                            {gradesForFilter.map(grade => (
                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Sex Filter */}
                    <div>
                        <label htmlFor="sexFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Sex:</label>
                        <select
                            id="sexFilter"
                            value={selectedSex}
                            onChange={handleSexFilterChange}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="">All Sexes</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                {(debouncedSearchTerm || selectedGradeId || selectedSex) && (
                     <div className="mt-4">
                        <button
                            onClick={resetFiltersAndSearch}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        >
                            Reset All Filters & Search
                        </button>
                    </div>
                )}
            </div>


            {/* Main Content Area: Table or Empty State */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                { !loading && students.length === 0 && !error ? (
                    <div className="text-center py-12 px-6">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="mt-2 text-xl font-medium text-gray-900">No students found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {debouncedSearchTerm || selectedGradeId || selectedSex ? "Try adjusting your search or filters." : "Get started by adding a new student."}
                        </p>
                        {!debouncedSearchTerm && !selectedGradeId && !selectedSex && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    + Add Student
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['ID', 'UID', 'Name', 'Sex', 'Birth Date', 'Grade', 'Class', 'Actions'].map(header => (
                                            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading && students.length === 0 && ( // Skeleton for initial full load with no prior data
                                        Array.from({ length: perPage }).map((_, index) => (
                                            <tr key={`skeleton-initial-${index}`} className="animate-pulse">
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                            </tr>
                                        ))
                                    )}
                                    {!loading && students.map((student, index) => (
                                        <tr key={student.id} className={index % 2 === 0 ? undefined : 'bg-gray-50 hover:bg-gray-100'}>
                                            {/* MODIFIED LINE: Display sequential number using fromStudent and index */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fromStudent + index}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_uid || <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{student.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.sex}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade?.name || <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.grade_class
                                                    ? `${student.grade_class.grade?.name || ''} ${student.grade_class.section || ''} (${student.grade_class.shift || ''})`.trim()
                                                    : <span className="text-gray-400 italic">Unassigned</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition duration-150 flex items-center"
                                                    title="Edit Student"
                                                >
                                                    <PencilIcon/> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="text-red-600 hover:text-red-900 transition duration-150 flex items-center"
                                                    title="Delete Student"
                                                >
                                                    <TrashIcon/> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {loading && students.length > 0 && ( // Skeleton for page change loading when data already exists
                                        Array.from({ length: Math.min(perPage, 3) }).map((_, index) => ( // Show fewer skeletons here
                                            <tr key={`skeleton-load-${index}`} className="animate-pulse">
                                               <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap" colSpan="5"><div className="h-4 bg-gray-200 rounded w-full"></div></td> {/* Adjusted colspan */}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        {totalStudents > 0 && !loading && ( // Simplified: Show if totalStudents > 0 and not loading. `students.length > 0` might be redundant but safe.
                            <div className="py-3 px-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
                                <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                                    Showing <span className="font-medium">{fromStudent || 0}</span> to <span className="font-medium">{toStudent || 0}</span> of <span className="font-medium">{totalStudents}</span> results
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1 || loading}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                            Previous
                                        </button>
                                        <div className="hidden sm:flex items-center space-x-1">
                                           {renderPageNumbers()}
                                        </div>
                                        <div className="sm:hidden text-sm text-gray-700 px-2">Page {currentPage} of {totalPages}</div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages || loading}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            Next
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <StudentModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleModalSubmit}
                studentData={studentDataForModal}
                setStudentData={setStudentDataForModal}
                errors={modalErrors}
                isLoading={isModalSubmitting}
                modalTitle={modalMode === 'add' ? 'Add New Student' : 'Edit Student'}
                
                // Pass grades if your modal needs them for a dropdown (assuming modal fetches them itself or gets from here)
                // grades={gradesForFilter} 
            />
        </div>
    );
};

export default StudentsPage;