import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import store from './store'
import { SiteAssetsProvider } from './components/SiteAssetsProvider'
import { SiteContentProvider } from './components/SiteContentProvider'
import AuthBootstrap from './components/AuthBootstrap'
import CartBootstrap from './components/CartBootstrap'
import RecentlyViewedBootstrap from './components/RecentlyViewedBootstrap'
import { TaxonomyProvider } from './components/TaxonomyProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <TaxonomyProvider>
        <SiteContentProvider>
          <SiteAssetsProvider>
            <AuthBootstrap />
            <CartBootstrap />
            <RecentlyViewedBootstrap />
            <App />
          </SiteAssetsProvider>
        </SiteContentProvider>
      </TaxonomyProvider>
    </Provider>
  </StrictMode>,
)
