import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link as MuiLink,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { LoginRequest } from '../types';
import { Visibility, VisibilityOff, School as SchoolIcon } from '@mui/icons-material';

const Login: React.FC = () => {

  
  const theme = useTheme();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  //For logout message
  // const [logoutMessage, setLogoutMessage] = useState(location.state?.message);

 

  // Check for redirect messages in location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
    
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [location, user, navigate]);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      // Improved error handling with more specific messages
      if (err.response) {
        // Use the error message from the server if available
        setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
       // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={2}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
            background: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <SchoolIcon sx={{ fontSize: 30, color: 'primary.main' }} />
          </Box>

          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              textAlign: 'center',
              mb: 1
            }}
          >
            Welcome Back
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 4
            }}
          >
            Sign in to College Due Management System
          </Typography>
          {/* {logoutMessage && (
            <Fade in={!!logoutMessage}>

              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: 'error.main'
                  }
                }}
                onClose={() => setLogoutMessage(null)}
              >
                {logoutMessage}
              </Alert>
            </Fade>
          )}   */}
         
          

          {error && (
            <Fade in={!!error}>
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: 'error.main'
                  }
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Fade>
          )}
          
          {successMessage && (
            <Fade in={!!successMessage}>
              <Alert 
                severity="success" 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: 2
                }}
                onClose={() => setSuccessMessage(null)}
              >
                {successMessage}
              </Alert>
            </Fade>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Controller
              name="username"
              control={control}
              rules={{ 
                required: 'Username is required' 
              }}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  fullWidth
                  label="Username"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    }
                  }}
                  {...field}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{ 
                required: 'Password is required' 
              }}
              render={({ field }) => (
                <TextField
                  margin="normal"
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...field}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 'none',
                position: 'relative',
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              {loading ? (
                <>
                  <Box component="span" sx={{ visibility: 'hidden' }}>Sign In</Box>
                  <CircularProgress 
                    size={24} 
                    sx={{ 
                      position: 'absolute',
                      color: alpha(theme.palette.common.white, 0.85)
                    }} 
                  />
                </>
              ) : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <MuiLink
                component={Link}
                to="/forgot-password"
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Forgot password?
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;