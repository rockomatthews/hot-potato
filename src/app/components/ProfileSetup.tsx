'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useUser } from '@/app/contexts/UserContext';

interface ProfileSetupProps {
  open: boolean;
  onClose?: () => void;
  onComplete?: () => void;
}

// Predefined avatar options
const AVATAR_OPTIONS = [
  '🔥', '🥔', '🎮', '🎯', '💎', '⚡', '🚀', '🌟',
  '🎪', '🎭', '🎨', '🎵', '🎺', '🎸', '🎯', '🎲',
  '🔮', '👑', '🎊', '🎉', '🎈', '🍕', '🍔', '🍟',
  '🦄', '🐉', '🦋', '🐝', '🦅', '🦊', '🐺', '🦁',
];

export default function ProfileSetup({ open, onClose, onComplete }: ProfileSetupProps) {
  const { createProfile, checkUsernameAvailable, loading, error } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    profile_picture_url: '🔥',
  });
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
  }>({
    checking: false,
    available: null,
    error: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Debounced username check
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus({ checking: false, available: null, error: null });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, error: null });
      
      try {
        const result = await checkUsernameAvailable(formData.username);
        setUsernameStatus({
          checking: false,
          available: result.available,
          error: result.error || null,
        });
             } catch (err) {
         console.error('Error checking username:', err);
         setUsernameStatus({
           checking: false,
           available: false,
           error: 'Failed to check username',
         });
       }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, checkUsernameAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.username) {
      setFormError('Username is required');
      return;
    }

    if (!usernameStatus.available) {
      setFormError('Please choose an available username');
      return;
    }

    try {
      await createProfile({
        username: formData.username,
        profile_picture_url: formData.profile_picture_url,
      });
      
      onComplete?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setFormData(prev => ({ ...prev, username: value }));
    setFormError(null);
  };

  const getUsernameHelperText = () => {
    if (usernameStatus.checking) return 'Checking availability...';
    if (usernameStatus.error) return usernameStatus.error;
    if (usernameStatus.available === true) return 'Username is available!';
    if (usernameStatus.available === false) return 'Username is taken';
    return 'Choose a unique username (3-20 characters, letters, numbers, _ and - only)';
  };

  const getUsernameColor = (): 'error' | 'success' | 'primary' => {
    if (usernameStatus.error || usernameStatus.available === false) return 'error';
    if (usernameStatus.available === true) return 'success';
    return 'primary';
  };

  const getEndAdornment = () => {
    if (usernameStatus.checking) return <CircularProgress size={20} />;
    if (usernameStatus.available === true) return <CheckCircle color="success" />;
    if (usernameStatus.available === false) return <Cancel color="error" />;
    return null;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 140, 66, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="h2" textAlign="center" sx={{ fontWeight: 'bold' }}>
          🔥 Welcome to Hot Potato! 🥔
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>
          Create your profile to get started
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Avatar Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Choose Your Avatar
              </Typography>
              <Grid container spacing={1}>
                {AVATAR_OPTIONS.map((emoji) => (
                  <Grid item key={emoji}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        fontSize: '24px',
                        cursor: 'pointer',
                        border: formData.profile_picture_url === emoji ? 3 : 1,
                        borderColor: formData.profile_picture_url === emoji ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, profile_picture_url: emoji }))}
                    >
                      {emoji}
                    </Avatar>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Username Input */}
            <Box>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleUsernameChange}
                color={getUsernameColor()}
                helperText={getUsernameHelperText()}
                InputProps={{
                  endAdornment: getEndAdornment(),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Error Display */}
            {(formError || error) && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {formError || error}
              </Alert>
            )}

            {/* Preview */}
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar sx={{ width: 40, height: 40, fontSize: '20px' }}>
                {formData.profile_picture_url}
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Preview:
                </Typography>
                <Typography variant="h6">
                  {formData.username || 'Your Username'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !formData.username || !usernameStatus.available}
            sx={{
              borderRadius: 3,
              height: 48,
              background: 'linear-gradient(45deg, #FF6B35 30%, #FF8C42 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF8C42 30%, #FFB366 90%)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Profile'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 