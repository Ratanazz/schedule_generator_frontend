import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';

const StudentModal = ({
    isOpen,
    onClose,
    onSubmit,
    studentData,
    setStudentData,
    errors,
    isSubmitting,
    modalTitle,
    modalMode,
}) => {
    const [internalGrades, setInternalGrades] = useState([]);
    const [isLoadingGrades, setIsLoadingGrades] = useState(false);
    const [errorGrades, setErrorGrades] = useState('');

    const [internalAllGradeClasses, setInternalAllGradeClasses] = useState([]);
    const [isLoadingGradeClasses, setIsLoadingGradeClasses] = useState(false);
    const [errorGradeClasses, setErrorGradeClasses] = useState('');

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setErrorGrades('');
            setErrorGradeClasses('');

            // Fetch logged-in user
            axios.get('/user')
                .then(res => {
                    setCurrentUser(res.data);
                    setStudentData(prev => ({
                        ...prev,
                        user_id: res.data.id,
                    }));
                })
                .catch(err => {
                    console.error("Failed to fetch user:", err);
                });

            // Fetch Grades
            if (internalGrades.length === 0) {
                setIsLoadingGrades(true);
                axios.get('/grades')
                    .then(response => {
                        setInternalGrades(response.data.data || response.data || []);
                    })
                    .catch(err => {
                        console.error("Failed to load grades:", err);
                        setErrorGrades('Failed to load grades.');
                    })
                    .finally(() => {
                        setIsLoadingGrades(false);
                    });
            }

            // Fetch Grade Classes
            if (internalAllGradeClasses.length === 0) {
                setIsLoadingGradeClasses(true);
                axios.get('/gradeclasses')
                    .then(response => {
                        setInternalAllGradeClasses(response.data.data || response.data || []);
                    })
                    .catch(err => {
                        console.error("Failed to load grade classes:", err);
                        setErrorGradeClasses('Failed to load classes.');
                    })
                    .finally(() => {
                        setIsLoadingGradeClasses(false);
                    });
            }
        }
    }, [isOpen]);

    const availableClassesForSelectedGrade = useMemo(() => {
        if (!studentData.grade_id || !internalAllGradeClasses || internalAllGradeClasses.length === 0) {
            return [];
        }
        const currentGradeId = parseInt(studentData.grade_id, 10);
        return internalAllGradeClasses.filter(gc => gc.grade_id === currentGradeId);
    }, [studentData.grade_id, internalAllGradeClasses]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'grade_id') {
                newState.gradeclass_id = '';
            }
            return newState;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg my-8 transform transition-all">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{modalTitle || 'Manage Student'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <input type="hidden" name="user_id" value={studentData.user_id || ''} />

                    <div className="mb-4">
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="full_name"
                            id="full_name"
                            value={studentData.full_name || ''}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.full_name ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                            required
                        />
                        {errors.full_name && <small className="text-red-600 mt-1">{errors.full_name[0]}</small>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-4">
                        <div>
                            <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                            <select
                                name="sex"
                                id="sex"
                                value={studentData.sex || 'Male'}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.sex ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.sex && <small className="text-red-600 mt-1">{errors.sex[0]}</small>}
                        </div>
                        <div>
                            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                id="date_of_birth"
                                value={studentData.date_of_birth || ''}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.date_of_birth ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                            />
                            {errors.date_of_birth && <small className="text-red-600 mt-1">{errors.date_of_birth[0]}</small>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-6">
                        <div>
                            <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                            <select
                                name="grade_id"
                                id="grade_id"
                                value={studentData.grade_id || ''}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.grade_id ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                                disabled={isLoadingGrades}
                            >
                                <option value="" disabled>
                                    {isLoadingGrades ? 'Loading grades...' : 'Select Grade'}
                                </option>
                                {internalGrades && internalGrades.map(grade => (
                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                ))}
                            </select>
                            {isLoadingGrades && <small className="text-xs text-blue-500 mt-1">Loading grades...</small>}
                            {errorGrades && <small className="text-xs text-red-600 mt-1">{errorGrades}</small>}
                            {errors.grade_id && <small className="text-red-600 mt-1">{errors.grade_id[0]}</small>}
                        </div>
                        <div>
                            <label htmlFor="gradeclass_id" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                name="gradeclass_id"
                                id="gradeclass_id"
                                value={studentData.gradeclass_id || ''}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.gradeclass_id ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                                disabled={!studentData.grade_id || availableClassesForSelectedGrade.length === 0 || isLoadingGradeClasses || isLoadingGrades}
                            >
                                <option value="" disabled>
                                    {isLoadingGradeClasses ? 'Loading classes...' : 'Select Class'}
                                </option>
                                {availableClassesForSelectedGrade.map(gc => (
                                    <option key={gc.id} value={gc.id}>
                                        {`${gc.section || 'Class'} ${gc.shift ? `(${gc.shift})` : ''}`.trim()}
                                    </option>
                                ))}
                            </select>
                            {errors.gradeclass_id && <small className="text-red-600 mt-1">{errors.gradeclass_id[0]}</small>}
                            {isLoadingGradeClasses && <small className="text-xs text-blue-500 mt-1">Loading available classes...</small>}
                            {errorGradeClasses && <small className="text-xs text-red-600 mt-1">{errorGradeClasses}</small>}
                            {!isLoadingGradeClasses && !isLoadingGrades && !errorGradeClasses && !studentData.grade_id && (
                                <small className="text-xs text-gray-500 mt-1">Select a grade to view classes.</small>
                            )}
                            {!isLoadingGradeClasses && !isLoadingGrades && !errorGradeClasses && studentData.grade_id && availableClassesForSelectedGrade.length === 0 && (
                                <small className="text-xs text-gray-500 mt-1">No classes available for this grade.</small>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            disabled={isSubmitting || isLoadingGradeClasses || isLoadingGrades}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (modalMode === 'edit' ? 'Save Changes' : 'Add Student')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentModal;