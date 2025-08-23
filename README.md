# soundbored-cli

A command-line interface for quickly searching and playing sounds from your SoundBored API.

## Features

- 🔍 Fuzzy search through all available sounds
- ⚡ Fast keyboard navigation
- 🎵 Instant sound playback
- 🎨 Clean, interactive terminal UI

## Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn
- Access to a SoundBored API instance

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/christomitov/soundbored-cli.git
cd soundbored-cli
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Link the CLI globally:
```bash
npm link
```

Now you can use `soundbored` command from anywhere in your terminal!

## Configuration

Create a `.env` file in the project root to customize your configuration:

```env
SOUNDBORED_TOKEN=REDACTED
```

Default configuration:
- API URL: `https://example.invalid
- Default token is provided (can be overridden)

## Usage

### Basic Usage

Start the interactive sound browser:
```bash
soundbored
```

### Search with Initial Query

Start with a pre-filled search:
```bash
soundbored "airhorn"
```

### Keyboard Shortcuts

- **↑/↓** - Navigate through sounds
- **Page Up/Page Down** - Jump 10 sounds at a time
- **Enter** - Play selected sound (clears search but keeps results)
- **Ctrl+C** - Clear search and show all sounds (press twice to exit)
- **ESC** - Clear search or exit if no search
- **Type** - Search sounds in real-time

## Development

### Run in Development Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Project Structure

```
soundbored-cli/
├── bin/           # CLI entry point
├── src/
│   ├── cli.tsx    # Main CLI setup
│   ├── components/
│   │   ├── App.tsx         # Main app component
│   │   ├── SearchInput.tsx # Search input component
│   │   ├── SoundList.tsx   # Sound list display
│   │   └── StatusBar.tsx   # Status bar component
│   ├── services/
│   │   └── api.ts  # API service for sound fetching
│   └── types/      # TypeScript type definitions
├── package.json
└── tsconfig.json
```

## Troubleshooting

### "Raw mode is not supported" Error

This CLI requires an interactive terminal. Make sure you're running it directly in your terminal, not through pipes or non-TTY environments.

### API Connection Issues

1. Check your `.env` file has the correct `SOUNDBORED_TOKEN`
2. Verify the API URL is accessible
3. Ensure you have network connectivity

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## Author

Created for the SoundBored sound effects system.