// Destination: app/@modal/default.tsx
//
// Required by Next.js for every parallel-route slot (the "modal" prop
// layout.tsx already destructures): whenever the current URL doesn't
// match one of the intercepted routes below, this renders instead — i.e.
// nothing. Without this file, visiting any page that ISN'T an
// intercepted case-study/exploration route would error, since the
// @modal slot would have nothing to render.
export default function Default() {
  return null;
}
