# LoadingLogo Component

A loading animation component that uses the logo.svg with CSS animations to create a spreading effect from the center.

## Features

- **Spreading Animation**: Logo scales up and rotates from center on initial load (2 seconds)
- **Multiple Variants**: Choose from pulse, breathing, or rotating animations
- **Customizable Size**: Adjust the logo size as needed
- **Drop Shadow**: Adds depth to the animation

## Usage

### Basic Usage

```tsx
import LoadingLogo from "./components/Common/LoadingLogo"

function App() {
  return (
    <div style={{ height: "100vh" }}>
      <LoadingLogo />
    </div>
  )
}
```

### With Custom Size

```tsx
<LoadingLogo size="200px" />
```

### Animation Variants

#### Pulse (Default)
Gentle pulsing effect after the initial spread animation:
```tsx
<LoadingLogo variant="pulse" />
```

#### Breathing
More pronounced scaling with slight rotation:
```tsx
<LoadingLogo variant="breathing" />
```

#### Rotating
Continuous rotation after the initial spread:
```tsx
<LoadingLogo variant="rotating" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `string` | `"120px"` | The width and height of the logo |
| `variant` | `"pulse" \| "breathing" \| "rotating"` | `"pulse"` | The animation style after the initial spread |

## Animation Timeline

1. **0s - 2s**: Spreading animation
   - Logo scales from 0 to 1.1 to 1
   - Rotates 360 degrees
   - Opacity fades in
2. **2s onwards**: Continuous loop animation based on selected variant

## Example Use Cases

### Full Page Loader

```tsx
import { Box } from "@chakra-ui/react"
import LoadingLogo from "./components/Common/LoadingLogo"

function FullPageLoader() {
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="white"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <LoadingLogo size="150px" variant="pulse" />
    </Box>
  )
}
```

### Loading State in Component

```tsx
import { Box, Spinner } from "@chakra-ui/react"
import LoadingLogo from "./components/Common/LoadingLogo"

function DataComponent() {
  const { data, isLoading } = useQuery(...)
  
  if (isLoading) {
    return (
      <Box height="400px">
        <LoadingLogo size="100px" />
      </Box>
    )
  }
  
  return <div>{/* Your content */}</div>
}
```

### Button Loading State

```tsx
import { Button } from "@chakra-ui/react"
import LoadingLogo from "./components/Common/LoadingLogo"

function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false)
  
  return (
    <Button
      onClick={handleSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <LoadingLogo size="24px" variant="rotating" />
      ) : (
        "Submit"
      )}
    </Button>
  )
}
```

## Customization

### Modify Animation Duration

Edit `LoadingLogo.css` and change the animation duration:

```css
.loading-logo {
  /* Change 2s to your desired duration */
  animation: spreadFromCenter 2s ease-out, continuousPulse 1.5s ease-in-out infinite 2s;
}
```

### Create Custom Variants

Add your own animation in `LoadingLogo.css`:

```css
.loading-logo.custom {
  animation: spreadFromCenter 2s ease-out, myCustomAnimation 2s ease-in-out infinite 2s;
}

@keyframes myCustomAnimation {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(10deg);
  }
}
```

Then use it:
```tsx
<LoadingLogo variant="custom" />
```

## Files

- `LoadingLogo.tsx` - Main component
- `LoadingLogo.css` - Animation styles
- `LoadingLogoExample.tsx` - Demo component (for development)
- `logo.svg` - Source logo file (in `/theme/assets/`)
