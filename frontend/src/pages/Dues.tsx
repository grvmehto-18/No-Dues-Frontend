import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Add,
  Refresh,
  Receipt,
  CheckCircle,
  Cancel,
  Search,
  Download,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import dueService from "../services/dueService";
import { Due, CreateDueRequest } from "../types";
import { getUser } from "../utils/auth";
import api from "../services/api";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";

const Dues: React.FC = () => {
  const theme = useTheme();
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [openAddDueDialog, setOpenAddDueDialog] = useState<boolean>(false);
  const [openPayDueDialog, setOpenPayDueDialog] = useState<boolean>(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState<boolean>(false);
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [rollNumber, setRollNumber] = useState<string>("");
  const [studentIdFromRoll, setStudentIdFromRoll] = useState<number | null>(
    null
  );
  const [rollNumberError, setRollNumberError] = useState<string>("");
  const [lookingUpStudent, setLookingUpStudent] = useState<boolean>(false);
  const [departments, setDepartments] = useState<
    { name: string; displayName: string }[]
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("online");
  const [useESign, setUseESign] = useState<boolean>(true);

  const user = getUser();
  const isAdmin = user?.roles.includes("ROLE_ADMIN");
  const isDepartmentAdmin = user?.roles.includes("ROLE_DEPARTMENT_ADMIN");
  const isStudent = user?.roles.includes("ROLE_STUDENT");

  const [newDue, setNewDue] = useState<CreateDueRequest>({
    studentId: 0,
    department: isDepartmentAdmin && user ? user.department : "",
    description: "",
    amount: 0,
    dueDate: new Date().toISOString(),
  });

  const { updateUser } = useAuth();

  useEffect(() => {
    fetchDepartments();
    fetchDues();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments/list");
      setDepartments(response.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to fetch departments. Please try again later.");
    }
  };

  const fetchDues = async () => {
    setLoading(true);
    try {
      const data = await dueService.getAllDues();
      console.log(data);
      if (isDepartmentAdmin && user) {
        const filteredDues = data.filter(
          (due) => due.department === user.department
        );
        setDues(filteredDues);
      } else {
        setDues(data);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching dues:", err);
      setError("Failed to fetch dues. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDue = async () => {
    try {
      if (!studentIdFromRoll) {
        setError("Please enter a valid roll number and verify it first.");
        return;
      }
      const dueToAdd = { ...newDue, studentId: studentIdFromRoll };
      if (isDepartmentAdmin && user) {
        dueToAdd.department = user.department;
      }
      await dueService.createDue(dueToAdd);
      setOpenAddDueDialog(false);
      setSuccess("Due added successfully!");
      fetchDues();
      setNewDue({
        studentId: 0,
        department: isDepartmentAdmin && user ? user.department : "",
        description: "",
        amount: 0,
        dueDate: new Date().toISOString(),
      });
      setRollNumber("");
      setStudentIdFromRoll(null);
      setRollNumberError("");
    } catch (err) {
      console.error("Error adding due:", err);
      setError("Failed to add due. Please try again.");
    }
  };

  const lookupStudentByRollNumber = async () => {
    if (!rollNumber.trim()) {
      setRollNumberError("Roll number is required");
      return;
    }
    setLookingUpStudent(true);
    setRollNumberError("");
    try {
      const response = await api.get(`/students/roll/${rollNumber}`);
      if (response.data && response.data.user.id) {
        const userId = response.data.user.id;
        setStudentIdFromRoll(userId);
        const studentName = `${response.data.user.firstName || ""} ${
          response.data.user.lastName || ""
        }`.trim();
        setSuccess(`Student found: ${studentName || "Unknown"}`);
      } else {
        setRollNumberError("Student not found with this roll number");
        setStudentIdFromRoll(null);
      }
    } catch (err: any) {
      console.error("Error looking up student:", err);
      setRollNumberError(
        err.response?.data?.message || "Failed to find student"
      );
      setStudentIdFromRoll(null);
    } finally {
      setLookingUpStudent(false);
    }
  };

  const handlePayDue = async () => {
    if (!selectedDue) return;
    try {
      const finalReference =
        paymentMethod === "cash"
          ? `CASH-${paymentReference}`
          : paymentReference;
      await dueService.payDue(selectedDue.id, finalReference);
      setOpenPayDueDialog(false);
      setSuccess("Payment recorded successfully!");
      fetchDues();
      setPaymentReference("");
      setPaymentMethod("online");
    } catch (err) {
      console.error("Error paying due:", err);
      setError("Failed to record payment. Please try again.");
    }
  };

  const handleApproveDue = async (dueId: number) => {
    try {
      const dueToApprove = dues.find((due) => due.id === dueId);
      if (
        isDepartmentAdmin &&
        user &&
        dueToApprove &&
        dueToApprove.department !== user.department
      ) {
        setError("You can only approve dues for your department.");
        return;
      }
      await dueService.approveDue(dueId);
      setSuccess("Due approved successfully!");
      fetchDues();
    } catch (err) {
      console.error("Error approving due:", err);
      setError("Failed to approve due. Please try again.");
    }
  };

  const handleRejectDue = async (dueId: number) => {
    try {
      const dueToReject = dues.find((due) => due.id === dueId);
      if (
        isDepartmentAdmin &&
        user &&
        dueToReject &&
        dueToReject.department !== user.department
      ) {
        setError("You can only reject dues for your department.");
        return;
      }
      await dueService.rejectDue(dueId);
      setSuccess("Due rejected successfully!");
      fetchDues();
    } catch (err) {
      console.error("Error rejecting due:", err);
      setError("Failed to reject due. Please try again.");
    }
  };

  const handleGenerateReceipt = async (due: Due) => {
    if (isDepartmentAdmin && user && due.department !== user.department) {
      setError("You can only generate receipts for your department.");
      return;
    }
    try {
      const response = await api.post(`/dues/${due.id}/generate-receipt`);
      const updatedDue = response.data; // Capture the updated Due object from the response
      setSelectedDue(updatedDue); // Update selectedDue with the response data
      setOpenReceiptDialog(true);
      setSuccess("Receipt generated successfully!");
      // Optionally refresh the dues list to reflect the updated receiptGenerated status
      fetchDues();
    } catch (err: any) {
      console.error("Error generating receipt:", err);
      setError(
        err.response?.data ||
          "Failed to generate receipt. It may have already been generated."
      );
    }
  };

  const fetchUserESignature = async () => {
    if (user) {
      try {
        const signature = await userService.getESignature();
        if (signature) {
          const updatedUser = { ...user, eSignature: signature };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          updateUser({ eSignature: signature });
          setSuccess("E-signature loaded successfully");
          return signature;
        } else {
          setError("No e-signature found. Please upload one in your profile.");
          return null;
        }
      } catch (error: any) {
        console.error("Failed to fetch e-signature:", error);
        setError(
          "Failed to fetch e-signature. Please upload one in your profile."
        );
      }
    }
  };

  const filteredDues = dues.filter(
    (due) =>
      (due.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        due.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        due.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        due.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (isDepartmentAdmin && user ? due.department === user.department : true)
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy hh:mm a");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

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
      field: "studentName",
      headerName: "Student",
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}>
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
            {params.value
              ? params.value
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
              : "NA"}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {params.value}
          </Typography>
        </Box>
      ),
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
          <Typography variant="body2">{params.value || "N/A"}</Typography>
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
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
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 200,
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
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}>
          <Typography variant="body2">
            {formatCurrency(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}>
          <Typography variant="body2">{formatDate(params.value)}</Typography>
        </Box>
      ),
    },
    {
      field: "paymentStatus",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
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
            color={
              params.value === "PENDING"
                ? "warning"
                : params.value === "PAID"
                ? "info"
                : params.value === "APPROVED"
                ? "success"
                : params.value === "REJECTED"
                ? "error"
                : "default"
            }
          />
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          {isStudent && params.row.paymentStatus === "PENDING" && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                setSelectedDue(params.row as Due);
                setOpenPayDueDialog(true);
              }}>
              Pay
            </Button>
          )}
          {(isAdmin ||
            (isDepartmentAdmin &&
              user &&
              params.row.department === user.department)) && (
            <>
              <IconButton
                color="success"
                size="small"
                onClick={() => handleApproveDue(params.row.id)}
                disabled={params.row.paymentStatus !== "PAID"}
                sx={{ opacity: params.row.paymentStatus !== "PAID" ? 0.5 : 1 }}>
                <CheckCircle fontSize="small" />
              </IconButton>
              <IconButton
                color="error"
                size="small"
                onClick={() => handleRejectDue(params.row.id)}
                disabled={params.row.paymentStatus !== "PAID"}
                sx={{ opacity: params.row.paymentStatus !== "PAID" ? 0.5 : 1 }}>
                <Cancel fontSize="small" />
              </IconButton>
            </>
          )}
          {(isAdmin ||
            (isDepartmentAdmin &&
              user &&
              params.row.department === user.department)) &&
            params.row.paymentStatus === "APPROVED" && (
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleGenerateReceipt(params.row as Due)}
                title="Generate Receipt">
                <Receipt fontSize="small" />
              </IconButton>
            )}
        </Stack>
      ),
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
          Dues Management
        </Typography>
        <Box>
          {(isAdmin || isDepartmentAdmin) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenAddDueDialog(true)}
              sx={{
                mr: 2,
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}>
              Add Due
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDues}
            sx={{
              borderRadius: 2,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
        {isDepartmentAdmin && user && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            You are viewing dues for {user.department} department only.
          </Alert>
        )}

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by student name, department, description or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: 2,
            },
          }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : dues.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            No dues found.
          </Alert>
        ) : (
          <Box sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={filteredDues}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: rowsPerPage, page: page },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setRowsPerPage(model.pageSize);
              }}
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
        )}
      </Paper>

      <Dialog
        open={openAddDueDialog}
        onClose={() => setOpenAddDueDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Add New Due</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <TextField
              margin="dense"
              label="Roll Number"
              fullWidth
              value={rollNumber}
              onChange={(e) => {
                setRollNumber(e.target.value);
                setRollNumberError("");
                setStudentIdFromRoll(null);
              }}
              required
              error={!!rollNumberError}
              helperText={rollNumberError}
              sx={{
                mr: 1,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                },
              }}
            />
            <Button
              variant="contained"
              onClick={lookupStudentByRollNumber}
              disabled={lookingUpStudent || !rollNumber.trim()}
              sx={{
                mt: 1,
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}>
              {lookingUpStudent ? "Verifying..." : "Verify"}
            </Button>
          </Box>
          {studentIdFromRoll && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Student verified successfully!
            </Alert>
          )}
          {!isDepartmentAdmin && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={newDue.department}
                onChange={(e) =>
                  setNewDue({ ...newDue, department: e.target.value })
                }
                label="Department"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  borderRadius: 2,
                }}>
                {departments.map((dept) => (
                  <MenuItem key={dept.name} value={dept.name}>
                    {dept.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {isDepartmentAdmin && user && (
            <TextField
              margin="dense"
              label="Department"
              fullWidth
              value={user.department}
              disabled
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                },
              }}
            />
          )}
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newDue.description}
            onChange={(e) =>
              setNewDue({ ...newDue, description: e.target.value })
            }
            required
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          />
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={newDue.amount}
            onChange={(e) =>
              setNewDue({ ...newDue, amount: Number(e.target.value) })
            }
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₹</InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Due Date"
              value={new Date(newDue.dueDate)}
              onChange={(date) => {
                if (date) setNewDue({ ...newDue, dueDate: date.toISOString() });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "dense",
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenAddDueDialog(false)}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              },
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddDue}
            variant="contained"
            color="primary"
            disabled={!studentIdFromRoll || !!rollNumberError}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPayDueDialog}
        onClose={() => setOpenPayDueDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Pay Due</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please select payment method and enter the payment reference number.
          </DialogContentText>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Payment Method"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderRadius: 2,
              }}>
              <MenuItem value="online">Online Payment</MenuItem>
              <MenuItem value="cash">Cash Payment</MenuItem>
            </Select>
          </FormControl>
          <TextField
            autoFocus
            margin="dense"
            label={
              paymentMethod === "cash" ? "Receipt Number" : "Payment Reference"
            }
            fullWidth
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            required
            helperText={
              paymentMethod === "cash"
                ? "Enter receipt number provided by cashier"
                : "Enter online transaction reference"
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenPayDueDialog(false)}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              },
            }}>
            Cancel
          </Button>
          <Button
            onClick={handlePayDue}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReceiptDialog}
        onClose={() => setOpenReceiptDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Payment Receipt</DialogTitle>
        <DialogContent>
          {selectedDue && (
            <Box
              className="printable-receipt"
              sx={{
                p: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
                mt: 2,
              }}>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  COLLEGE DUE MANAGEMENT SYSTEM
                </Typography>
                <Typography variant="subtitle1">
                  INSTITUTE OF ENGINEERING & SCIENCE
                </Typography>
                <Typography variant="body2">
                  Knowledge Village, A.B. Road, 452012
                </Typography>
                <Typography variant="body2">
                  Ph: 0731-4014604, E-mail: office@college.org
                </Typography>
              </Box>

              <Typography
                variant="h6"
                align="center"
                sx={{ fontWeight: "bold", mb: 3 }}>
                PAYMENT RECEIPT
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Receipt No:
                  </Typography>
                  <Typography variant="body1">
                    {selectedDue.receiptNumber || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Date:
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(), "dd/MM/yyyy")}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Student Name:
                  </Typography>
                  <Typography variant="body1">
                    {selectedDue.studentName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Roll Number:
                  </Typography>
                  <Typography variant="body1">
                    {selectedDue.rollNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Department:
                  </Typography>
                  <Typography variant="body1">
                    {selectedDue.department}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Description:
                  </Typography>
                  <Typography variant="body1">
                    {selectedDue.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Amount Paid:
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedDue.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Date:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedDue.paymentDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Reference:
                  </Typography>
                  <Typography variant="body1">
                    {selectedDue.paymentReference}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Authorized Signature:
                  </Typography>
                  {useESign && user?.eSignature ? (
                    <img
                      src={`data:image/png;base64,${user.eSignature}`}
                      alt="E-Signature"
                      style={{
                        maxWidth: "150px",
                        maxHeight: "60px",
                        marginTop: "10px",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        borderBottom: "1px solid #000",
                        width: 150,
                        mt: 2,
                        mb: 1,
                      }}></Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <FormControl component="fieldset">
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    Signature Type:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant={useESign ? "contained" : "outlined"}
                      size="small"
                      onClick={async () => {
                        setUseESign(true);
                        if (user && !user.eSignature)
                          await fetchUserESignature();
                      }}
                      sx={{ borderRadius: 2 }}>
                      E-Signature
                    </Button>
                    <Button
                      variant={!useESign ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setUseESign(false)}
                      sx={{ borderRadius: 2 }}>
                      Manual Signature
                    </Button>
                  </Box>
                </FormControl>
              </Box>

              <Box
                sx={{
                  mt: 5,
                  p: 2,
                  backgroundColor: alpha(theme.palette.grey[200], 0.5),
                  borderRadius: 1,
                }}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  align="center">
                  This is a computer-generated receipt and does not require a
                  physical signature if e-signed.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenReceiptDialog(false)}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              },
            }}>
            Close
          </Button>
          <Button
            startIcon={<Download />}
            variant="contained"
            color="primary"
            onClick={handlePrint}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}>
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={() => setSuccess("")}
          severity="success"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.95),
            color: "#fff",
            "& .MuiAlert-icon": {
              color: "#fff",
            },
          }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={() => setError("")}
          severity="error"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.error.main, 0.95),
            color: "#fff",
            "& .MuiAlert-icon": {
              color: "#fff",
            },
          }}
          action={
            error.includes("signature") ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => (window.location.href = "/profile")}
                sx={{ color: "#fff" }}>
                Go to Profile
              </Button>
            ) : null
          }>
          {error}
        </Alert>
      </Snackbar>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-receipt, .printable-receipt * {
                visibility: visible;
              }
              .printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
                box-sizing: border-box;
              }
              .printable-receipt .MuiFormControl-root {
                display: none;
              }
            }
          `,
        }}
      />
    </Container>
  );
};

export default Dues;
