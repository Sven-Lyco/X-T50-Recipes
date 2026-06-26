import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Recipe, RecipeListItem, RecipeRequest, CameraSlot, ShootingScenario } from './types'

export function useRecipes(filmSimulation?: string, tag?: string, onlyFavorites?: boolean, scenario?: ShootingScenario) {
  return useQuery({
    queryKey: ['recipes', filmSimulation, tag, onlyFavorites, scenario],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filmSimulation) params.set('filmSimulation', filmSimulation)
      if (tag) params.set('tag', tag)
      if (onlyFavorites) params.set('favorite', 'true')
      if (scenario) params.set('scenario', scenario)
      const { data } = await client.get<RecipeListItem[]>(`/recipes?${params}`)
      return data
    },
  })
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipe', id],
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
      qc.invalidateQueries({ queryKey: ['recipe', id] })
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
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      qc.invalidateQueries({ queryKey: ['camera-status'] })
      qc.invalidateQueries({ queryKey: ['recipe', id] })
    },
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      client.put<Recipe>(`/recipes/${id}/favorite`, { favorite }).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      qc.invalidateQueries({ queryKey: ['recipe', id] })
    },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipe', recipeId] }),
  })
}

export function useDeleteImage(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => client.delete(`/recipes/${recipeId}/images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipe', recipeId] }),
  })
}

export function useRecipesBulk(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['recipe', id] as const,
      queryFn: () => client.get<Recipe>(`/recipes/${id}`).then((r) => r.data),
      enabled: ids.length > 0,
    })),
  })
  const isLoading = results.some((r) => r.isLoading)
  const data = !isLoading
    ? results.filter((r) => r.data !== undefined).map((r) => r.data as Recipe)
    : undefined
  return { data, isLoading }
}

export function useSuggestRecipe() {
  return useMutation({
    mutationFn: ({ images, description, model }: { images: File[]; description: string; model: string }) => {
      const fd = new FormData()
      images.forEach((img) => fd.append('images', img))
      fd.append('description', description)
      fd.append('model', model)
      return client.post<import('./types').RecipeRequest>('/suggest', fd).then((r) => r.data)
    },
  })
}

export function useDuplicateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => client.post<Recipe>(`/recipes/${id}/duplicate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useImportRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return client.post<Recipe>('/recipes/import', fd).then((r) => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}

export function useMatchRecipe() {
  return useMutation({
    mutationFn: ({ image, model, onlySlots }: { image: File; model?: string; onlySlots?: boolean }) => {
      const fd = new FormData()
      fd.append('image', image)
      if (model) fd.append('model', model)
      if (onlySlots) fd.append('onlySlots', 'true')
      return client.post<import('./types').RecipeMatchResult[]>('/match', fd).then((r) => r.data)
    },
  })
}

export function useReorderImages(recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      client.put(`/recipes/${recipeId}/images/order`, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipe', recipeId] }),
  })
}

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => client.get<{ available: boolean }>('/ai-status').then(r => r.data),
    staleTime: Infinity,
  })
}

export function useImportBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return client.post<Recipe[]>('/backup', fd).then(r => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
}