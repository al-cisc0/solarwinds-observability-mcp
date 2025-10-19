# Publishing to npm

## First Time Setup

1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm from your terminal:
```bash
npm login
```

## Publishing Steps

1. Ensure you're on the latest main branch:
```bash
git checkout main
git pull origin main
```

2. Run tests and build:
```bash
npm run build
```

3. Update the version number:
```bash
# For patch releases (bug fixes): 0.1.0 -> 0.1.1
npm version patch

# For minor releases (new features): 0.1.0 -> 0.2.0
npm version minor

# For major releases (breaking changes): 0.1.0 -> 1.0.0
npm version major
```

4. Publish to npm:
```bash
npm publish
```

5. Push the version tag to GitHub:
```bash
git push origin main --tags
```

## Verifying the Publication

After publishing, verify the package is available:

```bash
# Check npm registry
npm view solarwinds-observability-mcp

# Test global installation
npm install -g solarwinds-observability-mcp
solarwinds-mcp --version
```

## Unpublishing (Emergency Only)

If you need to unpublish within 72 hours:
```bash
npm unpublish solarwinds-observability-mcp@<version>
```

Note: npm's unpublish policy is strict. You can only unpublish within 72 hours if no other packages depend on it.

## Access Management

To add collaborators:
```bash
npm owner add <username> solarwinds-observability-mcp
```

To check current owners:
```bash
npm owner ls solarwinds-observability-mcp
```