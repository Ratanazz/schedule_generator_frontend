// src/pages/StudentsPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import StudentModal from './StudentModal'; // Adjust path if needed
import ConfirmationModal from '../../components/ConfirmationModal'; // Adjust path if necessary

// --- SVG Icons (No changes here, kept for completeness) ---
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
const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const UploadIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v12.75" />
    </svg>
);
const DownloadIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const LoadingSpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
// --- End SVG Icons ---

const StudentsPage = () => {
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

    const [gradesForFilter, setGradesForFilter] = useState([]);
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [loadingFilters, setLoadingFilters] = useState(false); 

    const [gradeClassesForFilter, setGradeClassesForFilter] = useState([]);
    const [selectedGradeClassId, setSelectedGradeClassId] = useState('');
    const [loadingGradeClasses, setLoadingGradeClasses] = useState(false);


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const initialStudentFormState = { full_name: '', sex: 'Male', date_of_birth: '', grade_id: '', gradeclass_id: '' };
    const [studentDataForModal, setStudentDataForModal] = useState(initialStudentFormState);
    const [modalErrors, setModalErrors] = useState({});
    const [isModalSubmitting, setIsModalSubmitting] = useState(false);

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const importFileInputRef = useRef(null);
    const searchInputRef = useRef(null);

    const [actionFeedback, setActionFeedback] = useState({ message: '', type: '' });
    const ACTION_FEEDBACK_TIMEOUT = 5000;

    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        title: '',
        messageComponent: null,
        onConfirmAction: () => {},
        confirmButtonText: 'Confirm',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
        data: null,
    });

    useEffect(() => {
        let timer;
        if (actionFeedback.message) {
            timer = setTimeout(() => {
                setActionFeedback({ message: '', type: '' });
            }, ACTION_FEEDBACK_TIMEOUT);
        }
        return () => clearTimeout(timer);
    }, [actionFeedback.message]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        const fetchGrades = async () => {
            setLoadingFilters(true);
            try {
                const res = await axios.get('/grades');
                setGradesForFilter(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Failed to fetch grades for filter:", err);
                setActionFeedback({ message: 'Failed to load grade filters.', type: 'error' });
                setGradesForFilter([]);
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchGrades();
    }, []);

    useEffect(() => {
    const fetchGradeClasses = async () => {
        if (!selectedGradeId) {
            setGradeClassesForFilter([]);
            setSelectedGradeClassId(''); 
            return;
        }
        setLoadingGradeClasses(true);
        try {
            const res = await axios.get(`/grades/${selectedGradeId}/gradeclasses`); 
            setGradeClassesForFilter(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(`Failed to fetch grade classes for grade ${selectedGradeId}:`, err);
            setActionFeedback({ message: 'Failed to load class/section filters.', type: 'error' });
            setGradeClassesForFilter([]); 
        } finally {
            setLoadingGradeClasses(false);
        }
    };
    fetchGradeClasses();
    }, [selectedGradeId]);

    const fetchStudents = useCallback(async (pageToFetch = 1) => {
        setLoading(true);
        setError(null);
        // Ensure pageToFetch is a valid number, default to 1
        const validPageToFetch = Number.isFinite(Number(pageToFetch)) && Number(pageToFetch) > 0 ? Number(pageToFetch) : 1;

        let params = `page=${validPageToFetch}&per_page=${perPage}`;
        if (debouncedSearchTerm) params += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
        if (selectedGradeId) params += `&grade_id=${selectedGradeId}`;
        if (selectedGradeClassId) params += `&grade_class_id=${selectedGradeClassId}`;

        try {
            const res = await axios.get(`/students?${params}`);
            const data = res.data;

            setStudents(Array.isArray(data.data) ? data.data : []);

            const apiCurrentPage = Number(data.current_page);
            setCurrentPage(Number.isFinite(apiCurrentPage) && apiCurrentPage > 0 ? apiCurrentPage : 1);

            const apiLastPage = Number(data.last_page);
            setTotalPages(Number.isFinite(apiLastPage) && apiLastPage > 0 ? apiLastPage : 1);

            const apiTotal = Number(data.total);
            setTotalStudents(Number.isFinite(apiTotal) && apiTotal >= 0 ? apiTotal : 0);

            const studentList = Array.isArray(data.data) ? data.data : [];
            if (studentList.length > 0) {
                const apiFrom = Number(data.from);
                setFromStudent(Number.isFinite(apiFrom) && apiFrom > 0 ? apiFrom : ( (validPageToFetch - 1) * perPage + 1 )  );


                const apiTo = Number(data.to);
                setToStudent(Number.isFinite(apiTo) && apiTo >= (Number.isFinite(apiFrom) ? apiFrom : 0) ? apiTo : ( (validPageToFetch - 1) * perPage + studentList.length) );
            } else {
                setFromStudent(0);
                setToStudent(0);
            }

        } catch (err) {
            const fetchErrMessage = err.response?.data?.message || 'Failed to fetch students. Please try again.';
            setError(fetchErrMessage);
            console.error("Fetch error:", err);
            setStudents([]);
            setFromStudent(0); 
            setToStudent(0); 
            setTotalStudents(0);
            setTotalPages(1); // Also reset totalPages on error
            // currentPage keeps its previous value or initial 1, which is fine
        } finally {
            setLoading(false);
        }
    }, [perPage, debouncedSearchTerm, selectedGradeId, selectedGradeClassId]); // currentPage removed from deps, fetchStudents calls itself with page

    useEffect(() => {
        // currentPage is a dependency here, so when it changes, fetchStudents is called
        // fetchStudents itself should handle what page it's fetching.
        fetchStudents(currentPage);
    }, [currentPage, fetchStudents]); // Re-added fetchStudents as it has dependencies that might change e.g. perPage


    const openConfirmationModal = (config) => {
        setConfirmModalState({
            isOpen: true,
            title: config.title,
            messageComponent: config.messageComponent,
            onConfirmAction: config.onConfirmAction,
            confirmButtonText: config.confirmButtonText || 'Confirm',
            confirmButtonClass: config.confirmButtonClass || 'bg-blue-600 hover:bg-blue-700 text-white',
            data: config.data || null,
        });
    };

    const closeConfirmationModal = () => {
        setConfirmModalState(prev => ({ ...prev, isOpen: false, data: null, onConfirmAction: () => {} }));
    };

    const handleModalConfirm = () => {
        if (confirmModalState.onConfirmAction && typeof confirmModalState.onConfirmAction === 'function') {
            confirmModalState.onConfirmAction(confirmModalState.data);
        }
        closeConfirmationModal();
    };

    const handleSearchChange = (event) => setSearchTerm(event.target.value);
    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) searchInputRef.current.focus();
    };
    const handlePerPageChange = (event) => {
        const newPerPage = Number(event.target.value);
        if (Number.isFinite(newPerPage) && newPerPage > 0) {
            setPerPage(newPerPage);
        } else {
            setPerPage(10); // Fallback to default
        }
        setCurrentPage(1); // Reset to page 1
    };
    const handleGradeFilterChange = (event) => {
        setSelectedGradeId(event.target.value);
        setSelectedGradeClassId(''); 
        setCurrentPage(1); // Reset to page 1
    };
    const handleGradeClassFilterChange = (event) => {
        setSelectedGradeClassId(event.target.value);
        setCurrentPage(1); // Reset to page 1
    };

    const resetFiltersAndSearch = () => {
        setSearchTerm('');
        setDebouncedSearchTerm(''); // This will also trigger its own useEffect
        setSelectedGradeId('');
        setSelectedGradeClassId(''); 
        setCurrentPage(1); // Explicitly reset to page 1
    };

    const handleDeleteRequest = (studentId, studentName) => {
        openConfirmationModal({
            title: 'Confirm Deletion',
            messageComponent: <p>Are you sure you want to delete student <strong>{studentName}</strong> (ID: {studentId})?</p>,
            onConfirmAction: executeDelete,
            confirmButtonText: 'Delete Student',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
            data: studentId,
        });
    };

    const executeDelete = async (id) => {
        try {
            await axios.delete(`/students/${id}`);
            setActionFeedback({ message: 'Student deleted successfully.', type: 'success' });
            // If current page becomes empty after delete, try to go to previous page or refetch current
            if (students.length === 1 && currentPage > 1) {
                setCurrentPage(prev => Math.max(1, prev - 1)); // Go to prev page, ensure it's at least 1
            } else {
                fetchStudents(currentPage); // Refetch current page (or page 1 if current page was 1)
            }
        } catch (err) {
            setActionFeedback({ message: err.response?.data?.message || 'Failed to delete student.', type: 'error' });
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
                setActionFeedback({ message: 'Student added successfully.', type: 'success' });
            } else if (modalMode === 'edit') {
                await axios.put(`/students/${studentDataForModal.id}`, studentDataForModal);
                setActionFeedback({ message: 'Student updated successfully.', type: 'success' });
            }
            closeModal();

            // Ensure totalPages is a valid number before using it
            const safeTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;

            if (modalMode === 'add' && totalStudents > 0 && totalStudents % perPage === 0) {
                 fetchStudents(safeTotalPages + 1);
            } else if (modalMode === 'add' && students.length < perPage ) {
                 fetchStudents(currentPage); // currentPage should be safe now
            } else if (modalMode === 'add') { // Go to last page
                 fetchStudents(safeTotalPages);
            }
            else { // For edit
                 fetchStudents(currentPage); // currentPage should be safe now
            }
        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setModalErrors(err.response.data.errors);
                setActionFeedback({ message: 'Please correct the errors in the form.', type: 'error' });
            } else {
                setActionFeedback({ message: err.response?.data?.message || `Failed to ${modalMode} student.`, type: 'error' });
            }
        } finally {
            setIsModalSubmitting(false);
        }
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        const queryParts = [];
        if (debouncedSearchTerm) queryParts.push(`search=${encodeURIComponent(debouncedSearchTerm)}`);
        if (selectedGradeId) queryParts.push(`grade_id=${selectedGradeId}`);
        if (selectedGradeClassId) queryParts.push(`grade_class_id=${selectedGradeClassId}`); 
        const params = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

        try {
            const response = await axios.get(`/students/export-csv${params}`, { responseType: 'blob' });
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
            setActionFeedback({ message: 'Student data exported successfully.', type: 'success' });
        } catch (err) {
            console.error("Export error:", err);
            let errorMessage = 'Failed to export students. Please try again.';
            if (err.response && err.response.data && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
                try {
                    const errorDataText = await err.response.data.text();
                    const errorJson = JSON.parse(errorDataText);
                    errorMessage = `Failed to export students: ${errorJson.message || 'Server error'}`;
                } catch (parseError) {}
            } else if (err.response?.data?.message) {
                errorMessage = `Failed to export students: ${err.response.data.message}`;
            }
            setActionFeedback({ message: errorMessage, type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => importFileInputRef.current.click();

    const handleImportFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
            setActionFeedback({ message: 'Please select a valid CSV file.', type: 'error' });
            if(event.target) event.target.value = null;
            return;
        }

        setIsImporting(true);
        const formData = new FormData();
        formData.append('csv_file', file);

        try {
            const response = await axios.post('/students/import-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setActionFeedback({ message: response.data.message || 'Students imported successfully.', type: 'success' });
            setCurrentPage(1); // Reset to page 1 after import
            fetchStudents(1); 
        } catch (err) {
            console.error("IMPORT ERROR:", err);
            let importErrorMessage = 'An unexpected error occurred during import. Please check the console for details.';
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                const backendMessage = typeof errorData.message === 'string' ? errorData.message : null;
                importErrorMessage = backendMessage || "Import processed with issues.";

                if (errorData.errors) {
                    let detailsString = "\n\nDetails:\n";
                    if (Array.isArray(errorData.errors)) { 
                        errorData.errors.forEach(errMsg => {
                             if (typeof errMsg === 'string') detailsString += `  - ${errMsg}\n`;
                             else detailsString += `  - (Unexpected error format: ${JSON.stringify(errMsg)})\n`;
                        });
                        if (errorData.errors.length > 0) importErrorMessage = (backendMessage || "Import processed with errors.") + detailsString;
                    } else if (typeof errorData.errors === 'object') { 
                        for (const field in errorData.errors) {
                            if (Array.isArray(errorData.errors[field])) {
                                detailsString += `  - ${field}: ${errorData.errors[field].join(', ')}\n`;
                            } else if (typeof errorData.errors[field] === 'string') {
                                detailsString += `  - ${field}: ${errorData.errors[field]}\n`;
                            }
                        }
                        importErrorMessage = (backendMessage || "Import failed due to validation issues.") + detailsString;
                    }
                } else if (backendMessage) {
                    importErrorMessage = backendMessage;
                }
            } else if (err.request) {
                importErrorMessage = 'Import failed: No response from server. Check network connection.';
            } else if (err.message) {
                importErrorMessage = `Import failed: ${err.message}`;
            }
            setActionFeedback({ message: importErrorMessage, type: 'error' });
        } finally {
            setIsImporting(false);
            if (event.target) event.target.value = null;
        }
    };


    const renderPageNumbers = () => {
        if (totalPages <= 1) return null;
        const pageNumbers = [];
        const maxVisiblePages = 5;
        const pageNeighbours = 1;

        // Current Page and TotalPages must be valid numbers for this logic
        const safeCurrentPage = Number.isFinite(currentPage) ? currentPage : 1;
        const safeTotalPages = Number.isFinite(totalPages) ? totalPages : 1;

        if (safeTotalPages <= 1) return null;


        pageNumbers.push(renderPageButton(1));
        let startEllipsisNeeded = safeCurrentPage > pageNeighbours + 2;
        let endEllipsisNeeded = safeCurrentPage < safeTotalPages - pageNeighbours - 1;

        if (safeTotalPages <= maxVisiblePages) {
            startEllipsisNeeded = false;
            endEllipsisNeeded = false;
            for (let i = 2; i < safeTotalPages; i++) pageNumbers.push(renderPageButton(i));
        } else {
            if (startEllipsisNeeded) pageNumbers.push(<span key="start-ellipsis" className="px-3 py-1.5 text-sm text-gray-700">...</span>);
            
            let startPage = Math.max(2, safeCurrentPage - pageNeighbours);
            let endPage = Math.min(safeTotalPages - 1, safeCurrentPage + pageNeighbours);

            if (safeCurrentPage < maxVisiblePages - pageNeighbours - 1) {
                endPage = Math.min(safeTotalPages - 1, maxVisiblePages - 2);
            }
            if (safeCurrentPage > safeTotalPages - (maxVisiblePages - pageNeighbours - 1)) {
                startPage = Math.max(2, safeTotalPages - (maxVisiblePages - 3));
            }

            for (let i = startPage; i <= endPage; i++) {
                if (i !== 1 && i !== safeTotalPages) pageNumbers.push(renderPageButton(i));
            }

            if (endEllipsisNeeded && endPage < safeTotalPages - 1) {
                pageNumbers.push(<span key="end-ellipsis" className="px-3 py-1.5 text-sm text-gray-700">...</span>);
            }
        }
        if (safeTotalPages > 1) pageNumbers.push(renderPageButton(safeTotalPages));
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

    // Initial loading state more specific
    if (loading && currentPage === 1 && students.length === 0 && !error && !debouncedSearchTerm && !selectedGradeId && !selectedGradeClassId) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-lg text-gray-500 ml-4">Loading students...</p></div>;
    }

    return (
        <>
            {actionFeedback.message && (
                <div className="fixed top-5 right-5 z-[101] w-full max-w-sm sm:max-w-md"> 
                    <div
                        className={`p-4 rounded-lg shadow-xl transition-all duration-300 ease-in-out transform ${
                        actionFeedback.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-800' :
                        actionFeedback.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-800' :
                        'bg-blue-100 border-l-4 border-blue-500 text-blue-800'
                        }`}
                        role="alert"
                    >
                        <div className="flex">
                            <div className="py-1">
                                {actionFeedback.type === 'success' && <svg className="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z"/></svg>}
                                {actionFeedback.type === 'error' && <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828-1.415-1.415L10 8.586 7.172 5.757 5.757 7.172 8.586 10l-2.829 2.828 1.415 1.415L10 11.414l2.828 2.829 1.415-1.415L11.414 10z"/></svg>}
                                {actionFeedback.type !== 'success' && actionFeedback.type !== 'error' && <svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2V9H9zm2-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/></svg>}
                            </div>
                            <div>
                                <p className="font-bold">
                                {actionFeedback.type === 'success' ? 'Success' : actionFeedback.type === 'error' ? 'Error' : 'Information'}
                                </p>
                                <p className="text-sm" dangerouslySetInnerHTML={{ __html: actionFeedback.message.replace(/\n/g, '<br />') }} />
                            </div>
                            <button
                                onClick={() => setActionFeedback({ message: '', type: '' })}
                                className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex h-8 w-8 self-start"
                                aria-label="Dismiss"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Students Management</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={openAddModal}
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center text-sm sm:px-5 sm:py-2.5"
                            >
                                <PlusIcon /> Add Student
                            </button>
                            <input
                                type="file"
                                ref={importFileInputRef}
                                onChange={handleImportFileSelect}
                                accept=".csv"
                                style={{ display: 'none' }}
                                disabled={isImporting || loading}
                            />
                            <button
                                onClick={handleImportClick}
                                disabled={isImporting || loading}
                                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center disabled:opacity-50 text-sm sm:px-5 sm:py-2.5"
                            >
                                {isImporting ? <LoadingSpinnerIcon/> : <UploadIcon className="w-5 h-5 mr-2" />}
                                {isImporting ? 'Importing...' : 'Import CSV'}
                            </button>
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
                        <p className="font-bold">Error Fetching Data</p>
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
                            <label htmlFor="gradeClassFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Class/Section:</label>
                            <select
                                id="gradeClassFilter"
                                value={selectedGradeClassId}
                                onChange={handleGradeClassFilterChange}
                                disabled={loading || loadingGradeClasses || !selectedGradeId || gradeClassesForFilter.length === 0}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">{selectedGradeId ? (gradeClassesForFilter.length > 0 ? "All Sections" : (loadingGradeClasses ? "Loading..." : "No Sections Found")) : "Select Grade First"}</option>
                                {gradeClassesForFilter.map(gc => (
                                    <option key={gc.id} value={gc.id}>
                                        {gc.name || `${gc.section || 'N/A'}${gc.shift ? ` (${gc.shift})` : ''}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(debouncedSearchTerm || selectedGradeId || selectedGradeClassId) && (
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
                                {debouncedSearchTerm || selectedGradeId || selectedGradeClassId ? "Try adjusting your search or filters." : "Get started by adding a new student."}
                            </p>
                            {!debouncedSearchTerm && !selectedGradeId && !selectedGradeClassId && (
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={openAddModal}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <PlusIcon /> Add Student
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
                                            {['#', 'UID', 'Name', 'Sex', 'Birth Date', 'Grade', 'Class', 'Actions'].map(header => ( 
                                                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {/* Skeleton for initial full page load or when students array is empty but loading is true */}
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
                                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                                </tr>
                                            ))
                                        )}
                                        {/* Actual student data */}
                                        {!loading && students.map((student, index) => (
                                            <tr key={student.id} className={index % 2 === 0 ? undefined : 'bg-gray-50 hover:bg-gray-100'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(currentPage - 1) * perPage + index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_uid || <span className="text-gray-400 italic">N/A</span>}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{student.full_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.sex}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : <span className="text-gray-400 italic">N/A</span>}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade?.name || <span className="text-gray-400 italic">N/A</span>}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.grade_class
                                                        ? `${student.grade_class.grade?.name || ''} ${student.grade_class.section || ''} ${student.grade_class.shift ? '(' + student.grade_class.shift + ')' : ''}`.trim().replace(/ +(?=\()/, '') 
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
                                                        onClick={() => handleDeleteRequest(student.id, student.full_name)} 
                                                        className="text-red-600 hover:text-red-900 transition duration-150 flex items-center"
                                                        title="Delete Student"
                                                    >
                                                        <TrashIcon/> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Skeleton for subsequent page loads when students array might already have items but loading is true */}
                                        {loading && students.length > 0 && (
                                            Array.from({ length: Math.min(perPage, 3) }).map((_, index) => ( // Show a few skeleton rows
                                                <tr key={`skeleton-load-${index}`} className="animate-pulse">
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                                    <td className="px-6 py-4 whitespace-nowrap" colSpan="5"><div className="h-4 bg-gray-200 rounded w-full"></div></td> {/* Simplified for remaining cells */}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - Ensure totalStudents is positive and not loading */}
                            {totalStudents > 0 && !loading && (
                                <div className="py-3 px-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
                                    <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                                        Showing <span className="font-medium">{fromStudent || 0}</span> to <span className="font-medium">{toStudent || 0}</span> of <span className="font-medium">{totalStudents}</span> results
                                    </div>
                                    {/* Ensure totalPages is valid before rendering pagination controls */}
                                    {Number.isFinite(totalPages) && totalPages > 1 && (
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
                />

                <ConfirmationModal
                    isOpen={confirmModalState.isOpen}
                    onClose={closeConfirmationModal}
                    onConfirm={handleModalConfirm}
                    title={confirmModalState.title}
                    confirmButtonText={confirmModalState.confirmButtonText}
                    confirmButtonClass={confirmModalState.confirmButtonClass}
                >
                    {confirmModalState.messageComponent}
                </ConfirmationModal>
            </div>
        </>
    );
};

export default StudentsPage;