export const isAppleDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // Check for iOS devices (iPhone, iPad, iPod)
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
    (platform === 'macintel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
  
  // Check for Mac
  const isMac = platform.startsWith('mac') || /macintosh|mac os x/.test(userAgent);
  
  // Check for Safari browser (often indicates Apple device)
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/android/.test(userAgent);
  
  return isIOS || isMac || isSafari;
};

export const getDeviceType = (): 'ios' | 'android' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  return 'desktop';
};

export const isAndroidDevice = (): boolean => {
  return /android/.test(navigator.userAgent.toLowerCase());
};

export const isMobileDevice = (): boolean => {
  return /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(navigator.userAgent);
};