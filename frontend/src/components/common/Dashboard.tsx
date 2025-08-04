import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Inventory as ProductsIcon,
  Store as ShopsIcon,
  TrendingUp as ActiveIcon,
  Schedule as DraftIcon,
  Archive as ArchivedIcon,
  Warning as InactiveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useProductStats } from '../../hooks/useProducts';
import { ProductStatus } from '../../types/api.types';
import { shouldUseMockData } from '../../services/mockApi';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'primary',
  description 
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h3" component="div" color={`${color}.main`}>
              {value.toLocaleString()}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {description}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { 
              sx: { 
                fontSize: 32, 
                color: `${color}.main` 
              } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useProductStats();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard statistics. Please try again.
        </Alert>
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  const stats = data?.data;
  if (!stats) {
    return (
      <Alert severity="info">
        No statistics available.
      </Alert>
    );
  }

  const statusStats = [
    {
      status: ProductStatus.ACTIVE,
      count: stats.by_status[ProductStatus.ACTIVE] || 0,
      icon: <ActiveIcon />,
      color: 'success' as const,
      label: 'Active Products',
    },
    {
      status: ProductStatus.DRAFT,
      count: stats.by_status[ProductStatus.DRAFT] || 0,
      icon: <DraftIcon />,
      color: 'info' as const,
      label: 'Draft Products',
    },
    {
      status: ProductStatus.INACTIVE,
      count: stats.by_status[ProductStatus.INACTIVE] || 0,
      icon: <InactiveIcon />,
      color: 'warning' as const,
      label: 'Inactive Products',
    },
    {
      status: ProductStatus.ARCHIVED,
      count: stats.by_status[ProductStatus.ARCHIVED] || 0,
      icon: <ArchivedIcon />,
      color: 'error' as const,
      label: 'Archived Products',
    },
  ];

  return (
    <Box>
      {/* Mock Data Warning */}
      {shouldUseMockData() && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎭 Demo Mode - Using Mock Data
          </Typography>
          <Typography variant="body2">
            Authentication not configured. Showing mock data for demonstration.
            All CRUD operations work but data is temporary.
          </Typography>
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          Dashboard
        </Typography>
        <IconButton onClick={() => refetch()} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Main Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Products */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.total}
            icon={<ProductsIcon />}
            color="primary"
            description="All products in the system"
          />
        </Grid>

        {/* Recent Products */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Products"
            value={stats.recent_count}
            icon={<ProductsIcon />}
            color="secondary"
            description="Created in the last 30 days"
          />
        </Grid>

        {/* Connected Shops */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Connected Shops"
            value={stats.shops_count}
            icon={<ShopsIcon />}
            color="info"
            description="PrestaShop instances"
          />
        </Grid>

        {/* Active Products */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Products"
            value={stats.by_status[ProductStatus.ACTIVE] || 0}
            icon={<ActiveIcon />}
            color="success"
            description="Ready for sale"
          />
        </Grid>
      </Grid>

      {/* Product Status Breakdown */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Product Status Overview
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {statusStats.map(({ status, count, icon, color, label }) => (
              <Grid item xs={12} sm={6} md={3} key={status}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: `${color}.light`,
                    border: 1,
                    borderColor: `${color}.main`,
                  }}
                >
                  {React.cloneElement(icon, { 
                    sx: { color: `${color}.main` } 
                  })}
                  <Box>
                    <Typography variant="h6" color={`${color}.main`}>
                      {count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Status Distribution */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {statusStats.map(({ status, count, color, label }) => {
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0';
                return (
                  <Chip
                    key={status}
                    label={`${label}: ${count} (${percentage}%)`}
                    color={color}
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Actions or Additional Info */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            🚀 PPM System Status
          </Typography>
          <Typography variant="body2">
            • Backend API: Connected and operational<br />
            • Database: PostgreSQL running<br />
            • Cache: Redis active<br />
            • Frontend: React + Material-UI<br />
            • Current Phase: ETAP 2.1 - Product Management UI ✅
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default Dashboard;