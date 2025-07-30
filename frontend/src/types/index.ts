// User Types
export interface Role {
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: (string | Role)[];
  department: string;
  uniqueCode: string;
  eSignature?: string; // Optional e-signature image URL
  rollNumber?: string; // Add rollNumber for student users
}

// Student Types
export interface Student {
  id: number;
  userId: number;
  rollNumber: string;
  semester: number;
  batch: string;
  course: string;
  section: string;
  fatherName: string;
  motherName: string;
  contactNumber: string;
  address: string;
  user: User;
}

export interface CreateStudentRequest {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  rollNumber: string;
  semester: number;
  batch: string;
  course: string;
  section: string;
  fatherName: string;
  motherName: string;
  contactNumber: string;
  address: string;
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  id: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
  department: string;
  firstName: string;
  lastName: string;
  uniqueCode: string;
  rollNumber?: string; // Add rollNumber to JwtResponse
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  department: string;
}

// Due Types
export interface Due {
  id: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  department: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentStatus: string;
  receiptGenerated: boolean;
  receiptNumber: string | null; // Add this
  paymentDate: string | null;
  paymentReference: string | null;
  approvedBy: number | null;
  approvedByName: string | null;
  approvalDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateDueRequest {
  studentId: number;
  department: string;
  description: string;
  amount: number;
  dueDate: string;
}

// Certificate Types
export interface NoDueCertificate {
    id: number;
    studentId: string;
    studentName: string;
    studentRollNumber: string;
    branch: string;
    semester: number;
    email: string;
    mobileNumber: string;
    certificateNumber: string;
    issueDate: string;
    status: string;
    principalSigned: boolean;
    principalSignedBy: string;
    principalSignedAt: string;
    createdAt: string;
    departmentSignatures: DepartmentSignature[];
    computerCode: string;
    principalESignature?: string;
}

// Department Types
export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  hodId: number | null;
  hodName: string | null;
  adminId: number | null;
  adminName: string | null;
  createdAt: string;
  updatedAt: string | null;
  eSignature?: string;

}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description: string;
  hodId: number | null;
  adminId: number | null;
}

// Department Signature Types
export interface DepartmentSignature {
  id: number;
  studentId: number;
  studentName: string;
  department: string;
  status: string;
  signedBy: number | null;
  signerName: string | null;
  signedAt: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string | null;
} 

