import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ImageNotSupported as NoImageIcon,
} from '@mui/icons-material';

interface ProductThumbnailProps {
  src?: string;
  alt?: string;
  productName: string;
  size?: number;
  showZoom?: boolean;
  onClick?: () => void;
}

const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  src,
  alt,
  productName,
  size = 48,
  showZoom = true,
  onClick,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  const handleThumbnailClick = () => {
    if (onClick) {
      onClick();
    } else if (showZoom && src && !error) {
      setPreviewOpen(true);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const thumbnailContent = () => {
    if (loading) {
      return <Skeleton variant="circular" width={size} height={size} />;
    }

    if (error || !src) {
      return (
        <Avatar
          sx={{
            width: size,
            height: size,
            bgcolor: 'grey.300',
            color: 'grey.600',
            fontSize: size * 0.3,
            fontWeight: 'bold',
          }}
        >
          {src ? <NoImageIcon /> : getInitials(productName)}
        </Avatar>
      );
    }

    return (
      <Avatar
        src={src}
        alt={alt || `${productName} thumbnail`}
        sx={{
          width: size,
          height: size,
          cursor: showZoom || onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: showZoom || onClick ? 'scale(1.05)' : 'none',
          },
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  };

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <Tooltip title={showZoom ? 'Click to preview' : productName}>
          <Box onClick={handleThumbnailClick}>
            {thumbnailContent()}
          </Box>
        </Tooltip>

        {/* Zoom indicator */}
        {showZoom && src && !error && !loading && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              bgcolor: 'primary.main',
              borderRadius: '50%',
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}
          >
            <ZoomInIcon sx={{ fontSize: 10, color: 'white' }} />
          </Box>
        )}
      </Box>

      {/* Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {productName}
          <IconButton onClick={() => setPreviewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        >
          <img
            src={src}
            alt={alt || `${productName} preview`}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductThumbnail;