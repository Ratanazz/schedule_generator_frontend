// src/components/StudentModal.js
import React from 'react';

const StudentModal = ({
    isOpen,
    onClose,
    onSubmit,
    studentData,
    setStudentData,
    errors,
    isLoading // Optional: to disable submit button during API call
}) => {
    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add New Student</h2>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            id="full_name"
                            value={studentData.full_name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                        {errors.full_name && <small className="text-red-500 mt-1">{errors.full_name[0]}</small>}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                        <select
                            name="sex"
                            id="sex"
                            value={studentData.sex}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            id="date_of_birth"
                            value={studentData.date_of_birth}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                        {errors.date_of_birth && <small className="text-red-500 mt-1">{errors.date_of_birth[0]}</small>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 mb-1">Grade ID</label>
                            <input
                                type="number"
                                name="grade_id"
                                id="grade_id"
                                value={studentData.grade_id}
                                onChange={handleInputChange}
                                placeholder="e.g., 1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                            {errors.grade_id && <small className="text-red-500 mt-1">{errors.grade_id[0]}</small>}
                        </div>
                        <div>
                            <label htmlFor="gradeclass_id" className="block text-sm font-medium text-gray-700 mb-1">Class ID (Optional)</label>
                            <input
                                type="number"
                                name="gradeclass_id"
                                id="gradeclass_id"
                                placeholder="e.g., 101"
                                value={studentData.gradeclass_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {errors.gradeclass_id && <small className="text-red-500 mt-1">{errors.gradeclass_id[0]}</small>}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentModal;