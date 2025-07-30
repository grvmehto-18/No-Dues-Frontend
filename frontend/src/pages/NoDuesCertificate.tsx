import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, Paper, Box, Button, TextField, Dialog, DialogActions, 
  DialogContent, DialogTitle, Grid, Chip, 
  Divider, FormControl, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Snackbar, Alert, CircularProgress, Card, CardContent
} from '@mui/material';
import { Download, Refresh } from '@mui/icons-material';
import { format } from 'date-fns';
import { getUser } from '../utils/auth';
import api from '../services/api';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams} from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

interface DepartmentSignature {
  id: number;
  studentId: string;
  studentName: string;
  department: string;
  signedBy: string;
  signedAt: string;
  status: string;
  comments: string;
  esignature?: string;
}

interface NoDuesCertificateData {
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
  computerCode: string;
  departmentSignatures: DepartmentSignature[];
  principalESignature?: string;
}

const NoDuesCertificatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<NoDuesCertificateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [useESign, setUseESign] = useState<boolean>(true);
  const [comments, setComments] = useState<string>('');
  const [openSignDialog, setOpenSignDialog] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [signing, setSigning] = useState<boolean>(false);

  const contentRef = useRef<HTMLDivElement>(null);
const reactToPrintFn = useReactToPrint({ contentRef });


  const user = getUser();
  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isDepartmentAdmin = user?.roles.includes('ROLE_DEPARTMENT_ADMIN');
  const isHOD = user?.roles.includes('ROLE_HOD');
  const isPrincipal = user?.roles.includes('ROLE_PRINCIPAL');

  const { updateUser } = useAuth();

  useEffect(() => {
    if (id) {
      fetchCertificate();
    }
  }, [id]);
  

  
  const fetchCertificate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/certificates/${id}`);
      console.log('Fetched certificate:', response.data);
      setCertificate(response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching certificate:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch certificate. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

 

  const fetchUserESignature = async () => {
    if (user) {
      try {
        const signature = await userService.getESignature();
        if (signature) {
          const updatedUser = { ...user, eSignature: signature };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          updateUser({ eSignature: signature });
          setSuccess('E-signature loaded successfully');
          return signature;
        } else {
          setError('No e-signature found. Please upload one in your profile.');
          return null;
        }
      } catch (error: any) {
        console.error('Failed to fetch e-signature:', error);
        setError('Failed to fetch e-signature. Please try again.');
        return null;
      }
    }
    return null;
  };

  const handleSignByDepartment = async () => {
    if (!selectedDepartment) {
      setError('Please select a department to sign.');
      return;
    }

    try {
      if (useESign && user && !user.eSignature) {
        const signature = await fetchUserESignature();
        if (!signature) {
          return;
        }
      }

      await api.post(`/certificates/${id}/sign-department`, null, {
        params: {
          department: selectedDepartment,
          comments: comments,
          useESign: useESign,
        },
      });

      setSuccess(`Certificate signed successfully for ${selectedDepartment} department.`);
      setOpenSignDialog(false);
      await fetchCertificate(); // Refresh after signing
    } catch (err: any) {
      console.error('Error signing certificate:', err);
      setError(err.response?.data?.message || 'Failed to sign certificate. Please try again.');
    }
  };

  const handleRequestSignature = async (department: string) => {
    try {
      await api.post(`/certificates/${id}/request-department-signature`, null, {
        params: { department },
      });
      setSuccess(`Signature request sent to ${department} department.`);
    } catch (err: any) {
      console.error('Error requesting signature:', err.response?.data?.message);
      setError(err.response?.data?.message || 'Failed to fetch certificate. Please try again later.');
    }
  };

  const handleSignByPrincipal = async () => {
    try {
      setSigning(true);
      if (useESign && user && !user.eSignature) {
        const signature = await fetchUserESignature();
        if (!signature) {
          return;
        }
      }

      await api.post(`/certificates/${id}/sign-principal`, null, {
        params: { useESign: useESign },
      });

      setSuccess('Certificate signed successfully by Principal.');
      await fetchCertificate();
    } catch (err: any) {
      console.error('Error signing certificate:', err);
      setError(err.response?.data?.message || 'Failed to sign certificate. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy hh:mm a');
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PARTIAL': return 'info';
      case 'ALLSIGNED': return 'secondary';
      case 'COMPLETE': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getSignatureStatusChipColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SIGNED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const canSignForDepartment = (department: string) => {
    if (isAdmin) return true;
    if (isDepartmentAdmin && user && user.department === department) return true;
    if (isHOD && department === 'HOD') return true;
    return false;
  };

  const canSignAsPrincipal = () => {
    return isAdmin || isPrincipal;
  };

  const handleDownloadClick = () => {
    if (!certificate || loading) {
      setError('Certificate is not available for printing.');
      return;
    }
    reactToPrintFn();
  };

  // Helper function to render signatures
  const getSignatureImage = (dept: string) => {
    const signature = certificate?.departmentSignatures.find(
      s => s.department === dept && s.status === 'SIGNED' && s.esignature
    );
    return signature ? (
      <img 
        src={`data:image/png;base64,${signature.esignature}`}
        alt={`${dept} Signature`}
        style={{ maxWidth: '60px', maxHeight: '30px', objectFit: 'contain' }}
        onError={(e) => console.error(`${dept} signature failed to load`)}
      />
    ) : null;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!certificate) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 4 }}>No certificate found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ borderRadius: 2 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">No Dues Certificate</Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={fetchCertificate}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            {certificate.status === 'COMPLETE' ?
             (<Button 
              variant="contained" 
              color="primary"
              startIcon={<Download />}
              onClick={handleDownloadClick}
              disabled={loading || !certificate}
            >
              Download
            </Button>
             )
            : (<Button 
            variant="contained" 
            color="primary"
            startIcon={<Download />}
            onClick={handleDownloadClick}
            disabled
          >
            Download
          </Button>
            )
}

          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Certificate Details</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Certificate Number:</Typography>
                      <Typography variant="body1" gutterBottom>{certificate.certificateNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Status:</Typography>
                      <Chip 
                        label={certificate.status} 
                        color={getStatusChipColor(certificate.status)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Student Name:</Typography>
                      <Typography variant="body1" gutterBottom>{certificate.studentName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Enrollment:</Typography>
                      <Typography variant="body1" gutterBottom>{certificate.studentRollNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Created At:</Typography>
                      <Typography variant="body1" gutterBottom>{formatDate(certificate.createdAt)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Issue Date:</Typography>
                      <Typography variant="body1" gutterBottom>{certificate.issueDate ? formatDate(certificate.issueDate) : 'Not issued yet'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {isPrincipal ? (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Principal Signature</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {certificate.principalSigned ? (
                    <>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Signed by Principal
                      </Alert>
                      <Typography variant="body2" color="textSecondary">Signed By:</Typography>
                      <Typography variant="body1" gutterBottom>{certificate.principalSignedBy || 'Principal'}</Typography>
                      <Typography variant="body2" color="textSecondary">Signed At:</Typography>
                      <Typography variant="body1" gutterBottom>{formatDate(certificate.principalSignedAt)}</Typography>
                    </>
                  ) : (
                    <>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Awaiting Principal's signature
                      </Alert>
                      {canSignAsPrincipal() && (
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={handleSignByPrincipal}
                          disabled={signing || certificate.status !== 'ALLSGND' || certificate.principalSigned}
                          sx={{ mt: 2 }}
                        >
                          {signing ? <CircularProgress size={24} /> : 'Sign as Principal'}
                        </Button>
                      )}
                      {certificate.status !== 'ALLSGND' && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          All departments must sign before the Principal can sign.
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            ): 
            <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Pricipal Will sign the certificate when all the department sign it.</Typography>
              </CardContent>
            </Card>
            </Grid>
            }
          </Grid>
        </Box>

        <Typography variant="h6" gutterBottom>Department Signatures</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signed By</TableCell>
                <TableCell>Signed At</TableCell>
                <TableCell>Comments</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificate.departmentSignatures.map((signature) => (
                <TableRow key={signature.id}>
                  <TableCell>{signature.department}</TableCell>
                  <TableCell>
                    <Chip 
                      label={signature.status} 
                      color={getSignatureStatusChipColor(signature.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{signature.signedBy || '-'}</TableCell>
                  <TableCell>{signature.signedAt ? formatDate(signature.signedAt) : '-'}</TableCell>
                  <TableCell>{signature.comments || '-'}</TableCell>
                  <TableCell>
                    {signature.status === 'PENDING' && (
                      <>
                        {canSignForDepartment(signature.department) && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                              setSelectedDepartment(signature.department);
                              setOpenSignDialog(true);
                            }}
                          >
                            Sign
                          </Button>
                        )}
                        {isHOD && signature.department !== 'HOD' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleRequestSignature(signature.department)}
                            sx={{ ml: 1 }}
                          >
                            Request Signature
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          ref={contentRef}
          sx={{
            padding: 2,
            border: '4px solid #ccc',
          }}
        >
          <Box className="no-print" sx={{ position: 'absolute', top: 10, right: 10 }}>
            <Chip 
              label={certificate.status} 
              color={getStatusChipColor(certificate.status)}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              COLLEGE DUE MANAGEMENT SYSTEM
            </Typography>
            <Typography variant="subtitle1" align="center" gutterBottom>
              INSTITUTE OF ENGINEERING & SCIENCE
            </Typography>
            <Typography variant="body2" align="center">
              Knowledge Village, A.B. Road, 452012
            </Typography>
            <Typography variant="body2" align="center">
              Ph: 0731-4014604, E-mail: office@college.org, Visit us: college.org
            </Typography>
          </Box>

          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', textDecoration: 'underline', mb: 3 }}>
            NO DUES CERTIFICATE
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', fontWeight: 'bold' }}>Name of Student: </TableCell>
                  <TableCell colSpan={3}>{certificate.studentName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>Enrollment No.:</TableCell>
                  <TableCell>{certificate.studentRollNumber}</TableCell>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>Computer Code: </TableCell>
                  <TableCell>{certificate.computerCode || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>Department: </TableCell>
                  <TableCell>{certificate.branch}</TableCell>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>Semester / Year</TableCell>
                  <TableCell>{certificate.semester}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>E-mail: </TableCell>
                  <TableCell>{certificate.email}</TableCell>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>Mobile No.:</TableCell>
                  <TableCell>{certificate.mobileNumber || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body1" paragraph>
            This is to Certify that there is nothing due against above student:
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    Department
                  </TableCell>
                  <TableCell colSpan={3} align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    IES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell width="5%">1</TableCell>
                  <TableCell width="20%">Library</TableCell>
                  <TableCell width="20%" align="center">{getSignatureImage('LIBRARY')}</TableCell>
                  <TableCell width="5%">6</TableCell>
                  <TableCell width="20%">IES Library</TableCell>
                  <TableCell width="20%" align="center">{getSignatureImage('IES_LIBRARY')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2</TableCell>
                  <TableCell>Training & Placement</TableCell>
                  <TableCell align="center">{getSignatureImage('TRAINING_AND_PLACEMENT')}</TableCell>
                  <TableCell>7</TableCell>
                  <TableCell>Transport</TableCell>
                  <TableCell align="center">{getSignatureImage('TRANSPORT')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3</TableCell>
                  <TableCell>Sports</TableCell>
                  <TableCell align="center">{getSignatureImage('SPORTS')}</TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>Hostel</TableCell>
                  <TableCell align="center">{getSignatureImage('HOSTEL')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4</TableCell>
                  <TableCell>Office</TableCell>
                  <TableCell align="center">{getSignatureImage('OFFICE')}</TableCell>
                  <TableCell>9</TableCell>
                  <TableCell>Account Section</TableCell>
                  <TableCell align="center">{getSignatureImage('ACCOUNTS')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>5</TableCell>
                  <TableCell>HOD</TableCell>
                  <TableCell align="center">{getSignatureImage('HOD')}</TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>Student Section</TableCell>
                  <TableCell align="center">{getSignatureImage('STUDENT_SECTION')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4}}>
            <Box>
              <Typography variant="body2" color="textSecondary">Date: {format(new Date(), 'dd/MM/yyyy')}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Principal:</Typography>
              {certificate.principalSigned ? (
                <Box sx={{ mt: 1, mb: 1 }}>
                  {certificate.principalESignature ? (
                    <img 
                      src={`data:image/png;base64,${certificate.principalESignature}`}
                      alt="Principal E-Signature" 
                      style={{ maxWidth: '150px', maxHeight: '60px', objectFit: 'contain' }} 
                    />
                  ) : (
                    <Typography variant="body2" color="textSecondary">Manual Signature</Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ borderBottom: '1px solid #000', width: 150, mt: 1, mb: 1 }}></Box>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 5, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary" align="center">
              This is a computer-generated certificate and does not require a physical signature.
              This certificate is valid as of {format(new Date(), 'dd/MM/yyyy')}.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Dialog open={openSignDialog} onClose={() => setOpenSignDialog(false)}>
        <DialogTitle>Sign Certificate</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are signing for the {selectedDepartment} department.
          </Typography>

          {user && !user.eSignature && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3, mt: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => navigate('/profile')}
                >
                  Go to Profile
                </Button>
              }
            >
              You don't have an e-signature. Please upload one in your profile page.
            </Alert>
          )}

          <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" color="textSecondary" mb={1}>Signature Type:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant={useESign ? "contained" : "outlined"} 
                size="small"
                onClick={async () => {
                  setUseESign(true);
                  if (user && !user.eSignature) {
                    await fetchUserESignature();
                  }
                }}
              >
                E-Signature
              </Button>
              <Button 
                variant={!useESign ? "contained" : "outlined"} 
                size="small"
                onClick={() => setUseESign(false)}
              >
                Manual Signature
              </Button>
            </Box>
          </FormControl>

          <TextField
            margin="dense"
            label="Comments (Optional)"
            fullWidth
            multiline
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignDialog(false)}>Cancel</Button>
          <Button onClick={handleSignByDepartment} variant="contained" color="primary">
            Sign
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>


      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError('')} 
          severity="error" 
          sx={{ width: '100%' }}
          action={
            error && error.includes('signature') ? (
              <Button 
                color="inherit" 
                size="small"
                onClick={() => navigate("/profile")}
              >
                Go to Profile
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NoDuesCertificatePage;