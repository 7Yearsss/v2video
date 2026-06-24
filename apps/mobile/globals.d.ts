// Ambient declarations for CSS imports used by the Expo web template.
// Normally provided by Expo's generated expo-env.d.ts; declared here so a
// bare `tsc --noEmit` typecheck passes in the monorepo.

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css';
