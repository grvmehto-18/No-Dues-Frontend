import api from './api';
import { NoDueCertificate, DepartmentSignature } from '../types';

class CertificateService {
  async getAllCertificates(): Promise<NoDueCertificate[]> {
    const response = await api.get<NoDueCertificate[]>('/certificates');
    return response.data;
  }
  
  async getCertificatesByStudent(studentId: number): Promise<NoDueCertificate[]> {
    const response = await api.get<NoDueCertificate[]>(`/certificates/student/${studentId}`);
    return response.data;
  }
  
  async getCertificateById(id: number): Promise<NoDueCertificate> {
    const response = await api.get<NoDueCertificate>(`/certificates/${id}`);
    return response.data;
  }
  
  async requestCertificate(rollNumber: number): Promise<NoDueCertificate> {
    const response = await api.post<NoDueCertificate>(`/certificates/request/${rollNumber}`);
    return response.data;
  }
  
  async approveCertificateByDepartment(id: number): Promise<NoDueCertificate> {
    const response = await api.put<NoDueCertificate>(`/certificates/${id}/approve/department`);
    return response.data;
  }
  
  async approveCertificateByHOD(id: number): Promise<NoDueCertificate> {
    const response = await api.put<NoDueCertificate>(`/certificates/${id}/approve/hod`);
    return response.data;
  }
  
  async approveCertificateByPrincipal(id: number): Promise<NoDueCertificate> {
    const response = await api.put<NoDueCertificate>(`/certificates/${id}/approve/principal`);
    return response.data;
  }
  
  async completeCertificate(id: number): Promise<NoDueCertificate> {
    const response = await api.put<NoDueCertificate>(`/certificates/${id}/complete`);
    return response.data;
  }
  
  async downloadCertificate(id: number): Promise<Blob> {
    const response = await api.get(`/certificates/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
  
  async generateDepartmentReceipt(studentId: number, department: string): Promise<DepartmentSignature> {
    const response = await api.post<DepartmentSignature>(
      `/certificates/department-receipt/${studentId}`,
      null,
      { params: { department } }
    );
    return response.data;
  }
  
  async checkEligibility(studentId: number): Promise<boolean> {
    const response = await api.get<boolean>(`/certificates/check-eligibility/${studentId}`);
    return response.data;
  }
  
  async getStudentsWithClearedDues(): Promise<NoDueCertificate[]> {
    const response = await api.get<NoDueCertificate[]>('/certificates/students-with-cleared-dues');
    return response.data;
  }
}

const certificateService = new CertificateService();
export default certificateService; 