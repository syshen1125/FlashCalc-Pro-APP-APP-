
export const CUSTOM_FONT_FAMILY = 'FlashCalcCustomFont';
export const STORAGE_KEY_DATA = 'customFontData';
export const STORAGE_KEY_NAME = 'customFontName';

/**
 * Injects the custom font into the document head as a style tag.
 */
export const injectCustomFont = (base64Data: string) => {
  const styleId = 'flash-calc-custom-font-style';
  let styleTag = document.getElementById(styleId);
  
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    @font-face {
      font-family: '${CUSTOM_FONT_FAMILY}';
      src: url('${base64Data}');
      font-display: swap;
    }
  `;
};

/**
 * Loads the custom font from local storage if available.
 */
export const loadCustomFontFromStorage = (): boolean => {
  try {
    const fontData = localStorage.getItem(STORAGE_KEY_DATA);
    if (fontData) {
      injectCustomFont(fontData);
      return true;
    }
  } catch (e) {
    console.error("Failed to load custom font", e);
  }
  return false;
};

/**
 * Gets the name of the saved custom font.
 */
export const getCustomFontName = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_NAME);
}
