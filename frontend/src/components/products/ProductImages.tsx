import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { DetailedProductImage } from '../../types/api.types';

interface ProductImagesProps {
  images: DetailedProductImage[];
  onImageSelect?: (image: DetailedProductImage) => void;
  onImageUpload?: (files: FileList) => void;
  onImageDelete?: (imageId: number) => void;
  onImageReorder?: (images: DetailedProductImage[]) => void;
  onSetMainImage?: (imageId: number) => void;
  readOnly?: boolean;
}

const ProductImages: React.FC<ProductImagesProps> = ({
  images = [],
  onImageSelect,
  onImageUpload,
  onImageDelete,
  onImageReorder,
  onSetMainImage,
  readOnly = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<DetailedProductImage | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main image (first image or marked as main)
  const mainImage = images.find(img => img.is_main) || images[0];
  
  // Thumbnail images (all except main)
  const thumbnailImages = images.filter(img => img.id !== mainImage?.id);

  const handleImageClick = (image: DetailedProductImage) => {
    setSelectedImage(image);
    setGalleryOpen(true);
    onImageSelect?.(image);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      onImageUpload?.(files);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Simulate upload completion
      setTimeout(() => setIsUploading(false), 2000);
    }
  };

  const handleDragStart = (index: number) => (event: React.DragEvent) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (dropIndex: number) => (event: React.DragEvent) => {
    event.preventDefault();
    if (draggedIndex === null) return;

    const reorderedImages = [...images];
    const draggedImage = reorderedImages[draggedIndex];
    reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);

    onImageReorder?.(reorderedImages);
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Image Gallery Modal
  const ImageGalleryModal = () => (
    <Dialog
      open={galleryOpen}
      onClose={() => setGalleryOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogContent sx={{ p: 2, textAlign: 'center' }}>
        {selectedImage && (
          <Box>
            <img
              src={selectedImage.url}
              alt={selectedImage.alt_text || selectedImage.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="h6">{selectedImage.filename}</Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {formatFileSize(selectedImage.file_size)} • 
                Type: {selectedImage.mime_type}
              </Typography>
              {selectedImage.alt_text && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Alt Text: {selectedImage.alt_text}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setGalleryOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Main Image Display */}
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          height: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'grey.50',
          cursor: mainImage ? 'pointer' : 'default',
          '&:hover': mainImage ? {
            '& .zoom-overlay': {
              opacity: 1,
            }
          } : {},
        }}
        onClick={() => mainImage && handleImageClick(mainImage)}
      >
        {mainImage ? (
          <>
            <img
              src={mainImage.url}
              alt={mainImage.alt_text || mainImage.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
            <Box
              className="zoom-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            >
              <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
            {mainImage.is_main && (
              <Chip
                label="Main"
                color="primary"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                }}
              />
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <ImageIcon sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="body2">
              No main image
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Thumbnail Gallery */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {thumbnailImages.map((image, index) => (
            <Paper
              key={image.id}
              elevation={1}
              sx={{
                width: 60,
                height: 60,
                flexShrink: 0,
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s',
                },
              }}
              onClick={() => handleImageClick(image)}
              draggable={!readOnly}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
            >
              <img
                src={image.thumbnail_url}
                alt={image.alt_text || image.filename}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {!readOnly && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <Tooltip title="Set as main image">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetMainImage?.(image.id);
                      }}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                      }}
                    >
                      {image.is_main ? (
                        <StarIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      ) : (
                        <StarBorderIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {!readOnly && (
                <DragIcon
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    left: 2,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                />
              )}
            </Paper>
          ))}
          
          {/* Add New Image Button */}
          {!readOnly && (
            <Paper
              elevation={1}
              sx={{
                width: 60,
                height: 60,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: 'grey.100',
                border: '2px dashed',
                borderColor: 'grey.300',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <CircularProgress size={20} />
              ) : (
                <AddIcon sx={{ color: 'grey.600' }} />
              )}
            </Paper>
          )}
        </Box>
      </Box>

      {/* Upload Section */}
      {!readOnly && (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            fullWidth
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Add Images'}
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Supported formats: JPG, PNG, WebP • Max size: 5MB per image
          </Typography>
        </Box>
      )}

      {/* No Images State */}
      {images.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No images uploaded for this product yet.
          {!readOnly && ' Click "Add Images" to upload.'}
        </Alert>
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal />
    </Box>
  );
};

export default ProductImages;