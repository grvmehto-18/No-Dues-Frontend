import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Box,
  useTheme,
  alpha,
  Chip,
  Grid,
  Stack,
  CircularProgress,
  DialogContentText,
  AlertColor,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  MenuBook as MenuBookIcon,
  Class as ClassIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { z } from "zod";
import {
  getToken,
  isAdmin,
  isDepartmentAdmin,
  isHOD,
  isPrincipal,
} from "../utils/auth";
import { useNavigate } from "react-router-dom";

// Zod schema for student validation
const studentSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  rollNumber: z
    .string()
    .min(5, "Roll number must be at least 5 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Roll number must be alphanumeric"),
  semester: z.coerce
    .number()
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  batch: z
    .string()
    .regex(
      /^\d{4}-\d{2}$/,
      "Batch must be in the format YYYY-YY (e.g., 2022-26)"
    ),
  course: z.string().min(1, "Course is required"),
  section: z
    .string()
    .min(1, "Section is required")
    .max(10, "Section cannot be more than 10 characters"),
  fatherName: z
    .string()
    .min(2, "Father's name must be at least 2 characters")
    .regex(
      /^[a-zA-Z\s]+$/,
      "Father's name can only contain letters and spaces"
    ),
  motherName: z
    .string()
    .min(2, "Mother's name must be at least 2 characters")
    .regex(
      /^[a-zA-Z\s]+$/,
      "Mother's name can only contain letters and spaces"
    ),
  contactNumber: z
    .string()
    .regex(/^\d{10}$/, "Contact number must be exactly 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

interface Student {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    uniqueCode: string;
  };
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

interface CreateStudentRequest {
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

interface UpdateStudentRequest {
  id: number;
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

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

const Students: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    const fieldSchema =
      studentSchema.shape[field as keyof typeof studentSchema.shape];
    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      setFormErrors({
        ...formErrors,
        [field]: result.error.issues[0].message,
      });
    } else {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };
  const [formData, setFormData] = useState<
    CreateStudentRequest | UpdateStudentRequest
  >({
    id: 0,
    email: "",
    firstName: "",
    lastName: "",
    department: "",
    rollNumber: "",
    semester: 1,
    batch: "",
    course: "",
    section: "",
    fatherName: "",
    motherName: "",
    contactNumber: "",
    address: "",
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // Use useCallback to memoize the fetchStudents function
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);

      // Check if token exists
      const token = getToken();
      if (!token) {
        console.error("No authentication token found");

        // Check if we have stored credentials for auto-login
        const username = localStorage.getItem("last_username");
        const password = localStorage.getItem("last_password");

        if (username && password && process.env.NODE_ENV === "development") {
          try {
            console.log("Attempting auto-login with stored credentials");
            await api.post("/auth/signin", { username, password });
            // Refresh the page to get a new token
            window.location.reload();
            return;
          } catch (loginError) {
            console.error("Auto-login failed:", loginError);
          }
        }

        setSnackbar({
          open: true,
          message: "Authentication token not found. Please log in again.",
          severity: "error",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      console.log("Fetching students with token available");
      const response = await api.get("/students");

      console.log("Students fetch response:", response.data);
      setStudents(response.data);
    } catch (error: any) {
      console.error("Error fetching students:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error("Error request:", error.request);
      }

      if (error.response?.status === 401) {
        // Let the api interceptor handle the redirect
        return;
      }

      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to fetch students",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Add setSnackbar as dependency

  useEffect(() => {
    if (user && !authLoading) {
      // Only fetch if user is authenticated and auth is not loading
      console.log("User authenticated, fetching students...");
      fetchStudents();
    } else if (!authLoading) {
      // Check if we have stored credentials for auto-login
      const username = localStorage.getItem("last_username");
      const password = localStorage.getItem("last_password");

      if (username && password && process.env.NODE_ENV === "development") {
        console.log(
          "No user but stored credentials found, attempting auto-login"
        );
        (async () => {
          try {
            await api.post("/auth/signin", { username, password });
            // Refresh the page to get a new token
            window.location.reload();
          } catch (loginError) {
            console.error("Auto-login failed:", loginError);
            setSnackbar({
              open: true,
              message: "Authentication failed. Please log in again.",
              severity: "error",
            });
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          }
        })();
      } else {
        console.error("No authenticated user and no stored credentials");
        setSnackbar({
          open: true,
          message: "Authentication required. Please log in.",
          severity: "error",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    }
  }, [fetchStudents, user, authLoading]);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null; // Let the auth interceptor handle redirect
  }

  const handleOpenEditDialog = async (student: Student) => {
    try {
      // Check if token is valid before opening dialog
      const token = getToken();
      if (!token) {
        setSnackbar({
          open: true,
          message: "Authentication token not found. Please log in again.",
          severity: "error",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      // Verify student data is complete
      if (!student || !student.user) {
        console.error("Invalid student data:", student);
        setSnackbar({
          open: true,
          message:
            "Invalid student data. Please refresh the page and try again.",
          severity: "error",
        });
        return;
      }

      console.log("Opening edit dialog for student:", student.id);

      setIsEditMode(true);
      setSelectedStudent(student);
      setFormErrors({});
      setFormData({
        id: student.id,
        email: student.user.email,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        department: student.user.department,
        rollNumber: student.rollNumber,
        semester: student.semester,
        batch: student.batch,
        course: student.course,
        section: student.section,
        fatherName: student.fatherName,
        motherName: student.motherName,
        contactNumber: student.contactNumber,
        address: student.address,
      });
      setOpenDialog(true);
    } catch (error) {
      console.error("Error opening edit dialog:", error);
      setSnackbar({
        open: true,
        message: "An error occurred while loading student data.",
        severity: "error",
      });
    }
  };

  const handleOpenDeleteDialog = (student: Student) => {
    setSelectedStudent(student);
    setOpenDeleteDialog(true);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      // Get token using the utility function
      const token = getToken();

      if (!token) {
        setSnackbar({
          open: true,
          message: "Authentication token not found. Please log in again.",
          severity: "error",
        });
        return;
      }

      console.log(`Deleting student with ID: ${selectedStudent.id}`);
      console.log(`Using token: ${token.substring(0, 10)}...`);

      // Use the overridden delete method from api.ts that includes the token
      const response = await api.delete(`/students/${selectedStudent.id}`);
      console.log("Delete response:", response);

      setSnackbar({
        open: true,
        message: "Student deleted successfully!",
        severity: "success",
      });

      // Close the dialog and refresh the student list
      setOpenDeleteDialog(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      console.error("Error during student deletion:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error("Error request:", error.request);
      }

      if (error.response?.status === 401) {
        // Let the api interceptor handle the redirect
        setSnackbar({
          open: true,
          message: "Authentication error. Please log in again.",
          severity: "error",
        });
        return;
      }

      if (error.response?.status === 403) {
        setSnackbar({
          open: true,
          message: "You do not have permission to delete this student.",
          severity: "error",
        });
        return;
      }

      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          `Failed to delete student. ${error.message || ""}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const result = studentSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        newErrors[issue.path[0]] = issue.message;
      }
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    try {
      setLoading(true);
      // Get token using the utility function
      const token = getToken();

      // Debug token information
      console.log("Token available:", !!token);
      if (!token) {
        // Check if we have stored credentials for auto-login
        const username = localStorage.getItem("last_username");
        const password = localStorage.getItem("last_password");

        if (username && password && process.env.NODE_ENV === "development") {
          try {
            console.log("Attempting auto-login with stored credentials");
            await api.post("/auth/signin", { username, password });
            // Refresh the page to get a new token
            window.location.reload();
            return;
          } catch (loginError) {
            console.error("Auto-login failed:", loginError);
          }
        }

        setSnackbar({
          open: true,
          message: "Authentication token not found. Please log in again.",
          severity: "error",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (isEditMode && selectedStudent) {
        // Update existing student
        const updateData = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department,
          rollNumber: formData.rollNumber,
          semester: formData.semester,
          batch: formData.batch,
          course: formData.course,
          section: formData.section,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          contactNumber: formData.contactNumber,
          address: formData.address,
        };

        console.log(
          "Sending update request for student ID:",
          selectedStudent.id
        );
        console.log("Update data:", updateData);
        console.log("Using token:", token.substring(0, 10) + "...");

        try {
          // Use the overridden put method from api.ts that includes the token
          const response = await api.put(
            `/students/${selectedStudent.id}`,
            updateData
          );
          console.log("Update response:", response);

          setSnackbar({
            open: true,
            message: "Student updated successfully!",
            severity: "success",
          });

          handleCloseDialog();
          fetchStudents();
        } catch (updateError: any) {
          console.error("Error during student update:", updateError);

          // Log detailed error information
          if (updateError.response) {
            console.error("Update error response:", {
              status: updateError.response.status,
              headers: updateError.response.headers,
              data: updateError.response.data,
            });
          } else if (updateError.request) {
            console.error("Update error request:", updateError.request);
          }

          if (updateError.response?.status === 401) {
            setSnackbar({
              open: true,
              message: "Authentication error. Please log in again.",
              severity: "error",
            });
            setTimeout(() => {
              navigate("/login");
            }, 2000);
            return;
          }

          setSnackbar({
            open: true,
            message:
              updateError.response?.data?.message ||
              `Failed to update student. ${updateError.message || ""}`,
            severity: "error",
          });
        }
      } else {
        // Create new student
        const studentData = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department,
          rollNumber: formData.rollNumber,
          semester: formData.semester,
          batch: formData.batch,
          course: formData.course,
          section: formData.section,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          contactNumber: formData.contactNumber,
          address: formData.address,
        };

        console.log("Sending create request with data:", studentData);

        const response = await api.post("/students", studentData);

        console.log("Create response:", response);

        setSnackbar({
          open: true,
          message: "Student created successfully! Credentials sent to email.",
          severity: "success",
        });

        handleCloseDialog();
        fetchStudents();
      }
    } catch (error: any) {
      console.error("Error during student operation:", error);

      // Log detailed error information
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error("Error request:", error.request);
      }

      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: "Authentication error. Please log in again.",
          severity: "error",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (error.response?.status === 403) {
        setSnackbar({
          open: true,
          message: "You do not have permission to perform this action.",
          severity: "error",
        });
        return;
      }

      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} student. ${
            error.message || ""
          }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditMode(false);
    setSelectedStudent(null);
    setFormErrors({});
    setFormData({
      id: 0,
      email: "",
      firstName: "",
      lastName: "",
      department: "",
      rollNumber: "",
      semester: 1,
      batch: "",
      course: "",
      section: "",
      fatherName: "",
      motherName: "",
      contactNumber: "",
      address: "",
    });
  };

  // Define columns with proper styling and cell rendering
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "fullName",
      headerName: "Full Name",
      width: 200,
      flex: 1,
      valueGetter: (params: any) => {
        try {
          if (!params?.row?.user?.firstName && !params?.row?.user?.lastName)
            return "";
          const firstName = params.row.user.firstName || "";
          const lastName = params.row.user.lastName || "";
          return `${firstName} ${lastName}`.trim();
        } catch (error) {
          return "";
        }
      },
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row?.user) return null;

        const firstName = params.row.user.firstName || "";
        const lastName = params.row.user.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const initials =
          firstName && lastName
            ? `${firstName[0]}${lastName[0]}`
            : firstName[0] || "";

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}>
            {initials && (
              <Box
                sx={{
                  minWidth: 35,
                  width: 35,
                  height: 35,
                  borderRadius: "50%",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "uppercase",
                }}>
                {initials}
              </Box>
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {fullName}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "rollNumber",
      headerName: "Roll Number",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            height: "100%",
          }}>
          <BadgeIcon
            fontSize="small"
            sx={{ color: alpha(theme.palette.info.main, 0.7) }}
          />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return null;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}>
            <Chip
              label={params.value}
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                fontWeight: 500,
                borderRadius: 1.5,
                maxWidth: "100%",
              }}
            />
          </Box>
        );
      },
    },
    {
      field: "semester",
      headerName: "Semester",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            height: "100%",
          }}>
          <MenuBookIcon
            fontSize="small"
            sx={{ color: alpha(theme.palette.success.main, 0.7) }}
          />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "batch",
      headerName: "Batch",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            height: "100%",
          }}>
          <SchoolIcon
            fontSize="small"
            sx={{ color: alpha(theme.palette.warning.main, 0.7) }}
          />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "course",
      headerName: "Course",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            height: "100%",
          }}>
          <ClassIcon
            fontSize="small"
            sx={{ color: alpha(theme.palette.secondary.main, 0.7) }}
          />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "section",
      headerName: "Section",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            sx={{ color: theme.palette.primary.main }}
            onClick={() => handleOpenEditDialog(params.row as Student)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.error.main }}
            onClick={() => handleOpenDeleteDialog(params.row as Student)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {(isAdmin() || isHOD() || isPrincipal()) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}>
            Students
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            }}>
            Add Student
          </Button>
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          height: 600,
          p: 2,
          borderRadius: 4,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
        <Box sx={{ height: "100%", width: "100%" }}>
          <DataGrid
            rows={students.map((student) => ({
              ...student,
              department: student.user?.department || "",
            }))}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": {
                borderColor: alpha(theme.palette.divider, 0.1),
                padding: "8px 16px",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Paper>

      {/* Add/Edit Student Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        }}>
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 600,
          }}>
          {isEditMode ? "Edit Student" : "Add New Student"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                fullWidth
                required
                placeholder="John"
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                fullWidth
                required
                placeholder="Doe"
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                fullWidth
                placeholder="email@gmail.com"
                required
                disabled={isEditMode}
                error={!!formErrors.email}
                helperText={
                  formErrors.email ||
                  (isEditMode ? "Email cannot be changed" : "")
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                value={formData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                fullWidth
                required
                select
                error={!!formErrors.department}
                helperText={formErrors.department}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}>
                {["CSE", "ECE", "EEE", "MECH", "CIVIL"].map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Roll Number"
                value={formData.rollNumber}
                onChange={(e) =>
                  handleInputChange("rollNumber", e.target.value)
                }
                fullWidth
                required
                placeholder="0808CI221073"
                error={!!formErrors.rollNumber}
                helperText={formErrors.rollNumber}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Semester"
                type="number"
                value={formData.semester}
                onChange={(e) =>
                  handleInputChange("semester", parseInt(e.target.value) || 0)
                }
                fullWidth
                required
                InputProps={{ inputProps: { min: 1, max: 8 } }}
                placeholder="1-8"
                error={!!formErrors.semester}
                helperText={formErrors.semester}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Batch"
                value={formData.batch}
                onChange={(e) => handleInputChange("batch", e.target.value)}
                fullWidth
                required
                placeholder="2022-26"
                error={!!formErrors.batch}
                helperText={formErrors.batch}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Course"
                value={formData.course}
                onChange={(e) => handleInputChange("course", e.target.value)}
                fullWidth
                required
                select
                error={!!formErrors.course}
                helperText={formErrors.course}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}>
                {["B.Tech", "M.Tech", "BCA", "MCA"].map((course) => (
                  <MenuItem key={course} value={course}>
                    {course}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Section"
                value={formData.section}
                onChange={(e) => handleInputChange("section", e.target.value)}
                fullWidth
                required
                placeholder="A or CSE-1"
                error={!!formErrors.section}
                helperText={formErrors.section}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Father's Name"
                value={formData.fatherName}
                onChange={(e) =>
                  handleInputChange("fatherName", e.target.value)
                }
                fullWidth
                required
                error={!!formErrors.fatherName}
                helperText={formErrors.fatherName}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Mother's Name"
                value={formData.motherName}
                onChange={(e) =>
                  handleInputChange("motherName", e.target.value)
                }
                fullWidth
                required
                error={!!formErrors.motherName}
                helperText={formErrors.motherName}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) =>
                  handleInputChange("contactNumber", e.target.value)
                }
                fullWidth
                required
                error={!!formErrors.contactNumber}
                helperText={formErrors.contactNumber}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                fullWidth
                required
                multiline
                rows={3}
                error={!!formErrors.address}
                helperText={formErrors.address}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={loading}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              },
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            }}>
            {isEditMode ? "Update Student" : "Add Student"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the student{" "}
            <strong>
              {selectedStudent
                ? `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`
                : ""}
            </strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={loading}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              },
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteStudent}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            backgroundColor:
              snackbar.severity === "success"
                ? alpha(theme.palette.success.main, 0.95)
                : alpha(theme.palette.error.main, 0.95),
            color: "#fff",
            "& .MuiAlert-icon": {
              color: "#fff",
            },
          }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Students;
