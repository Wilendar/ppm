import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Chip,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { CategorySelection } from '../../types/api.types';

interface CategorySelectorProps {
  selectedCategories: CategorySelection[];
  onCategoryChange: (categories: CategorySelection[]) => void;
  readOnly?: boolean;
}

// Mock category data - w rzeczywistości z API
const mockCategoryTree = [
  {
    id: '1',
    name: 'Electronics',
    level: 0,
    children: [
      {
        id: '2',
        name: 'Audio Devices',
        level: 1,
        children: [
          { id: '3', name: 'Headphones', level: 2, children: [] },
          { id: '4', name: 'Speakers', level: 2, children: [] },
          { id: '5', name: 'Microphones', level: 2, children: [] },
        ],
      },
      {
        id: '6',
        name: 'Computers',
        level: 1,
        children: [
          { id: '7', name: 'Laptops', level: 2, children: [] },
          { id: '8', name: 'Desktops', level: 2, children: [] },
        ],
      },
    ],
  },
  {
    id: '9',
    name: 'Clothing',
    level: 0,
    children: [
      {
        id: '10',
        name: 'Men',
        level: 1,
        children: [
          { id: '11', name: 'Shirts', level: 2, children: [] },
          { id: '12', name: 'Pants', level: 2, children: [] },
        ],
      },
      {
        id: '13',
        name: 'Women',
        level: 1,
        children: [
          { id: '14', name: 'Dresses', level: 2, children: [] },
          { id: '15', name: 'Blouses', level: 2, children: [] },
        ],
      },
    ],
  },
];

