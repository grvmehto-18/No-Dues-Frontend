import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Forgot Password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset instructions have been sent to your email.
            </Alert>
          )}
          
          {!success && (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              
              <Controller
                name="email"
                control={control}
                rules={{ 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    autoFocus
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    {...field}
                  />
                )}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Back to Login
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
