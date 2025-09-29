# MacroOverlay E2E Tests

This directory contains end-to-end tests for the MacroOverlay application using Playwright.

## Test Structure

### Test Files

- **`overlay.spec.ts`** - Tests for the game overlay window functionality
  - Overlay display and visibility
  - Diana champion rules system
  - Game state simulation and rendering
  - Advice system with different scenarios

- **`launcher.spec.ts`** - Tests for the main launcher window
  - UI components and layout
  - Stats display and recent games
  - Settings configuration
  - Ad space rendering

- **`lcu-integration.spec.ts`** - Tests for League Client API integration
  - LCU connection handling
  - Game state parsing and validation
  - Objective timer calculations
  - Champion-specific data loading

- **`hotkeys.spec.ts`** - Tests for global hotkey functionality
  - F10 overlay toggle
  - Ctrl+Shift+M launcher toggle
  - Hotkey configuration and validation
  - System-level shortcut handling

- **`performance.spec.ts`** - Performance and load testing
  - Memory usage under rapid updates
  - UI responsiveness under load
  - Animation frame rates
  - CPU usage monitoring

- **`integration.spec.ts`** - Full integration workflow tests
  - State synchronization between windows
  - Complete game session workflows
  - Error recovery scenarios
  - Data consistency checks

### Helper Utilities

- **`helpers/test-utils.ts`** - Shared utilities and mock data
  - App launch/close helpers
  - Mock game state generators
  - Common assertion helpers
  - Performance measurement tools

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm run test

# Run with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run specific test file
npm run test:overlay
npm run test:launcher
npm run test:lcu
npm run test:hotkeys

# Debug mode (step through tests)
npm run test:debug

# View test report
npm run test:report
```

### Environment Variables

Set these environment variables for different test configurations:

```bash
# Run tests in CI mode
CI=true npm run test

# Set custom test timeout
PLAYWRIGHT_TIMEOUT=30000 npm run test

# Enable verbose logging
DEBUG=pw:api npm run test
```

## Test Scenarios

### Overlay Tests
- ✅ Basic overlay rendering and styling
- ✅ Diana champion rules display
- ✅ Game state simulation and updates
- ✅ Advice system with different gold scenarios
- ✅ Objective timer accuracy
- ✅ Responsive design validation

### Launcher Tests
- ✅ Main window layout and components
- ✅ Statistics grid display
- ✅ Recent games table
- ✅ Settings panel functionality
- ✅ Ad space rendering
- ✅ Button interactions

### LCU Integration Tests
- ✅ Connection failure handling
- ✅ Game state parsing validation
- ✅ Champion switching scenarios
- ✅ Objective state calculations
- ✅ Network error recovery
- ✅ Rate limiting simulation

### Hotkey Tests
- ✅ F10 overlay toggle
- ✅ Ctrl+Shift+M launcher toggle
- ✅ Custom hotkey configuration
- ✅ Invalid key combination handling
- ✅ System conflict detection
- ✅ Rapid key press handling

### Performance Tests
- ✅ Memory leak detection
- ✅ UI responsiveness under load
- ✅ Animation performance
- ✅ Concurrent operation handling
- ✅ CPU usage optimization
- ✅ Frame rate stability

### Integration Tests
- ✅ Cross-window state synchronization
- ✅ Complete game session workflows
- ✅ Settings persistence
- ✅ Error recovery scenarios
- ✅ Data consistency validation
- ✅ Window positioning/resizing

## Mock Data

The tests use comprehensive mock data to simulate various game scenarios:

### Game States
- Early game (levels 1-5)
- Mid game power spikes (level 6+)
- Late game scenarios (level 11+)
- Different champions (Diana, Yasuo, Zed)

### Objective States
- Dragon spawns and types
- Baron timer calculations
- Herald availability windows
- Multi-objective scenarios

### Gold Scenarios
- Team ahead (fight advice)
- Team behind (avoid advice)
- Even game state (trade advice)
- Extreme gold differentials

## Continuous Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests to main
- Multiple operating systems (Ubuntu, Windows, macOS)

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Debugging Tests

### Local Debugging
1. Run tests in debug mode: `npm run test:debug`
2. Use UI mode for interactive debugging: `npm run test:ui`
3. Add `await page.pause()` in test code for breakpoints

### CI Debugging
- Check test artifacts uploaded to GitHub Actions
- Review Playwright reports for detailed failure information
- Examine screenshots and videos of failed tests

## Best Practices

1. **Test Isolation** - Each test should be independent
2. **Mock External Dependencies** - Use mock LCU data instead of real League client
3. **Stable Selectors** - Use data-testid or semantic selectors
4. **Wait Strategies** - Use proper waits instead of arbitrary timeouts
5. **Clean State** - Reset application state between tests
6. **Performance Awareness** - Include performance assertions in tests

## Troubleshooting

### Common Issues

1. **Electron App Not Starting**
   - Ensure build artifacts exist: `npm run build:dev`
   - Check file paths in test configuration

2. **Flaky Tests**
   - Increase timeouts for slow operations
   - Add proper wait conditions
   - Check for race conditions

3. **Platform-Specific Failures**
   - Verify platform-specific selectors
   - Check OS-specific hotkey combinations
   - Test window behavior differences

### Performance Issues

1. **Slow Test Execution**
   - Reduce unnecessary waits
   - Parallelize independent tests
   - Optimize mock data generation

2. **Memory Leaks in Tests**
   - Properly close Electron apps
   - Clean up event listeners
   - Monitor resource usage