import React, { useState } from 'react';
import { 
  Box, Typography, Button, Alert, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Paper
} from '@mui/material';
import { Receipt, CheckCircle } from '@mui/icons-material';
import { checkStudentDues } from '../services/dueService';
import api from '../services/api';
import StudentDuesStatus from './StudentDuesStatus';

interface NoDueCertificateRequestProps {
  studentId: number;
  studentName: string;
  onCertificateRequested?: () => void;
}

const NoDueCertificateRequest: React.FC<NoDueCertificateRequestProps> = ({
  studentId,
  studentName,
  onCertificateRequested
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [checkingDues, setCheckingDues] = useState<boolean>(false);
  const [hasPendingDues, setHasPendingDues] = useState<boolean>(false);

  const handleRequestCertificate = async () => {
    // First check if student has any pending dues
    setCheckingDues(true);
    setError(null);
    
    try {
      const { hasPendingDues } = await checkStudentDues(studentId);
      setHasPendingDues(hasPendingDues);
      
      if (hasPendingDues) {
        setError('Student has pending dues that need to be cleared first.');
        setOpenDialog(false);
        return;
      }
      
      // If no pending dues, proceed with certificate request
      setLoading(true);
      
      const response = await api.post(`/certificates/request/${studentId}`);
      
      setSuccess('No Due Certificate requested successfully!');
      setOpenDialog(false);
      
      if (onCertificateRequested) {
        onCertificateRequested();
      }
    } catch (err: any) {
      console.error('Error requesting certificate:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to request certificate. Please try again later.');
      }
    } finally {
      setCheckingDues(false);
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">No Due Certificate</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Receipt />}
            onClick={() => setOpenDialog(true)}
          >
            Request Certificate
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          A No Due Certificate confirms that {studentName} has cleared all dues across all departments.
          This certificate is required for various administrative processes.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mt: 2 }}
            icon={<CheckCircle />}
          >
            {success}
          </Alert>
        )}
      </Paper>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Request No Due Certificate</DialogTitle>
        <DialogContent>
          {checkingDues ? (
            <Box display="flex" alignItems="center" justifyContent="center" p={2}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2">Checking dues status...</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body1" paragraph>
                You are about to request a No Due Certificate for {studentName}.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                This certificate will need to be approved by all relevant departments.
              </Alert>
              
              <StudentDuesStatus 
                studentId={studentId}
                studentName={studentName}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRequestCertificate}
            variant="contained" 
            color="primary"
            disabled={loading || checkingDues || hasPendingDues}
          >
            {loading ? 'Requesting...' : 'Request Certificate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoDueCertificateRequest; 