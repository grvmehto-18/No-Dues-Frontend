import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Stack,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface DashboardStats {
  totalStudents: number;
  totalUsers: number;
  totalDepartments: number;
  totalDues: number;
  recentActivities: Activity[];
  departmentStats: DepartmentStat[];
}

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

interface DepartmentStat {
  department: string;
  studentCount: number;
  dueAmount: number;
  completionRate: number;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  trend?: number;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalUsers: 0,
    totalDepartments: 0,
    totalDues: 0,
    recentActivities: [],
    departmentStats: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/stats');
      const data = response.data;

      // Log activities to check for duplicates
      console.log('Recent Activities:', data.recentActivities);
      const activityIds = data.recentActivities.map((activity: Activity) => activity.id);
      const duplicates = activityIds.filter((id: number, index: number) => activityIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        console.warn('Duplicate activity IDs detected:', duplicates);
      }

      setStats(data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            borderRadius: 3,
          }}
        >
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={fetchDashboardData}
            startIcon={<RefreshIcon />}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  const StatCard = ({ icon: Icon, title, value, trend, color }: StatCardProps) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        }
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(theme.palette[color].main, 0.1),
          }}>
            <Icon sx={{ color: theme.palette[color].main }} />
          </Box>
          {trend && (
            <Chip
              icon={trend > 0 ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              label={`${Math.abs(trend)}%`}
              size="small"
              color={trend > 0 ? 'success' : 'error'}
              sx={{ height: 24 }}
            />
          )}
        </Box>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
            {value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const DepartmentCard = ({ data }: { data: DepartmentStat }) => (
    <Card
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 4,
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {data.department}
          </Typography>
          <Chip
            label={`${data.completionRate}%`}
            size="small"
            color={data.completionRate >= 90 ? 'success' : data.completionRate >= 75 ? 'warning' : 'error'}
          />
        </Box>
        <Stack spacing={1}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Students
            </Typography>
            <Typography variant="h6">
              {data.studentCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Due Amount
            </Typography>
            <Typography variant="h6">
              ₹{data.dueAmount.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Completion Rate
            </Typography>
            <LinearProgress
              variant="determinate"
              value={data.completionRate}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                }
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderRadius: 3,
          }}
        >
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4
          }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {user?.firstName}! Here's what's happening.
              </Typography>
            </Box>
            <IconButton
              onClick={fetchDashboardData}
              disabled={loading}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={PeopleIcon}
                title="Total Students"
                value={stats.totalStudents}
                trend={12}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={SchoolIcon}
                title="Total Users"
                value={stats.totalUsers}
                trend={5}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={AccountBalanceIcon}
                title="Departments"
                value={stats.totalDepartments}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={TrendingUpIcon}
                title="Active Dues"
                value={stats.totalDues}
                trend={-8}
                color="error"
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Department Statistics
            </Typography>
            <Grid container spacing={3}>
              {stats.departmentStats.map((dept) => (
                <Grid item xs={12} sm={6} key={dept.department}>
                  <DepartmentCard data={dept} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Activities
            </Typography>
            <Stack spacing={2}>
              {stats.recentActivities.map((activity, index) => (
                <Box
                  key={`${activity.id}-${activity.type}-${index}`} // Composite key with type and index
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(activity.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;