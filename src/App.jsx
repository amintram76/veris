import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ToolsPage from './pages/ToolsPage'
import ArticlesPage from './pages/ArticlesPage'
import AboutPage from './pages/AboutPage'
import GetSupportPage from './pages/GetSupportPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="get-support" element={<GetSupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
