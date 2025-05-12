import { Box, Typography, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

const LogoBox = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  background: `linear-gradient(to bottom right, #B8860B, #000080)`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const GradientTypography = styled(Typography)(({ }) => ({
  background: 'linear-gradient(to right, #B8860B, #000080)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 'bold',
}));

export default function Logo() {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <LogoBox>
        <Box sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
            A
          </Typography>
          <Typography
            variant="h5"
            component="span"
            sx={{ transform: 'translateY(-4px)' }}
          >
            ✓
          </Typography>
        </Box>
      </LogoBox>
      <Box>
        <GradientTypography variant="h5">
          Aurex
        </GradientTypography>
        <Typography variant="caption" color="text.secondary">
          Smart. Secure. Exam Paper Generation.
        </Typography>
      </Box>
    </Stack>
  );
} 