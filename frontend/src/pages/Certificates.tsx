import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  TextField,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Add,
  Refresh,
  Download,
  Assignment,
  Delete, // Add Delete icon
} from "@mui/icons-material";
import { format } from "date-fns";
import certificateService from "../services/certificateService";
import { NoDueCertificate } from "../types";
import { getUser, getToken, isDepartmentAdmin } from "../utils/auth";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Certificates: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [certificates, setCertificates] = useState<NoDueCertificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openRequestDialog, setOpenRequestDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false); // Add state for delete dialog
  const [certificateToDelete, setCertificateToDelete] = useState<number | null>(
    null
  ); // Track certificate to delete
  const [rollNumber, setRollNumber] = useState<string>("");
  const [rollNumberError, setRollNumberError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const initialFetchDone = useRef<boolean>(false);
  const user = getUser();
  const isStudent = user?.roles.includes("ROLE_STUDENT");
  const isDepartmentAdmin = user?.roles.includes("ROLE_DEPARTMENT_ADMIN");
  const isAdmin = user?.roles.includes("ROLE_ADMIN"); // Check if user is admin
  const canRequestCertificate = isStudent; // Anyone except department admin can request
  const canDeleteCertificate = isAdmin; // Only admins can delete certificates

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError("No authentication token found. Please log in.");
        setTimeout(
          () =>
            navigate("/login", {
              state: {
                message: "No authentication token found. Please log in.",
              },
            }),
          2000
        );
        return;
      }

      const data = await certificateService.getAllCertificates();
      console.log(data);
      setCertificates(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching certificates:", err);
      setError(err.response?.data?.message || "Failed to fetch certificates.");
    } finally {
      setLoading(false);
    }
  }, [isStudent, user]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchCertificates();
      initialFetchDone.current = true;
    }
  }, [fetchCertificates]);

  const handleRequestCertificate = async () => {
    let apiEndpoint: string;

    if (isStudent) {
      // For students, the backend must infer the roll number from the token.
      // The API endpoint should not include a roll number in the path.
      apiEndpoint = `/certificates/request`;
    } else {
      // For non-students, the roll number must be provided.
      const rollNumberToUse = rollNumber.trim();
      if (!rollNumberToUse) {
        setRollNumberError("Roll number is required");
        return;
      }
      apiEndpoint = `/certificates/request/${rollNumberToUse}`;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }
      const response = await api.post(apiEndpoint);
      setSuccess(response.data.message || "Certificate requested successfully");
      setRollNumber(""); // Clear for next use (if not student)
      setOpenRequestDialog(false);
      fetchCertificates();
    } catch (err: any) {
      console.error("Error requesting certificate:", err);
      setError(err.response?.data?.message || "Failed to request certificate.");
      setRollNumber(""); // Clear for next use (if not student)
      setOpenRequestDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async () => {
    if (certificateToDelete === null) return;

    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }
      await api.delete(`/certificates/${certificateToDelete}`);
      setSuccess("Certificate deleted successfully");
      setOpenDeleteDialog(false);
      setCertificateToDelete(null);
      fetchCertificates();
    } catch (err: any) {
      console.error("Error deleting certificate:", err);
      setError(err.response?.data?.message || "Failed to delete certificate.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificateId: number) => {
    try {
      const blob = await certificateService.downloadCertificate(certificateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `no-due-certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading certificate:", err);
      setError("Failed to download certificate.");
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "PARTIAL":
        return "info";
      case "ALLSGND":
        return "secondary";
      case "HOD_APPROVED":
        return "secondary";
      case "PRINCIPAL_APPROVED":
        return "primary";
      case "COMPLETED":
        return "success";
      case "REJECTED":
        return "error";
      case "COMPLETE":
        return "success"; // Add support for COMPLETE status
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null) => {
    return dateString
      ? format(new Date(dateString), "dd/MM/yyyy hh:mm a")
      : "N/A";
  };

  const canDownload = (certificate: NoDueCertificate) => {
    return (
      certificate.status === "COMPLETED" && certificate.certificatePath !== null
    );
  };

  const paginatedCertificates = certificates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            {isStudent ? "My Certificates" : "Certificates"}
          </Typography>
          <Box>
            {canRequestCertificate && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => setOpenRequestDialog(true)}
                sx={{
                  mr: 2,
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}>
                Request Certificate
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchCertificates}
              disabled={loading}
              sx={{
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}>
              Refresh
            </Button>
          </Box>
        </Box>
        {/* {isDepartmentAdmin && certificates.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>There are no certificates for signing in your department.</Alert>
        )} */}
        {isDepartmentAdmin && certificates.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have {certificates.length} certificates to approve that are not
            signed by your department.
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : certificates.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {" "}
            {isDepartmentAdmin && certificates.length === 0
              ? "There are no certificates for signing in your department. And you only see the cetificates if they are not signed by your department."
              : "No certificates found."}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Certificate ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Issue Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCertificates.map((certificate) => (
                    <TableRow
                      key={certificate.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.02
                          ),
                        },
                      }}>
                      <TableCell>{certificate.id}</TableCell>
                      <TableCell>{certificate.studentName}</TableCell>
                      <TableCell>
                        <Chip
                          label={certificate.status}
                          color={getStatusChipColor(certificate.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(certificate.issueDate)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            color="primary"
                            onClick={() =>
                              navigate(`/certificates/${certificate.id}`)
                            }
                            title="View Details">
                            <Assignment />
                          </IconButton>
                          {canDownload(certificate) && (
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() =>
                                handleDownloadCertificate(certificate.id)
                              }
                              title="Download Certificate">
                              <Download />
                            </IconButton>
                          )}
                          {canDeleteCertificate && (
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setCertificateToDelete(certificate.id);
                                setOpenDeleteDialog(true);
                              }}
                              title="Delete Certificate">
                              <Delete />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={certificates.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Request Certificate Dialog */}
      <Dialog
        open={openRequestDialog}
        onClose={() => setOpenRequestDialog(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Request No Due Certificate</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isStudent
              ? "Are you sure you want to request a No Due Certificate? This will initiate the approval process for your own certificate."
              : "Enter the roll number of the student to request a No Due Certificate on their behalf."}
          </DialogContentText>
          {!isStudent && (
            <TextField
              fullWidth
              label="Roll Number"
              value={rollNumber}
              onChange={(e) => {
                setRollNumber(e.target.value);
                setRollNumberError(null);
              }}
              error={!!rollNumberError}
              helperText={rollNumberError}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenRequestDialog(false)}
            sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleRequestCertificate}
            variant="contained"
            color="primary"
            disabled={loading || (!isStudent && !rollNumber.trim())}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}>
            Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Certificate Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Delete Certificate</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to delete this certificate? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCertificate}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.95),
            color: "#fff",
            "& .MuiAlert-icon": { color: "#fff" },
          }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.error.main, 0.95),
            color: "#fff",
            "& .MuiAlert-icon": { color: "#fff" },
          }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Certificates;
