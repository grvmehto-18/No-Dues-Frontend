import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  isAdmin,
  isDepartmentAdmin,
  isHOD,
  isPrincipal,
} from "../../utils/auth";

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(open);
    navigate(-1);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", {
      state: {
        message: "You have been logged out successfully!",
        timeout: 5000,
      },
    });
    handleProfileMenuClose();
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handleProfileMenuClose();
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      visible: true,
    },
    {
      text: "Users",
      icon: <PersonIcon />,
      path: "/users",
      visible: isAdmin(),
    },
    {
      text: "Students",
      icon: <SchoolIcon />,
      path: "/students",
      visible: isAdmin() || isDepartmentAdmin() || isHOD() || isPrincipal(),
    },
    {
      text: "Dues",
      icon: <ReceiptIcon />,
      path: "/dues",
      visible: true,
    },
    {
      text: "Certificates",
      icon: <AssignmentIcon />,
      path: "/certificates",
      visible: true,
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { sm: `${open ? drawerWidth : 0}px` },
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: "none",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text ||
              "Dashboard"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton
                size="large"
                color="inherit"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}>
                <NotificationsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={user?.firstName + " " + user?.lastName}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  padding: 0.5,
                  border: `2px solid ${theme.palette.primary.main}`,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: "white",
                    width: 35,
                    height: 35,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: theme.shadows[3],
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{ py: 1.5, color: "error.main" }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: "background.paper",
          },
        }}>
        <Box sx={{ py: 3, px: 2.5 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main" }}>
            College Due
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Management System
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 2, py: 1.5 }}>
          {menuItems
            .filter((item) => item.visible)
            .map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.15
                        ),
                      },
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                    },
                  }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
