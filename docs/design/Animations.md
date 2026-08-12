# Orbit Animations Specifications

Extracted from CSS keyframes in `globals.css` and Framer Motion transitions:

1. **Pulse Ring (`animate-pulse-ring`)**:
   - `0%`: `scale(0.8)`, `opacity: 1`
   - `100%`: `scale(1.4)`, `opacity: 0`
   - Duration: 2s infinite ease-out

2. **Orbit Spin (`animate-orbit`)**:
   - Rotation from 0 deg to 360 deg
   - Duration: 20s linear infinite

3. **Data Stream (`animate-data-stream`)**:
   - Gradient shift across `#00BFFF` → `#A020F0` → `#00BFFF`
   - Duration: 3s ease-in-out infinite
