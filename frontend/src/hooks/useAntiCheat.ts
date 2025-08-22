import { useState, useEffect } from 'react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface DeviceFingerprint {
  fingerprintHash: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvasFingerprint: string;
}

interface AntiCheatState {
  deviceFingerprint: DeviceFingerprint | null;
  locationData: GeolocationData | null;
  suspiciousActivity: boolean;
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAntiCheat = () => {
  const [state, setState] = useState<AntiCheatState>({
    deviceFingerprint: null,
    locationData: null,
    suspiciousActivity: false,
    isLocationEnabled: false,
    isLoading: true,
    error: null
  });

  // Generate device fingerprint
  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        // Create canvas fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('Device fingerprint 🔒', 2, 2);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('Device fingerprint 🔒', 4, 4);
        }

        const fingerprintData = {
          canvas: canvas.toDataURL(),
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
          hardwareConcurrency: navigator.hardwareConcurrency || 0,
          deviceMemory: (navigator as any).deviceMemory || 0,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || 'unknown'
        };

        // Generate hash
        const fingerprintString = JSON.stringify(fingerprintData);
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const fingerprintHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const fingerprint: DeviceFingerprint = {
          fingerprintHash,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          canvasFingerprint: canvas.toDataURL()
        };

        setState(prev => ({ 
          ...prev, 
          deviceFingerprint: fingerprint,
          isLoading: false 
        }));
      } catch (error) {
        console.error('Error generating device fingerprint:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to generate device fingerprint',
          isLoading: false 
        }));
      }
    };

    generateFingerprint();
  }, []);

  // Get location
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setState(prev => ({ 
          ...prev, 
          error: 'Geolocation is not supported by this browser' 
        }));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          setState(prev => ({ 
            ...prev, 
            locationData,
            isLocationEnabled: true 
          }));
        },
        (error) => {
          console.warn('Location access denied or failed:', error);
          setState(prev => ({ 
            ...prev, 
            isLocationEnabled: false,
            error: `Location error: ${error.message}`
          }));
        },
        options
      );
    };

    getLocation();
  }, []);

  // Monitor for suspicious activity
  useEffect(() => {
    let suspiciousActivityCount = 0;
    const maxSuspiciousActivity = 3;

    // Check for developer tools
    const devtools = {
      open: false,
      orientation: null as string | null
    };

    const threshold = 160;

    const devToolsInterval = setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          suspiciousActivityCount++;
          console.warn('Developer tools detected');
        }
      } else {
        devtools.open = false;
      }

      if (suspiciousActivityCount >= maxSuspiciousActivity) {
        setState(prev => ({ ...prev, suspiciousActivity: true }));
      }
    }, 2000); // Increased from 500ms to 2000ms to reduce performance impact

    // Check for multiple tabs/windows
    const handleVisibilityChange = () => {
      if (document.hidden) {
        suspiciousActivityCount++;
        if (suspiciousActivityCount >= maxSuspiciousActivity) {
          setState(prev => ({ ...prev, suspiciousActivity: true }));
        }
      }
    };

    // Check for context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      suspiciousActivityCount++;
      if (suspiciousActivityCount >= maxSuspiciousActivity) {
        setState(prev => ({ ...prev, suspiciousActivity: true }));
      }
    };

    // Check for key combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        suspiciousActivityCount++;
        if (suspiciousActivityCount >= maxSuspiciousActivity) {
          setState(prev => ({ ...prev, suspiciousActivity: true }));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const verifyAntiCheat = async (sessionId: string): Promise<boolean> => {
    try {
      const requestData = {
        sessionId,
        location: state.locationData ? {
          latitude: state.locationData.latitude,
          longitude: state.locationData.longitude,
          accuracy: state.locationData.accuracy,
          method: 'GPS'
        } : null,
        deviceFingerprint: state.deviceFingerprint
      };

      const response = await fetch('/api/anti-cheat/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      return result.isValid;
    } catch (error) {
      console.error('Anti-cheat verification failed:', error);
      return false;
    }
  };

  const verifyLiveness = async (imageFile: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/anti-cheat/verify-liveness', {
        method: 'POST',
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Liveness verification failed:', error);
      return { isLive: false, error: error.message };
    }
  };

  const assessImageQuality = async (imageFile: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/anti-cheat/assess-quality', {
        method: 'POST',
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Image quality assessment failed:', error);
      return { isGoodQuality: false, error: error.message };
    }
  };

  const detectMultipleFaces = async (imageFile: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/anti-cheat/detect-multiple-faces', {
        method: 'POST',
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Multiple face detection failed:', error);
      return { hasMultipleFaces: false, faceCount: 0, error: error.message };
    }
  };

  return {
    ...state,
    verifyAntiCheat,
    verifyLiveness,
    assessImageQuality,
    detectMultipleFaces
  };
};
