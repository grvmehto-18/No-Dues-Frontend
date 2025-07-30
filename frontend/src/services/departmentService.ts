import api from './api';
import { Department, CreateDepartmentRequest } from '../types';

class DepartmentService {
  async getAllDepartments(): Promise<Department[]> {
    const response = await api.get<Department[]>('/departments');
    return response.data;
  }
  
  async getDepartmentById(id: number): Promise<Department> {
    const response = await api.get<Department>(`/departments/${id}`);
    return response.data;
  }
  
  async createDepartment(createDepartmentRequest: CreateDepartmentRequest): Promise<Department> {
    const response = await api.post<Department>('/departments', createDepartmentRequest);
    return response.data;
  }
  
  async updateDepartment(id: number, department: Partial<Department>): Promise<Department> {
    const response = await api.put<Department>(`/departments/${id}`, department);
    return response.data;
  }
  
  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/departments/${id}`);
  }
}

export default new DepartmentService(); 