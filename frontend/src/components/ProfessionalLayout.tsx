import React from 'react';
import {
  Box,
  Container,
  Fab,
  Zoom,
  useScrollTrigger,
  useTheme,
  alpha
} from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';
import ProfessionalHeader from './ProfessionalHeader';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
  showScrollTop?: boolean;
  headerProps?: {
    title?: string;
    subtitle?: string;
    user?: {
      name: string;
      role: string;
      avatar?: string;
    };
    onLogout?: () => void;
    onSettings?: () => void;
    onDashboard?: () => void;
    showActions?: boolean;
  };
}

function ScrollTop({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (
      (event.target as HTMLDivElement).ownerDocument || document
    ).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({
  children,
  maxWidth = 'lg',
  disablePadding = false,
  showScrollTop = true,
  headerProps
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.01"%3E%3Cpath d="M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: -1
        }
      }}
    >
      {/* Scroll anchor */}
      <div id="back-to-top-anchor" />
      
      {/* Header */}
      {headerProps && <ProfessionalHeader {...headerProps} />}
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          position: 'relative',
          zIndex: 1
        }}
      >
        {maxWidth === false ? (
          <Box sx={{ py: disablePadding ? 0 : 3 }}>
            {children}
          </Box>
        ) : (
          <Container 
            maxWidth={maxWidth}
            sx={{ 
              py: disablePadding ? 0 : 4,
              px: { xs: 2, sm: 3 }
            }}
          >
            {children}
          </Container>
        )}
      </Box>

      {/* Scroll to top button */}
      {showScrollTop && (
        <ScrollTop>
          <Fab 
            size="small" 
            aria-label="scroll back to top"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              }
            }}
          >
            <KeyboardArrowUp />
          </Fab>
        </ScrollTop>
      )}
    </Box>
  );
};

export default ProfessionalLayout;
