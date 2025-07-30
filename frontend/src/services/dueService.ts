import api from './api';
import { Due, CreateDueRequest } from '../types';

class DueService {
  async getAllDues(): Promise<Due[]> {
    const response = await api.get<Due[]>('/dues');
    return response.data;
  }
  
  async getDuesByStudent(studentId: number): Promise<Due[]> {
    const response = await api.get<Due[]>(`/dues/student/${studentId}`);
    return response.data;
  }
  
  async getDueById(id: number): Promise<Due> {
    const response = await api.get<Due>(`/dues/${id}`);
    return response.data;
  }
  
  async createDue(createDueRequest: CreateDueRequest): Promise<Due> {
    const response = await api.post<Due>('/dues', createDueRequest);
    return response.data;
  }
  
  async payDue(id: number, paymentReference: string): Promise<Due> {
    const response = await api.put<Due>(`/dues/${id}/pay`, null, {
      params: { paymentReference }
    });
    return response.data;
  }
  
  async approveDue(id: number): Promise<Due> {
    const response = await api.put<Due>(`/dues/${id}/approve`);
    return response.data;
  }
  
  async rejectDue(id: number): Promise<Due> {
    const response = await api.put<Due>(`/dues/${id}/reject`);
    return response.data;
  }
  
  async deleteDue(id: number): Promise<void> {
    await api.delete(`/dues/${id}`);
  }
}

const dueService = new DueService();
export default dueService;

// Add a function to check if a student has any pending dues
export const checkStudentDues = async (studentId: number): Promise<{ hasPendingDues: boolean, pendingDues: Due[] }> => {
  try {
    const response = await api.get(`/dues/student/${studentId}`);
    const dues = response.data;
    
    // Filter dues to find pending ones
    const pendingDues = dues.filter((due: Due) => due.paymentStatus === 'PENDING');
    
    return {
      hasPendingDues: pendingDues.length > 0,
      pendingDues: pendingDues
    };
  } catch (error) {
    console.error('Error checking student dues:', error);
    throw error;
  }
}; 