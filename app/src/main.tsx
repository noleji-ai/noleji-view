import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.tsx'
import { getAppBasePath } from './config/env'
import './index.css'

const isElectron = !!window.electronAPI;
const Router = isElectron ? HashRouter : BrowserRouter;
const browserBasePath = getAppBasePath();
const routerProps = isElectron ? {} : { basename: browserBasePath || '/' };

if (isElectron) document.documentElement.dataset.electron = 'true';

if (!isElectron && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${browserBasePath || ''}/sw.js`);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <App />
    </Router>
  </React.StrictMode>,
)
