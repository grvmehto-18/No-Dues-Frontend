import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Departments: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Departments
        </Typography>
        <Typography variant="body1">
          Department management functionality will be implemented here.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Departments; 