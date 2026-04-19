import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

const isElectron = !!window.electronAPI;
const Router = isElectron ? HashRouter : BrowserRouter;
const routerProps = isElectron ? {} : { basename: '/docwise' };

if (isElectron) document.documentElement.dataset.electron = 'true';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <App />
    </Router>
  </React.StrictMode>,
)
