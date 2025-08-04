import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const MockData: React.FC = () => {
  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity="info" 
        icon={<WarningIcon />}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => window.open('http://localhost:3003/api/v1/auth/urls', '_blank')}
          >
            Setup Auth
          </Button>
        }
      >
        <Typography variant="subtitle2" gutterBottom>
          🔐 Authentication Required
        </Typography>
        <Typography variant="body2">
          All API endpoints require authentication. This demo shows the UI components with mock data.
          <br />
          <strong>Next Steps:</strong> Setup OAuth authentication (ETAP 1.3 completed, but requires client configuration)
        </Typography>
      </Alert>
    </Box>
  );
};

export default MockData;