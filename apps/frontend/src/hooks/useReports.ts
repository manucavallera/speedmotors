// @file: useReports.ts | Query y estado de rango para ReportsPage. Un solo endpoint /reports/full.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { getDefaultRange, PRESET_RANGES } from '../lib/reports/presets'

export function useReports() {
  const [range, setRange] = useState(getDefaultRange())
  const [activePreset, setActivePreset] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['reports-full', range.from, range.to],
    queryFn: () => api.get(`/reports/full?from=${range.from}&to=${range.to}`).then(r => r.data),
  })

  function applyPreset(i: number) {
    setActivePreset(i)
    setRange(PRESET_RANGES[i].getValue())
  }

  return { data, isLoading, range, setRange, activePreset, setActivePreset, applyPreset }
}
