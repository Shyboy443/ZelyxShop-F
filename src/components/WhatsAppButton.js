import React from "react";
import { Fab, Tooltip } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

const WhatsAppButton = () => {
  const phoneNumber = "+94710846293";
  const message = "Hello! I'm interested in your services.";

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(
      /[^\d]/g,
      ""
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Tooltip title="Chat with us on WhatsApp" placement="top">
      <Fab
        color="success"
        onClick={handleWhatsAppClick}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          backgroundColor: "#25D366",
          "&:hover": {
            backgroundColor: "#128C7E",
            transform: "scale(1.1)",
          },
          transition: "all 0.3s ease",
          boxShadow: "0 4px 20px rgba(37, 211, 102, 0.4)",
        }}
      >
        <WhatsAppIcon
          sx={{
            color: (theme) => theme.palette.getContrastText("#25D366"),
            fontSize: 28,
          }}
        />
      </Fab>
    </Tooltip>
  );
};

export default WhatsAppButton;
