import { Box, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Image1 from "../../assets/login/banner1.png";
import Image2 from "../../assets/login/banner2.png";
import Image3 from "../../assets/login/banner3.png";

function LoginLayout() {
  const images = [Image1, Image2, Image3];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box overflow="hidden" height="100vh">
      <Grid container height="100%">
        <Grid size={6}>
          <Box position="relative" height="100%" width="100%">
            <img
              src={images[current]}
              alt="slider"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <Box
              position="absolute"
              bottom={"100px"}
              width="100%"
              display="flex"
              justifyContent="center"
              gap={1}
            >
              {images.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrent(index)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor:
                      current === index ? "#fff" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        <Grid size={6}>
          <Outlet />
        </Grid>
      </Grid>
    </Box>
  );
}

export default LoginLayout;
