// src/pages/StudentListForTeacher.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// StudentModal is no longer needed if there's no add/edit functionality
// import StudentModal from './StudentModal';

// Simple SVG Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const DownloadIcon = ({ className = "w-5 h-5" }) => ( // Export
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const LoadingSpinnerIcon = () => ( // Kept for export button loading state
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const StudentListForTeacher = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [fromStudent, setFromStudent] = useState(0);
    const [toStudent, setToStudent] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [perPage, setPerPage] = useState(10);

    // Filtering State
    const [gradesForFilter, setGradesForFilter] = useState([]);
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [selectedSex, setSelectedSex] = useState('');
    const [loadingFilters, setLoadingFilters] = useState(false);

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    
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
                const res = await axios.get('teacher/grades');
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
            const res = await axios.get(`teacher/students?${params}`);
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
            setStudents([]);
            setFromStudent(0);
            setToStudent(0);
            setTotalStudents(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [perPage, debouncedSearchTerm, selectedGradeId, selectedSex]);

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
        setCurrentPage(1);
    };

    const handleSexFilterChange = (event) => {
        setSelectedSex(event.target.value);
        setCurrentPage(1);
    };

    const resetFiltersAndSearch = () => {
        setSearchTerm('');
        setSelectedGradeId('');
        setSelectedSex('');
        setCurrentPage(1);
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        const queryParts = [];
        if (debouncedSearchTerm) queryParts.push(`search=${encodeURIComponent(debouncedSearchTerm)}`);
        if (selectedGradeId) queryParts.push(`grade_id=${selectedGradeId}`);
        if (selectedSex) queryParts.push(`sex=${selectedSex}`);
        const params = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

        try {
            const response = await axios.get(`teacher/students/export-csv${params}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'students.csv';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            alert('Student data exported successfully.');
        } catch (err) {
            console.error("Export error:", err);
            let errorMessage = 'Failed to export students. Please try again.';
            if (err.response && err.response.data && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
                try {
                    const errorDataText = await err.response.data.text();
                    const errorJson = JSON.parse(errorDataText);
                    errorMessage = `Failed to export students: ${errorJson.message || 'Server error'}`;
                } catch (parseError) { /* Blob was not JSON, stick to generic error */ }
            } else if (err.response?.data?.message) {
                errorMessage = `Failed to export students: ${err.response.data.message}`;
            }
            alert(errorMessage);
        } finally {
            setIsExporting(false);
        }
    };


    const renderPageNumbers = () => {
        if (totalPages <= 1) return null;
        const pageNumbers = [];
        const maxVisiblePages = 5; 
        const pageNeighbours = 1;
        pageNumbers.push(renderPageButton(1));
        let startEllipsisNeeded = currentPage > pageNeighbours + 2;
        let endEllipsisNeeded = currentPage < totalPages - pageNeighbours - 1;
        if (totalPages <= maxVisiblePages) {
            startEllipsisNeeded = false;
            endEllipsisNeeded = false;
            for (let i = 2; i < totalPages; i++) pageNumbers.push(renderPageButton(i));
        } else {
            if (startEllipsisNeeded) pageNumbers.push(<span key="start-ellipsis" className="px-3 py-1.5 text-sm text-gray-700">...</span>);
            let startPage = Math.max(2, currentPage - pageNeighbours);
            let endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
            if (currentPage < maxVisiblePages - pageNeighbours - 1) endPage = Math.min(totalPages - 1, maxVisiblePages - 2);
            if (currentPage > totalPages - (maxVisiblePages - pageNeighbours - 1)) startPage = Math.max(2, totalPages - (maxVisiblePages - 3));
            for (let i = startPage; i <= endPage; i++) if (i !== 1 && i !== totalPages) pageNumbers.push(renderPageButton(i));
            if (endEllipsisNeeded && endPage < totalPages - 1) pageNumbers.push(<span key="end-ellipsis" className="px-3 py-1.5 text-sm text-gray-700">...</span>);
        }
        if (totalPages > 1) pageNumbers.push(renderPageButton(totalPages));
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

    if (loading && students.length === 0 && !error && !debouncedSearchTerm && !selectedGradeId && !selectedSex && currentPage === 1) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-lg text-gray-500 ml-4">Loading students...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Student List</h1>
                    <div className="flex flex-wrap gap-2">
                        {/* Add Student button removed */}
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting || loading || totalStudents === 0}
                            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center disabled:opacity-50 text-sm sm:px-5 sm:py-2.5"
                        >
                            {isExporting ? <LoadingSpinnerIcon/> : <DownloadIcon className="w-5 h-5 mr-2" />}
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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

            <div className="bg-white rounded-lg shadow overflow-hidden">
                { !loading && students.length === 0 && !error ? (
                    <div className="text-center py-12 px-6">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="mt-2 text-xl font-medium text-gray-900">No students found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {debouncedSearchTerm || selectedGradeId || selectedSex ? "Try adjusting your search or filters." : "No students currently in the system."}
                        </p>
                        {/* "Add Student" button removed from empty state message */}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['#', 'UID', 'Name', 'Sex', 'Birth Date', 'Grade', 'Class'].map(header => (
                                            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading && students.length === 0 && (
                                        Array.from({ length: perPage }).map((_, index) => (
                                            <tr key={`skeleton-initial-${index}`} className="animate-pulse">
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                            </tr>
                                        ))
                                    )}
                                    {!loading && students.map((student, index) => (
                                        <tr key={student.id} className={index % 2 === 0 ? 'hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
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
                                        </tr>
                                    ))}
                                    {loading && students.length > 0 && (
                                        Array.from({ length: Math.min(perPage, 3) }).map((_, index) => (
                                            <tr key={`skeleton-load-${index}`} className="animate-pulse">
                                               <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                                <td className="px-6 py-4 whitespace-nowrap" colSpan="4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalStudents > 0 && !loading && (
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

            {/* StudentModal component removed as add/edit functionality is not present */}
        </div>
    );
};

export default StudentListForTeacher;