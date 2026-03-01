// src/main.ts
import './app.css'; // Agar app.css exist karta hai to, nahi to hata sakte ho
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;