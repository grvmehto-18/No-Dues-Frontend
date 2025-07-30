// List of academic departments
export const ACADEMIC_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'ECE', name: 'Electronics & Communication Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'CE', name: 'Civil Engineering' },
  { code: 'EE', name: 'Electrical Engineering' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'BT', name: 'Biotechnology' },
  { code: 'CH', name: 'Chemical Engineering' },
  { code: 'AE', name: 'Aerospace Engineering' },
  { code: 'PHY', name: 'Physics' },
  { code: 'CHEM', name: 'Chemistry' },
  { code: 'MATH', name: 'Mathematics' }
];

// List of administrative departments
export const ADMINISTRATIVE_DEPARTMENTS = [
  { code: 'LIBRARY', name: 'Library' },
  { code: 'TRAINING_AND_PLACEMENT', name: 'Training & Placement' },
  { code: 'SPORTS', name: 'Sports' },
  { code: 'OFFICE', name: 'Administrative Office' },
  { code: 'HOD', name: 'Head of Department' },
  { code: 'IES_LIBRARY', name: 'IES Library' },
  { code: 'TRANSPORT', name: 'Transport' },
  { code: 'HOSTEL', name: 'Hostel' },
  { code: 'ACCOUNTS', name: 'Accounts' },
  { code: 'STUDENT_SECTION', name: 'Student Section' }
];

// All departments combined
export const ALL_DEPARTMENTS = [...ACADEMIC_DEPARTMENTS, ...ADMINISTRATIVE_DEPARTMENTS];

// Get department name by code
export const getDepartmentName = (code: string): string => {
  const department = ALL_DEPARTMENTS.find(dept => dept.code === code);
  return department ? department.name : code;
}; 