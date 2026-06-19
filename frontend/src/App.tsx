import { Navigate, Route, Routes } from 'react-router-dom'
import { isLoggedIn } from './api/auth'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import LibraryPage from './pages/LibraryPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFormPage from './pages/RecipeFormPage'
import CameraDashboardPage from './pages/CameraDashboardPage'
import ReferencePage from './pages/ReferencePage'
import CompareSelectPage from './pages/CompareSelectPage'
import CompareResultPage from './pages/CompareResultPage'
import GenerateRecipePage from './pages/GenerateRecipePage'
import SimilarityMapPage from './pages/SimilarityMapPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<LibraryPage />} />
        <Route path="recipes/new" element={<RecipeFormPage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="recipes/:id/edit" element={<RecipeFormPage />} />
        <Route path="camera" element={<CameraDashboardPage />} />
        <Route path="reference" element={<ReferencePage />} />
        <Route path="compare" element={<CompareSelectPage />} />
        <Route path="compare/result" element={<CompareResultPage />} />
        <Route path="generate" element={<GenerateRecipePage />} />
        <Route path="map" element={<SimilarityMapPage />} />
      </Route>
    </Routes>
  )
}