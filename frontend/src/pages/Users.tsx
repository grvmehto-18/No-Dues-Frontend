import React, { useState, useEffect, Component, ErrorInfo } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  School as SchoolIcon,
  SupervisorAccount as HodIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/auth";
import api from "../services/api";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema for form validation
const formSchema = z.object({
  id: z.number().nullable(),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  department: z.string().min(1, "Department is required"),
  roles: z
    .array(z.string())
    .min(1, "At least one role is required")
    .refine(
      (roles) =>
        roles.every((role) =>
          [
            "ROLE_ADMIN",
            "ROLE_HOD",
            "ROLE_DEPARTMENT_ADMIN",
            "ROLE_PRINCIPAL",
          ].includes(role)
        ),
      { message: "Invalid role selected" }
    ),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  roles: Role[];
}

interface Role {
  name: string;
}

// Error Boundary Component
class DataGridErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DataGrid Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography color="error">
            An error occurred while rendering the user list. Please try again
            later.
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const Users: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    hods: 0,
    departmentAdmins: 0,
  });
  const [departments, setDepartments] = useState<
    { name: string; displayName: string }[]
  >([]);
  const availableRoles = [
    "ROLE_ADMIN",
    "ROLE_HOD",
    "ROLE_DEPARTMENT_ADMIN",
    "ROLE_PRINCIPAL",
  ];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: null,
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      roles: [],
    },
  });

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 70,
      align: "center",
      headerAlign: "center",
      type: "number",
    },
    {
      field: "name",
      headerName: "Full Name",
      width: 280,
      flex: 1,
      valueGetter: (params: GridRenderCellParams<User>) => {
        if (!params || !params.row) return "";
        const firstName = params.row.firstName || "";
        const lastName = params.row.lastName || "";
        return firstName || lastName ? `${firstName} ${lastName}`.trim() : "";
      },
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row) return null;
        const firstName = params.row.firstName || "";
        const lastName = params.row.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const initials =
          firstName && lastName
            ? `${firstName[0]}${lastName[0]}`
            : firstName[0] || lastName[0] || "";

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
              {fullName || "N/A"}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "email",
      headerName: "Email",
      width: 300,
      flex: 1,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.value) return null;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.primary.main,
              },
            }}>
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {params.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "department",
      headerName: "Department",
      width: 130,
      renderCell: (params: GridRenderCellParams<User>) => {
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
      field: "roles",
      headerName: "Roles",
      width: 320,
      flex: 0.8,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row?.roles?.length) return null;
        return (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              flexWrap: "wrap",
              maxWidth: "100%",
              overflow: "hidden",
            }}>
            {params.row.roles.map((role) => {
              const roleName =
                typeof role === "string" ? role : role?.name || "";
              if (!roleName) return null;
              const isAdmin = roleName.includes("ADMIN");
              const isHod = roleName.includes("HOD");
              const isPrincipal = roleName.includes("PRINCIPAL");
              return (
                <Chip
                  key={roleName}
                  label={roleName.replace("ROLE_", "")}
                  size="small"
                  sx={{
                    backgroundColor: isAdmin
                      ? alpha(theme.palette.error.main, 0.1)
                      : isHod
                      ? alpha(theme.palette.primary.main, 0.1)
                      : isPrincipal
                      ? alpha(theme.palette.warning.main, 0.1)
                      : alpha(theme.palette.secondary.main, 0.1),
                    color: isAdmin
                      ? theme.palette.error.main
                      : isHod
                      ? theme.palette.primary.main
                      : isPrincipal
                      ? theme.palette.warning.main
                      : theme.palette.secondary.main,
                    fontWeight: 500,
                    borderRadius: 1.5,
                    maxWidth: "100%",
                    "& .MuiChip-label": {
                      px: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              );
            })}
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row) return null;
        return (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "center",
              width: "100%",
            }}>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              disabled={!isAdmin(user)}
              sx={{
                color: "primary.main",
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              disabled={!isAdmin(user)}
              sx={{
                color: "error.main",
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      const userData = Array.isArray(response.data) ? response.data : [];
      setUsers(userData);
      // Calculate stats
      const userStats = userData.reduce(
        (acc: any, user: User) => {
          acc.totalUsers++;
          user.roles.forEach((role: Role) => {
            const roleName = typeof role === "string" ? role : role.name;
            if (roleName.includes("ADMIN")) acc.admins++;
            if (roleName.includes("HOD")) acc.hods++;
            if (roleName.includes("DEPARTMENT_ADMIN")) acc.departmentAdmins++;
          });
          return acc;
        },
        { totalUsers: 0, admins: 0, hods: 0, departmentAdmins: 0 }
      );
      setStats(userStats);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: "Authentication error. Please log in again.",
          severity: "error",
        });
        setTimeout(() => navigate("/login"), 1000);
        return;
      }
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to fetch users",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments/list");
      const deptData = Array.isArray(response.data) ? response.data : [];
      setDepartments(deptData);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch departments",
        severity: "error",
      });
    }
  };

  const handleEdit = (user: User) => {
    const roles = user.roles
      .map((role: any) => (typeof role === "string" ? role : role.name))
      .filter((role: string) => role && availableRoles.includes(role));
    reset({
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      department: user.department || "",
      roles,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setLoading(true);
      await api.delete(`/users/${id}`);
      setSnackbar({
        open: true,
        message: "User deleted successfully",
        severity: "success",
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: "Authentication error. Please log in again.",
          severity: "error",
        });
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete user",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      if (data.id) {
        // Update existing user
        const updateData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          department: data.department,
          roles: data.roles,
        };
        await api.put(`/users/${data.id}`, updateData);
        setSnackbar({
          open: true,
          message: "User updated successfully",
          severity: "success",
        });
      } else {
        // Create new user
        await api.post("/users", data);
        setSnackbar({
          open: true,
          message: "User created successfully. Credentials sent to email.",
          severity: "success",
        });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error("Error during user operation:", error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: "Authentication error. Please log in again.",
          severity: "error",
        });
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          (data.id ? "Failed to update user" : "Failed to create user"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderRadius: 3,
          }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 4,
            }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Users Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive overview of system users and their roles
              </Typography>
            </Box>
            {isAdmin(user) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}>
                Add User
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            {[
              {
                label: "Total Users",
                value: stats.totalUsers,
                icon: <PeopleIcon sx={{ color: theme.palette.primary.main }} />,
                borderColor: theme.palette.primary.main,
              },
              {
                label: "Admins",
                value: stats.admins,
                icon: <AdminIcon sx={{ color: theme.palette.error.main }} />,
                borderColor: theme.palette.error.main,
              },
              {
                label: "HODs",
                value: stats.hods,
                icon: <HodIcon sx={{ color: theme.palette.warning.main }} />,
                borderColor: theme.palette.warning.main,
              },
              {
                label: "Department Admins",
                value: stats.departmentAdmins,
                icon: <SchoolIcon sx={{ color: theme.palette.info.main }} />,
                borderColor: theme.palette.info.main,
              },
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    borderRadius: 3,
                    border: `1px solid ${alpha(stat.borderColor, 0.1)}`,
                  }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: alpha(stat.borderColor, 0.1),
                      }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 700, mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>

      <DataGridErrorBoundary>
        <Paper
          elevation={0}
          sx={{
            height: "calc(100vh - 200px)",
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
            display: "flex",
            flexDirection: "column",
            "& .MuiDataGrid-root": {
              border: "none",
              backgroundColor: theme.palette.background.paper,
              flex: 1,
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
                {
                  outline: "none",
                },
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `2px solid ${alpha(
                theme.palette.primary.main,
                0.1
              )}`,
              "& .MuiDataGrid-columnHeader": {
                padding: "0 16px",
                "&:not(:last-child)": {
                  borderRight: `1px solid ${alpha(
                    theme.palette.divider,
                    0.05
                  )}`,
                },
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 600,
                fontSize: "0.875rem",
                color: theme.palette.text.primary,
              },
            },
            "& .MuiDataGrid-row": {
              "&:nth-of-type(even)": {
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              },
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
              },
              "& .MuiDataGrid-cell": {
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                overflow: "hidden",
                '&[data-field="id"]': { justifyContent: "center" },
                '&[data-field="department"]': { justifyContent: "flex-start" },
                '&[data-field="actions"]': { justifyContent: "center" },
              },
            },
            "& .MuiDataGrid-cell": {
              fontSize: "0.875rem",
              color: theme.palette.text.secondary,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              "&:not(:last-child)": {
                borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              },
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
            },
            "& .MuiTablePagination-root": {
              color: theme.palette.text.secondary,
              "& .MuiTablePagination-select": { borderRadius: 1.5 },
              "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel":
                {
                  margin: 0,
                },
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: theme.palette.background.paper,
              "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            },
          }}>
          <DataGrid
            rows={users}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            loading={loading}
            getRowId={(row) => row.id}
            sx={{
              "& .MuiDataGrid-columnHeader": {
                color: theme.palette.text.primary,
                fontWeight: 600,
              },
              "& .MuiDataGrid-cell": { color: theme.palette.text.secondary },
              "& .MuiCircularProgress-root": {
                color: theme.palette.primary.main,
              },
            }}
          />
        </Paper>
      </DataGridErrorBoundary>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[3] } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {control._defaultValues.id ? "Edit User" : "Add New User"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(2, 1fr)",
            }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  required
                  size="small"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  required
                  size="small"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  fullWidth
                  required
                  type="email"
                  size="small"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{
                    gridColumn: "1 / -1",
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  }}
                />
              )}
            />
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Department"
                  required
                  size="small"
                  error={!!errors.department}
                  helperText={errors.department?.message}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}>
                  {departments.length ? (
                    departments.map((dept) => (
                      <MenuItem key={dept.name} value={dept.name}>
                        {dept.displayName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No departments available</MenuItem>
                  )}
                </TextField>
              )}
            />
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Roles"
                  fullWidth
                  required
                  size="small"
                  error={!!errors.roles}
                  helperText={errors.roles?.message}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  SelectProps={{
                    multiple: true,
                    value: field.value || [],
                    onChange: (e) => field.onChange(e.target.value),
                    renderValue: (selected: unknown) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(selected as string[]).map((role) => (
                          <Chip
                            key={role}
                            label={role.replace("ROLE_", "")}
                            size="small"
                            sx={{
                              backgroundColor: role.includes("ADMIN")
                                ? alpha(theme.palette.error.main, 0.1)
                                : role.includes("HOD")
                                ? alpha(theme.palette.primary.main, 0.1)
                                : role.includes("PRINCIPAL")
                                ? alpha(theme.palette.warning.main, 0.1)
                                : alpha(theme.palette.secondary.main, 0.1),
                              color: role.includes("ADMIN")
                                ? theme.palette.error.main
                                : role.includes("HOD")
                                ? theme.palette.primary.main
                                : role.includes("PRINCIPAL")
                                ? theme.palette.warning.main
                                : theme.palette.secondary.main,
                            }}
                          />
                        ))}
                      </Box>
                    ),
                  }}>
                  {availableRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.replace("ROLE_", "")}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
          {!control._defaultValues.id && (
            <Alert
              severity="info"
              sx={{
                mt: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
              }}>
              A unique username and password will be generated and sent to the
              user's email address.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: alpha(theme.palette.text.primary, 0.1),
              color: theme.palette.text.secondary,
              "&:hover": {
                borderColor: alpha(theme.palette.text.primary, 0.2),
                backgroundColor: alpha(theme.palette.text.primary, 0.02),
              },
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting || loading}
            sx={{
              borderRadius: 2,
              px: 3,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                backgroundColor: alpha(theme.palette.primary.main, 0.8),
              },
            }}>
            {isSubmitting || loading
              ? "Saving..."
              : control._defaultValues.id
              ? "Update"
              : "Add"}
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
            boxShadow: theme.shadows[2],
            backgroundColor:
              snackbar.severity === "success"
                ? alpha(theme.palette.success.main, 0.95)
                : alpha(theme.palette.error.main, 0.95),
            color: "#fff",
            "& .MuiAlert-icon": { color: "#fff" },
          }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Users;
