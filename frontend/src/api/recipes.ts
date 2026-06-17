import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Recipe, RecipeListItem, RecipeRequest, CameraSlot } from './types'

export function useRecipes(filmSimulation?: string, tag?: string, onlyFavorites?: boolean) {
  return useQuery({
    queryKey: ['recipes', filmSimulation, tag, onlyFavorites],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filmSimulation) params.set('filmSimulation', filmSimulation)
      if (tag) params.set('tag', tag)
      if (onlyFavorites) params.set('favorite', 'true')
      const { data } = await client.get<RecipeListItem[]>(`/recipes?${params}`)
      return data
    },
  })
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data } = await client.get<Recipe>(`/recipes/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCameraStatus() {
  return useQuery({
    queryKey: ['camera-status'],
    queryFn: async () => {
      const { data } = await client.get<RecipeListItem[]>('/recipes/camera-status')
      return data
    },
  })
}

export function useCreateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: RecipeRequest) => client.post<Recipe>('/recipes', req).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useUpdateRecipe(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: RecipeRequest) => client.put<Recipe>(`/recipes/${id}`, req).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useDeleteRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => client.delete(`/recipes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useAssignCameraSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, slot, force }: { id: string; slot: CameraSlot | null; force: boolean }) =>
      client.put(`/recipes/${id}/camera-slot`, { slot, force }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      qc.invalidateQueries({ queryKey: ['camera-status'] })
    },
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      client.put<Recipe>(`/recipes/${id}/favorite`, { favorite }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useUploadImage(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return client.post(`/recipes/${recipeId}/images`, form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', recipeId] }),
  })
}

export function useDeleteImage(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => client.delete(`/recipes/${recipeId}/images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', recipeId] }),
  })
}

export function useRecipesBulk(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['recipes', id] as const,
      queryFn: () => client.get<Recipe>(`/recipes/${id}`).then((r) => r.data),
      enabled: ids.length > 0,
    })),
  })
  const isLoading = results.some((r) => r.isLoading)
  const data = !isLoading && results.every((r) => r.data)
    ? results.map((r) => r.data as Recipe)
    : undefined
  return { data, isLoading }
}

export function useReorderImages(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      client.put(`/recipes/${recipeId}/images/order`, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', recipeId] }),
  })
}