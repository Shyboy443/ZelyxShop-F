import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        py: 6,
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h4"
              component="div"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Zelyx
            </Typography>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: "#2979FF", mb: 2 }}
            >
              Premium Service Accounts
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6 }}>
              Access premium digital services with Zelyx. We provide authentic
              service accounts with reliable delivery, making your digital
              experience seamless and secure.
            </Typography>

            {/* Social Media Icons */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                sx={{ color: "text.primary", "&:hover": { color: "primary.main" } }}
                aria-label="Facebook"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                sx={{ color: "text.primary", "&:hover": { color: "primary.main" } }}
                aria-label="Twitter"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                sx={{ color: "text.primary", "&:hover": { color: "primary.main" } }}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                sx={{ color: "text.primary", "&:hover": { color: "primary.main" } }}
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link
                component={RouterLink}
                to="/"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Home
              </Link>
              <Link
                component={RouterLink}
                to="/services"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Services
              </Link>
              <Link
                href="#categories"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Categories
              </Link>
              <Link
                component={RouterLink}
                to="/otp"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                OTP Service
              </Link>
              <Link
                component={RouterLink}
                to="/admin/login"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Admin
              </Link>
            </Box>
          </Grid>

          {/* Customer Service */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Customer Service
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Help Center
              </Link>
              <Link
                href="#"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Delivery Info
              </Link>
              <Link
                href="#"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Refunds & Support
              </Link>
              <Link
                href="#"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Service Guide
              </Link>
              <Link
                href="#"
                sx={{
                  color: "text.primary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Contact Us
              </Link>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={3}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Contact Info
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon sx={{ color: "#2979FF" }} />
                <Typography variant="body2">support@zelyx.shop</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PhoneIcon sx={{ color: "#2979FF" }} />
                <Typography variant="body2">+94 11 234 5678</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <LocationIcon sx={{ color: "#2979FF", mt: 0.5 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                  123 Fashion Street,
                  <br />
                  Colombo 03,
                  <br />
                  Sri Lanka
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: "divider" }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "text.secondary" }}
          >
            © {currentYear} Zelyx. All rights reserved.
          </Typography>

          <Box sx={{ display: "flex", gap: 3 }}>
            <Link
              href="#"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              Cookie Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
