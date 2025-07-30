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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await resetPassword(token, data.password);
      navigate('/login', { state: { message: 'Password has been reset successfully. You can now login with your new password.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
              Invalid Reset Link
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              The password reset link is invalid or has expired.
            </Alert>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                Request a new password reset link
              </Link>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

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
            Reset Password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="password"
              control={control}
              rules={{ 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              }}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="password"
                  label="New Password"
                  type="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...field}
                />
              )}
            />
            
            <Controller
              name="confirmPassword"
              control={control}
              rules={{ 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              }}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
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
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
