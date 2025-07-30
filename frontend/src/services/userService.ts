import api from "./api";
import { User, CreateUserRequest } from "../types";
import { getToken } from "../utils/auth";

class UserService {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>("/users");
    return response.data;
  }
  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  }
  async createUser(createUserRequest: CreateUserRequest): Promise<User> {
    const response = await api.post<User>("/users", createUserRequest);
    return response.data;
  }
  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, user);
    return response.data;
  }
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }
  async uploadESignature(file: File): Promise<void> {
    // Check file size and resize if needed
    const maxSizeInBytes = 64 * 1024; // 64KB
    
    console.log("Original file:", file.name, file.type, file.size, "bytes");
    
    // If file is larger than max size, resize it
    if (file.size > maxSizeInBytes) {
      console.log("File is too large, resizing...");
      try {
        const resizedFile = await this.resizeImage(file, 400); // Max width 400px
        console.log("Resized file size:", resizedFile.size, "bytes");
        file = resizedFile;
      } catch (error) {
        console.error("Error resizing image:", error);
        throw new Error("Failed to resize image. Please try a smaller image.");
      }
    }
    
    const formData = new FormData();
    formData.append("file", file);
    
    console.log("Uploading file:", file.name, file.type, file.size, "bytes");
    console.log("FormData created with file appended");
    
    const token = getToken();
    
    try {
      // Use fetch API directly instead of axios
      const response = await fetch('http://localhost:8080/api/profile/signature', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type header for multipart/form-data
        },
        body: formData
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Upload failed with status:", response.status, errorData);
        throw new Error(errorData || `Upload failed with status ${response.status}`);
      }
      
      console.log("Upload request completed successfully");
    } catch (error) {
      console.error("Upload request failed:", error);
      throw error;
    }
  }
  
  // Helper method to resize image
  private async resizeImage(file: File, maxWidth: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw image on canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              // Create new file from blob
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              resolve(resizedFile);
            },
            'image/jpeg',
            0.7 // 70% quality
          );
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }
  async getESignature(): Promise<string> {
    try {
      const response = await api.get<string>("/profile/signature");
      return response.data;
    } catch (error) {
      console.error("Error fetching e-signature:", error);
      return "";
    }
  }
  async getProfile(): Promise<User> {
    const response = await api.get<User>("/profile");
    return response.data;
  }
}
export default new UserService();
