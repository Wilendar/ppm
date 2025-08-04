import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Divider,
  SxProps,
  Theme,
} from '@mui/material';
import {
  CheckCircle as FoundIcon,
  Cancel as NotFoundIcon,
  Warning as PartialIcon,
  Search as SearchingIcon,
  TrendingUp as SuccessRateIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

interface SearchSummaryData {
  total: number;
  found: number;
  notFound: number;
  partialMatches: number;
  searching?: number;
  successRate: number;
  processingTime?: number;
}

interface SearchSummaryProps {
  summary: SearchSummaryData;
  isSearching?: boolean;
  sx?: SxProps<Theme>;
}

const SearchSummary: React.FC<SearchSummaryProps> = ({
  summary,
  isSearching = false,
  sx = {},
}) => {
  const {
    total,
    found,
    notFound,
    partialMatches,
    searching = 0,
    successRate,
    processingTime,
  } = summary;

  // Calculate progress for searching
  const searchProgress = total > 0 ? ((found + notFound + partialMatches) / total) * 100 : 0;

  // Status items configuration
  const statusItems = [
    {
      label: 'Found',
      value: found,
      icon: <FoundIcon sx={{ color: 'success.main' }} />,
      color: 'success.main' as const,
      bgColor: 'success.light' as const,
    },
    {
      label: 'Not Found',
      value: notFound,
      icon: <NotFoundIcon sx={{ color: 'error.main' }} />,
      color: 'error.main' as const,
      bgColor: 'error.light' as const,
    },
    {
      label: 'Partial Match',
      value: partialMatches,
      icon: <PartialIcon sx={{ color: 'warning.main' }} />,
      color: 'warning.main' as const,
      bgColor: 'warning.light' as const,
      show: partialMatches > 0,
    },
    {
      label: 'Searching',
      value: searching,
      icon: <SearchingIcon sx={{ color: 'info.main' }} />,
      color: 'info.main' as const,
      bgColor: 'info.light' as const,
      show: searching > 0,
    },
  ].filter(item => item.show !== false);

  return (
    <Card sx={{ ...sx }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.primary">
            Search Summary
          </Typography>
          
          {/* Success Rate Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SuccessRateIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Chip
              label={`${successRate}% Success Rate`}
              color={successRate >= 80 ? 'success' : successRate >= 50 ? 'warning' : 'error'}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        {/* Search Progress (when searching) */}
        {isSearching && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Search Progress
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="medium">
                {Math.round(searchProgress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={searchProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {found + notFound + partialMatches} of {total} SKUs processed
            </Typography>
          </Box>
        )}

        {/* Status Statistics Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Total SKUs */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'primary.light',
                border: 1,
                borderColor: 'primary.main',
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {total}
              </Typography>
              <Typography variant="body2" color="primary.dark">
                Total SKUs
              </Typography>
            </Box>
          </Grid>

          {/* Status Items */}
          {statusItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: item.bgColor,
                  border: 1,
                  borderColor: item.color,
                  textAlign: 'center',
                  opacity: item.value === 0 ? 0.5 : 1,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  {item.icon}
                </Box>
                <Typography variant="h5" color={item.color} fontWeight="bold">
                  {item.value}
                </Typography>
                <Typography variant="body2" color={item.color}>
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Additional Statistics */}
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Processing Time */}
          {processingTime !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary">
                Processing Time: <strong>{processingTime.toFixed(2)}s</strong>
              </Typography>
            </Box>
          )}

          {/* Search Status */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isSearching ? (
              <Chip
                label="Search in Progress..."
                color="info"
                variant="outlined"
                size="small"
                icon={<SearchingIcon />}
              />
            ) : (
              <Chip
                label="Search Complete"
                color="success"
                variant="outlined"
                size="small"
                icon={<FoundIcon />}
              />
            )}
          </Box>

          {/* Success Rate Details */}
          <Typography variant="body2" color="text.secondary">
            Success Rate: {found}/{total} ({successRate}%)
          </Typography>
        </Box>

        {/* Detailed Breakdown */}
        {(partialMatches > 0 || searching > 0) && (
          <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Detailed Breakdown:</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption">
                ✅ {found} exact matches
              </Typography>
              {partialMatches > 0 && (
                <Typography variant="caption">
                  ⚠️ {partialMatches} partial matches
                </Typography>
              )}
              <Typography variant="caption">
                ❌ {notFound} not found
              </Typography>
              {searching > 0 && (
                <Typography variant="caption">
                  🔍 {searching} still searching
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Performance Insights */}
        {!isSearching && total > 0 && (
          <Box sx={{ mt: 2 }}>
            {successRate === 100 && (
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16 }} />
                Perfect match rate! All SKUs were found successfully.
              </Typography>
            )}
            
            {successRate < 50 && (
              <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PartialIcon sx={{ fontSize: 16 }} />
                Low success rate. Consider checking SKU formats or database synchronization.
              </Typography>
            )}
            
            {partialMatches > found && (
              <Typography variant="body2" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchingIcon sx={{ fontSize: 16 }} />
                More partial matches than exact matches. Review search criteria.
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchSummary;