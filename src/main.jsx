import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const updateThemeColor = () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeColor = isDarkMode ? "#0f172b" : "#0f172b";
  const metaThemeColor = document.querySelector("meta[name=theme-color]");

  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", themeColor);
  } else {
    const newMetaThemeColor = document.createElement("meta");
    newMetaThemeColor.setAttribute("name", "theme-color");
    newMetaThemeColor.setAttribute("content", themeColor);
    document.head.appendChild(newMetaThemeColor);
  }
};

updateThemeColor();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
