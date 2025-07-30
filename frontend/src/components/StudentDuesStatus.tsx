import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Chip, CircularProgress, Alert, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button
} from '@mui/material';
import { CheckCircle, Warning, Receipt } from '@mui/icons-material';
import { checkStudentDues } from '../services/dueService';
import { Due } from '../types';
import { format } from 'date-fns';

interface StudentDuesStatusProps {
  studentId: number;
  studentName?: string;
  onPayDue?: (due: Due) => void;
}

const StudentDuesStatus: React.FC<StudentDuesStatusProps> = ({ 
  studentId, 
  studentName,
  onPayDue
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingDues, setHasPendingDues] = useState<boolean>(false);
  const [pendingDues, setPendingDues] = useState<Due[]>([]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDuesStatus();
    }
  }, [studentId]);

  const fetchStudentDuesStatus = async () => {
    try {
      setLoading(true);
      const { hasPendingDues, pendingDues } = await checkStudentDues(studentId);
      setHasPendingDues(hasPendingDues);
      setPendingDues(pendingDues);
      setError(null);
    } catch (err) {
      console.error('Error fetching student dues status:', err);
      setError('Failed to fetch dues status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={2}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Checking dues status...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        {hasPendingDues ? (
          <Chip 
            icon={<Warning />} 
            label="Pending Dues" 
            color="warning" 
            variant="outlined"
            sx={{ mr: 2 }}
          />
        ) : (
          <Chip 
            icon={<CheckCircle />} 
            label="No Pending Dues" 
            color="success" 
            variant="outlined"
            sx={{ mr: 2 }}
          />
        )}
        <Typography variant="body1">
          {studentName ? `${studentName}'s` : 'Student'} Dues Status
        </Typography>
      </Box>

      {hasPendingDues ? (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This student has {pendingDues.length} pending due{pendingDues.length > 1 ? 's' : ''} that need to be cleared.
          </Alert>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><b>Department</b></TableCell>
                  <TableCell><b>Description</b></TableCell>
                  <TableCell align="right"><b>Amount</b></TableCell>
                  <TableCell><b>Due Date</b></TableCell>
                  <TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingDues.map((due) => (
                  <TableRow key={due.id}>
                    <TableCell>{due.department}</TableCell>
                    <TableCell>{due.description}</TableCell>
                    <TableCell align="right">{formatCurrency(due.amount)}</TableCell>
                    <TableCell>{formatDate(due.dueDate)}</TableCell>
                    <TableCell>
                      {onPayDue && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => onPayDue(due)}
                        >
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          This student has no pending dues. They are eligible for a No Dues Certificate.
        </Alert>
      )}

      <Button
        variant="outlined"
        startIcon={<Receipt />}
        onClick={fetchStudentDuesStatus}
        size="small"
      >
        Refresh Status
      </Button>
    </Box>
  );
};

export default StudentDuesStatus; 