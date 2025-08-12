import React, { useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";

const FallbackImage = ({
  src,
  alt,
  width = "100%",
  height = 200,
  title,
  sx = {},
  placeholder = true,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const theme = useTheme();

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const checkerColor = theme.palette.mode === "dark" ? "#333333" : "#f0f0f0";
  const fallbackBackground = `linear-gradient(45deg, ${checkerColor} 25%, transparent 25%), linear-gradient(-45deg, ${checkerColor} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checkerColor} 75%), linear-gradient(-45deg, transparent 75%, ${checkerColor} 75%)`;

  return (
    <Box
      sx={{
        width,
        height,
        background: imageError || !src ? fallbackBackground : `url(${src})`,
        backgroundSize: imageError || !src ? "20px 20px" : "cover",
        backgroundPosition:
          imageError || !src ? "0 0, 0 10px, 10px -10px, -10px 0px" : "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        ...sx,
      }}
      {...props}
    >
      {!imageError && src && (
        <img
          src={src}
          alt={alt}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            display: "none",
          }}
        />
      )}
      {(imageError || !src) && placeholder && title && (
        <Typography
          variant="h6"
          color="text.secondary"
          align="center"
          sx={{
            fontSize: { xs: "0.8rem", sm: "1rem" },
            padding: 1,
          }}
        >
          {title}
        </Typography>
      )}
    </Box>
  );
};

export default FallbackImage;
