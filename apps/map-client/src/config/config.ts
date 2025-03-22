export const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v11',
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v11',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v11',
  LIGHT: 'mapbox://styles/mapbox/light-v10',
  DARK: 'mapbox://styles/mapbox/dark-v10',
  NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1'
};

export const MAPBOX_CONFIG = {
  API_KEY: import.meta.env.VITE_MAPBOX_API_KEY || '',
  DEFAULT_STYLE: MAP_STYLES.STREETS,
  DEFAULT_CENTER: [-74.5, 40] as [number, number],
  DEFAULT_ZOOM: 2,
  STYLES: MAP_STYLES,

  NAVIGATION_CONTROL: {
    POSITION: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    SHOW_COMPASS: true,
    SHOW_ZOOM: true,
  },

  INTERACTION: {
    SCROLL_ZOOM: true,
    DRAG_ROTATE: true,
    DRAG_PAN: true,
    KEYBOARD: true,
    DOUBLE_CLICK_ZOOM: true,
    TOUCH_ZOOM_ROTATE: true,
  },

  STYLE_TRANSITION_DURATION: 300,

  GEOLOCATE_CONTROL: {
    POSITION: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    ENABLE_HIGH_ACCURACY: true,
    TRACK_USER_LOCATION: true,
    SHOW_USER_LOCATION: true,
  },

  FIT_BOUNDS_PADDING: 50,

  MAX_ZOOM: 20,
  MIN_ZOOM: 0,

  ATTRIBUTION_CONTROL: {
    COMPACT: true,
    POSITION: 'bottom-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  }
};
