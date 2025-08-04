import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
  useTheme,
  useMediaQuery,
  Switch,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  Store as ShopsIcon,
  Category as CategoriesIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

interface AppLayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onThemeToggle: () => void;
}

interface NavigationItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  disabled?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    label: 'Products',
    icon: <ProductsIcon />,
    path: '/products',
  },
  {
    label: 'Shops',
    icon: <ShopsIcon />,
    path: '/shops',
    disabled: true, // Will be enabled in ETAP 2.2
  },
  {
    label: 'Categories',
    icon: <CategoriesIcon />,
    path: '/categories',
    disabled: true, // Will be enabled in ETAP 2.3
  },
  {
    label: 'Analytics',
    icon: <AnalyticsIcon />,
    path: '/analytics',
    disabled: true, // Will be enabled in ETAP 5.2
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    disabled: true, // Will be enabled later
  },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children, darkMode, onThemeToggle }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand Area */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          PPM
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Product Manager
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              disabled={item.disabled}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '15',
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: item.disabled ? 'text.disabled' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Theme Toggle at Bottom */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightModeIcon fontSize="small" />
          <Switch
            checked={darkMode}
            onChange={onThemeToggle}
            size="small"
          />
          <DarkModeIcon fontSize="small" />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Dark Mode
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: darkMode ? 'background.paper' : 'primary.main',
          color: darkMode ? 'text.primary' : 'primary.contrastText',
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : undefined,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Prestashop Product Manager
          </Typography>

          {/* Theme toggle in header for desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <LightModeIcon fontSize="small" />
            <Switch
              checked={darkMode}
              onChange={onThemeToggle}
              size="small"
            />
            <DarkModeIcon fontSize="small" />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          paddingTop: '64px', // AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;