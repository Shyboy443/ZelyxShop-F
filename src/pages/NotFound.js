import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);

const NotFound = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '60vh',
          justifyContent: 'center'
        }}
      >
        {/* 404 Animation */}
        <MotionBox
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          sx={{ mb: 4 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '8rem', md: '12rem' },
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.1)',
              lineHeight: 1
            }}
          >
            404
          </Typography>
        </MotionBox>

        {/* Error Message */}
        <MotionTypography
          variant="h3"
          component="h1"
          gutterBottom
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2rem', md: '3rem' },
            mb: 2
          }}
        >
          Page Not Found
        </MotionTypography>

        <MotionTypography
          variant="h6"
          color="text.secondary"
          gutterBottom
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          sx={{
            mb: 4,
            maxWidth: 600,
            fontSize: { xs: '1rem', md: '1.25rem' }
          }}
        >
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </MotionTypography>

        {/* Illustration */}
        <MotionBox
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          sx={{ mb: 6 }}
        >
          <Box
            sx={{
              width: { xs: 200, md: 300 },
              height: { xs: 150, md: 200 },
              background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}20)`,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <SearchIcon
              sx={{
                fontSize: { xs: 60, md: 80 },
                color: 'text.secondary',
                opacity: 0.5
              }}
            />
            
            {/* Floating elements */}
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: theme.palette.primary.main,
                opacity: 0.3,
                animation: 'float 3s ease-in-out infinite'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 30,
                left: 30,
                width: 15,
                height: 15,
                borderRadius: '50%',
                background: theme.palette.secondary.main,
                opacity: 0.3,
                animation: 'float 3s ease-in-out infinite 1.5s'
              }}
            />
          </Box>
        </MotionBox>

        {/* Action Buttons */}
        <MotionBox
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/"
            startIcon={<HomeIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Go Home
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Go Back
          </Button>
        </MotionBox>

        {/* Helpful Links */}
        <MotionBox
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          sx={{ mt: 6 }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Or try these popular pages:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'center',
              mt: 2
            }}
          >
            <Button
              component={RouterLink}
              to="/services"
              variant="text"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Products
            </Button>
            <Button
              component={RouterLink}
              to="/categories"
              variant="text"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Categories
            </Button>
            <Button
              component={RouterLink}
              to="/admin"
              variant="text"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Admin
            </Button>
          </Box>
        </MotionBox>
      </Box>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}
      </style>
    </Container>
  );
};

export default NotFound;