interface CategoryNode {
  id: string;
  name: string;
  level: number;
  children: CategoryNode[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories = [],
  onCategoryChange,
  readOnly = false,
}) => {
  const [level1Categories, setLevel1Categories] = useState<CategoryNode[]>([]);
  const [level2Categories, setLevel2Categories] = useState<CategoryNode[]>([]);
  const [level3Categories, setLevel3Categories] = useState<CategoryNode[]>([]);
  
  const [selectedLevel1, setSelectedLevel1] = useState<string>('');
  const [selectedLevel2, setSelectedLevel2] = useState<string>('');
  const [selectedLevel3, setSelectedLevel3] = useState<string>('');
  
  const [treeViewOpen, setTreeViewOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize categories on component mount
  useEffect(() => {
    setLevel1Categories(mockCategoryTree);
    
    // Set initial selections if categories are provided
    if (selectedCategories.length > 0) {
      const mainCategory = selectedCategories[0];
      const pathIds = mainCategory.path.map(node => node.id);
      
      if (pathIds.length > 0) setSelectedLevel1(pathIds[0]);
      if (pathIds.length > 1) setSelectedLevel2(pathIds[1]);
      if (pathIds.length > 2) setSelectedLevel3(pathIds[2]);
    }
  }, [selectedCategories]);

  // Update level 2 categories when level 1 changes
  useEffect(() => {
    if (selectedLevel1) {
      const parentCategory = level1Categories.find(cat => cat.id === selectedLevel1);
      setLevel2Categories(parentCategory?.children || []);
      setSelectedLevel2('');
      setSelectedLevel3('');
      setLevel3Categories([]);
    }
  }, [selectedLevel1, level1Categories]);

  // Update level 3 categories when level 2 changes
  useEffect(() => {
    if (selectedLevel2) {
      const parentCategory = level2Categories.find(cat => cat.id === selectedLevel2);
      setLevel3Categories(parentCategory?.children || []);
      setSelectedLevel3('');
    }
  }, [selectedLevel2, level2Categories]);

  // Update selected categories when selections change
  useEffect(() => {
    const buildCategorySelection = (): CategorySelection[] => {
      if (!selectedLevel1) return [];

      const level1Cat = level1Categories.find(cat => cat.id === selectedLevel1);
      if (!level1Cat) return [];

      const path = [{ id: selectedLevel1, name: level1Cat.name, level: 0 }];
      const breadcrumbParts = [level1Cat.name];

      if (selectedLevel2) {
        const level2Cat = level2Categories.find(cat => cat.id === selectedLevel2);
        if (level2Cat) {
          path.push({ id: selectedLevel2, name: level2Cat.name, level: 1 });
          breadcrumbParts.push(level2Cat.name);
        }
      }

      if (selectedLevel3) {
        const level3Cat = level3Categories.find(cat => cat.id === selectedLevel3);
        if (level3Cat) {
          path.push({ id: selectedLevel3, name: level3Cat.name, level: 2 });
          breadcrumbParts.push(level3Cat.name);
        }
      }

      const finalCategory = selectedLevel3 || selectedLevel2 || selectedLevel1;
      const finalCategoryName = breadcrumbParts[breadcrumbParts.length - 1];

      return [{
        level: path.length - 1,
        categoryId: finalCategory,
        categoryName: finalCategoryName,
        path,
        breadcrumb: breadcrumbParts.join(' > '),
      }];
    };

    const newCategories = buildCategorySelection();
    onCategoryChange(newCategories);
  }, [selectedLevel1, selectedLevel2, selectedLevel3, level1Categories, level2Categories, level3Categories, onCategoryChange]);

  // Get category name by ID
  const getCategoryName = (id: string): string => {
    const findInTree = (nodes: CategoryNode[]): string => {
      for (const node of nodes) {
        if (node.id === id) return node.name;
        const found = findInTree(node.children);
        if (found) return found;
      }
      return '';
    };
    
    return findInTree(mockCategoryTree);
  };

  // Filter categories based on search term
  const filterCategories = (categories: CategoryNode[], term: string): CategoryNode[] => {
    if (!term) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Tree view renderer using List components
  const renderTreeItem = (node: CategoryNode, depth = 0) => (
    <React.Fragment key={node.id}>
      <ListItem disablePadding>
        <ListItemButton
          sx={{ pl: 2 + depth * 2 }}
          onClick={() => {
            // Toggle expansion for nodes with children
            if (node.children.length > 0) {
              setExpandedNodes(prev => 
                prev.includes(node.id) 
                  ? prev.filter(id => id !== node.id)
                  : [...prev, node.id]
              );
            }
            
            // Auto-select category path when clicking on tree item
            if (node.level === 0) {
              setSelectedLevel1(node.id);
            } else if (node.level === 1) {
              // Find parent level 1
              const parent1 = mockCategoryTree.find(cat => 
                cat.children.some(child => child.id === node.id)
              );
              if (parent1) {
                setSelectedLevel1(parent1.id);
                setSelectedLevel2(node.id);
              }
            } else if (node.level === 2) {
              // Find parent levels
              for (const cat1 of mockCategoryTree) {
                for (const cat2 of cat1.children) {
                  if (cat2.children.some(child => child.id === node.id)) {
                    setSelectedLevel1(cat1.id);
                    setSelectedLevel2(cat2.id);
                    setSelectedLevel3(node.id);
                    return;
                  }
                }
              }
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            {node.children.length > 0 ? (
              expandedNodes.includes(node.id) ? <ExpandMoreIcon /> : <ChevronRightIcon />
            ) : null}
            {node.children.length > 0 ? (
              expandedNodes.includes(node.id) ? <FolderOpenIcon /> : <FolderIcon />
            ) : null}
            <Typography variant="body2">{node.name}</Typography>
            <Chip label={`Level ${node.level + 1}`} size="small" variant="outlined" />
          </Box>
        </ListItemButton>
      </ListItem>
      
      {node.children.length > 0 && (
        <Collapse in={expandedNodes.includes(node.id)} timeout="auto" unmountOnExit>
          {node.children.map(child => renderTreeItem(child, depth + 1))}
        </Collapse>
      )}
    </React.Fragment>
  );

  // Tree View Dialog
  const TreeViewDialog = () => (
    <Dialog
      open={treeViewOpen}
      onClose={() => setTreeViewOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Select Category from Tree
        <TextField
          placeholder="Search categories..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ ml: 2, width: 200 }}
        />
      </DialogTitle>
      <DialogContent>
        <List sx={{ flexGrow: 1, maxWidth: 400, overflowY: 'auto', maxHeight: 400 }}>
          {filterCategories(mockCategoryTree, searchTerm).map(node => renderTreeItem(node))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTreeViewOpen(false)}>Cancel</Button>
        <Button 
          onClick={() => setTreeViewOpen(false)} 
          variant="contained"
          disabled={!selectedLevel1}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Cascading Dropdowns */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Level 1 - Main Categories */}
        <FormControl fullWidth disabled={readOnly}>
          <InputLabel>Main Category</InputLabel>
          <Select
            value={selectedLevel1}
            onChange={(e) => setSelectedLevel1(e.target.value)}
            label="Main Category"
          >
            <MenuItem value="">
              <em>Select main category</em>
            </MenuItem>
            {level1Categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Level 2 - Subcategories */}
        {level2Categories.length > 0 && (
          <FormControl fullWidth disabled={readOnly}>
            <InputLabel>Subcategory</InputLabel>
            <Select
              value={selectedLevel2}
              onChange={(e) => setSelectedLevel2(e.target.value)}
              label="Subcategory"
            >
              <MenuItem value="">
                <em>Select subcategory</em>
              </MenuItem>
              {level2Categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Level 3 - Sub-subcategories */}
        {level3Categories.length > 0 && (
          <FormControl fullWidth disabled={readOnly}>
            <InputLabel>Sub-subcategory</InputLabel>
            <Select
              value={selectedLevel3}
              onChange={(e) => setSelectedLevel3(e.target.value)}
              label="Sub-subcategory"
            >
              <MenuItem value="">
                <em>Select sub-subcategory</em>
              </MenuItem>
              {level3Categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Selected Path Preview */}
      {selectedCategories.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Selected Category Path:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {selectedCategories[0].breadcrumb}
          </Typography>
        </Paper>
      )}

      {/* Alternative Tree View Button */}
      {!readOnly && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => setTreeViewOpen(true)}
            size="small"
          >
            Browse Tree View
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add new category')}
            size="small"
          >
            Add Category
          </Button>
        </Box>
      )}

      {/* Tree View Dialog */}
      <TreeViewDialog />

      {/* No Category Selected State */}
      {selectedCategories.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select a category for this product. Categories help organize products and improve searchability.
        </Alert>
      )}
    </Box>
  );
};

export default CategorySelector;