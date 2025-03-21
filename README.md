# GeoMapApp - Collaborative Mapping Application

GeoMapApp is a real-time collaborative Geographic Information System (GIS) that allows multiple users to create, edit, and analyze geographic data simultaneously. Built with a modern React frontend and Express backend, it features real-time drawing capabilities, area calculations, and layer management.

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Technical Decisions](#technical-decisions)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Usage Guide](#usage-guide)
- [Development Workflow](#development-workflow)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Setup Instructions

### Prerequisites

- Node.js (v18.x or later)
- npm (v10.x or later)
- A Mapbox account with an API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/geo-map-app.git
cd geo-map-app
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory of `map-backend` with the following variables:
```
PORT=3333
NODE_ENV=development
DB_PATH=./data/geodata.db
FRONTEND_URL=http://localhost:4200
LOG_LEVEL=info
```

4. Create a `.env` file in the root directory of `map-client` with the following variables:
```
VITE_MAPBOX_API_KEY=your_mapbox_api_key
VITE_API_BASE_URL=http://localhost:3333
VITE_SOCKET_URL=http://localhost:3333
```

You'll need to create a Mapbox account and get an API key from [Mapbox](https://www.mapbox.com/).

4. Initialize the database:
```bash
npm run prepare-db
```

### Running the Application

#### Development Mode

Run both frontend and backend in development mode with hot reloading:
```bash
npm run dev
```

#### Production Mode

Build and run the application in production mode:
```bash
npm run build
npm run start
```

#### Running Components Separately

Start only the backend:
```bash
npm run start:backend
```

Start only the frontend:
```bash
npm run start:frontend
```

The application will be available at http://localhost:4200

## Technical Decisions

### Architecture

- **Nx Monorepo**: Used to manage shared code between frontend and backend, improving code organization and reusability.
- **TypeScript**: Implemented throughout the entire application for type safety and better developer experience.
- **Socket.IO**: Chosen for real-time communication, providing reliable bidirectional event-based communication.
- **Modular Design**: Code organized into reusable libraries for sharing between frontend and backend.

### Frontend

- **React 19**: Leverages the latest React features for performance and maintainability.
- **Mapbox GL JS**: Provides high-performance, customizable maps with excellent developer tools.
- **Styled Components**: Used for component-scoped CSS with theming capabilities.
- **IndexedDB (Dexie.js)**: Provides offline capabilities and client-side storage for map data.
- **Custom Hooks**: Extensive use of React hooks for state management and reusable logic.
- **Context API**: Used instead of Redux for simpler global state management.

### Backend

- **Express**: Lightweight, flexible Node.js web application framework for the API.
- **SQLite with SpatiaLite**: Chosen for its simplicity, portability, and spatial data capabilities.
- **Socket.IO Server**: Manages real-time updates and collaboration between users.
- **Layer-based API**: Organized API endpoints based on domain functionality.

### Geospatial Processing

- **Turf.js**: Used for client-side geospatial calculations.
- **WGS84 Coordinate System**: Standard geographic coordinate system for web mapping.
- **GeoJSON**: Standard format for representing geographic features and their attributes.

## Architecture

### System Architecture Diagram

```
┌─────────────────┐     WebSocket     ┌─────────────────┐
│                 │◄───(Socket.IO)───►│                 │
│  React Frontend │                   │ Express Backend │
│    (Browser)    │◄───REST API────►  │   (Node.js)     │
│                 │                   │                 │
└────────▲────────┘                   └────────▲────────┘
         │                                     │
         │       ┌──────────────────┐          │
         └──────►│ Mapbox Services  │          │
                 └──────────────────┘          │
                                               │
                                     ┌─────────▼─────────┐
                                     │                   │
                                     │  SQLite Database  │
                                     │                   │
                                     └───────────────────┘
```

### Data Flow

1. User interactions with the map trigger WebSocket events.
2. The server processes these events, performs necessary calculations, and updates the database.
3. Changes are broadcast to all connected clients in real-time.
4. Local state is updated first for responsiveness while waiting for server confirmation.
5. Offline changes are queued and synchronized when connection is restored.

## Project Structure

The project is organized as an Nx monorepo with the following structure:

```
geo-map-app/
├── apps/
│   ├── map-client/        # Frontend React application
│   └── map-backend/       # Backend Express application
├── libs/
│   ├── types/             # Shared TypeScript interfaces
│   ├── utils/             # Shared utility functions
│   ├── constants/         # Shared constants
│   ├── db/                # Database models and connections
│   └── frontend-utils/    # Frontend-specific utilities
├── data/                  # Database files
├── docs/                  # Documentation and assets
├── scripts/               # Build and utility scripts
└── nx.json                # Nx configuration
```

## Features

- **Real-time Collaboration**: Multiple users can draw and edit polygons simultaneously.
- **Layer Management**: Organize spatial data into layers for better organization.
- **Area Calculation**: Automatically calculates the area of drawn polygons in appropriate units.
- **GeoJSON Support**: Import and export data in standard GeoJSON format.
- **User Presence**: Shows active users and their current activities.
- **Offline Capability**: Basic functionality works even when disconnected from the server.
- **Concurrent Editing**: Supports multiple users editing different polygons simultaneously.
- **Drag and Drop Coordinates**: Reorder polygon vertices by dragging and dropping.
- **Automatic Area Units**: Automatically switches between m² and km² based on polygon size.
- **Jump to Location**: Navigate directly to coordinates on the map.
- **Polygon Simplification**: Simplify complex polygons while preserving shape.

## Usage Guide

### Creating a Layer

1. Open the sidebar by clicking the toggle button on the left side.
2. Click "Add Layer" and enter a name for your new layer.
3. Click "Save" to create the layer.

### Drawing a Polygon

1. Select the layer where you want to add the polygon from the dropdown.
2. Click the "+" button to open the drawing modal.
3. Click on the map to add points for your polygon.
4. Enter a name and choose a color for your polygon.
5. Click "Save" to save the polygon.

### Editing a Polygon

1. Find the polygon you want to edit in the sidebar list.
2. Click the edit button (pencil icon) next to the polygon.
3. Modify the points by dragging them or adding new points.
4. You can also edit the name and color.
5. Click "Save" to save your changes.

### Real-time Collaboration

- When multiple users are connected, you'll see them listed in the "Active Users" section.
- You can see what polygons others are editing in real-time.
- Click on a user to view their current drawing or edits.

### Viewing Area Calculations

- As you draw a polygon, the area is calculated automatically.
- For smaller areas, the measurement is displayed in square meters (m²).
- For larger areas, the measurement is displayed in square kilometers (km²).

### Working Offline

- The application will continue to function if you lose connection to the server.
- Changes you make offline will be synchronized when the connection is restored.
- A status indicator in the corner shows your connection status.

## Known Limitations

1. **Browser Compatibility**: Optimized for modern browsers; may have issues with older browsers.
2. **Mobile Support**: The interface is primarily designed for desktop use; mobile optimization is limited.
3. **Large Dataset Performance**: Performance may degrade with very large numbers of polygons (>1000).
4. **Network Dependency**: While basic offline functionality exists, full features require network connectivity.
5. **Authentication**: Currently lacks user authentication system; all users are anonymous.
6. **Coordinate System**: Only supports WGS84 (standard web mapping) coordinate system.
7. **Complex Spatial Operations**: Limited support for complex spatial queries and operations.
8. **Internet Explorer**: Not supported on Internet Explorer.
9. **WebGL Requirement**: Requires browser support for WebGL for map rendering.
10. **Memory Usage**: Can be memory-intensive with many complex polygons active.

## Future Improvements

1. **Authentication System**: Implement user accounts, permissions, and access control.
2. **Enhanced Mobile Support**: Optimize UI for better mobile experience.
3. **Advanced Spatial Analysis**: Add additional spatial analysis tools (buffer, intersection, etc.).
4. **Custom Basemaps**: Allow users to add their own basemaps or WMS layers.
5. **Data Import/Export**: Support for importing/exporting additional formats (Shapefile, KML, etc.).
6. **Performance Optimization**: Implement clustering and level-of-detail rendering for large datasets.
7. **Collaborative Features**: Add commenting, versioning, and approval workflows.
8. **Offline Sync**: Improve offline capabilities with better conflict resolution.
9. **Map Styling**: Add styling options for polygons, lines, and points with advanced symbolization.
10. **3D Visualization**: Add 3D terrain and extrusion capabilities.
11. **Time-series Data**: Support for temporal data and time-based visualization.
12. **Progressive Web App**: Convert to PWA for better offline experience and installation capability.
13. **Improved Monorepo Structure**: Move more code to shared libraries for better reuse between applications.
14. **Microservices Architecture**: Split backend into specialized microservices for better scalability.
15. **GraphQL API**: Add GraphQL support for more flexible data querying.

## Troubleshooting

### Common Issues

#### The map is not loading
- Check that your Mapbox API key is correct in the `.env` file.
- Ensure your browser supports WebGL.
- Check browser console for specific errors.

#### Socket connection errors
- Verify the backend is running.
- Check for network connectivity issues.
- Try clearing browser cache and cookies.

#### Database errors
- Ensure the SQLite database file exists and is accessible.
- Check file permissions on the data directory.
- Run `npm run prepare-db` to reset the database.

### Support

For support, please open an issue on GitHub with:
- A detailed description of the problem
- Steps to reproduce
- Your environment details (OS, browser, versions)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run tests and linting.
5. Submit a pull request.

Please follow the code style guidelines and write meaningful commit messages.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
