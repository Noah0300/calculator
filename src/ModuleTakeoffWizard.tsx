import { useMemo, useState } from 'react'
import {
  DEMO_MODULES,
  calculateModuleQuote,
  calculateTakeoffResult,
  createQuoteLineFromModule,
} from './domain'
import type {
  ProjectSettings,
  QuoteLineInput,
  SurfaceScope,
  VatMode,
} from './domain'
import './ModuleTakeoffWizard.css'

type LineGrouping = 'MERGED' | 'PER_ROOM'
type MeasurementMode = 'FLOOR' | 'STUC' | 'ISOLATION' | 'SLOOP'

interface OpeningForm {
  id: string
  name: string
  width: string
  height: string
}

interface RoomForm {
  id: string
  name: string
  length: string
  width: string
  height: string
  openings: OpeningForm[]
}

interface SavedTakeoffDraft {
  id: string
  name: string
  moduleId: string
  scope: SurfaceScope
  measurementMode: MeasurementMode
  rooms: RoomForm[]
  cutLossPercent: string
  complexityFactor: string
  wasteFactor: string
  minimumCharge: string
  vatRate: string
  grouping: LineGrouping
  updatedAt: string
}

interface ModuleTakeoffWizardProps {
  currentUser: string
  projectSettings: ProjectSettings
  onAddQuoteLines: (lines: QuoteLineInput[]) => void
}

const getTakeoffStorageKey = (username: string) => `itemList_takeoffs_${username}`

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createEmptyRoom = (index: number): RoomForm => ({
  id: createId(),
  name: `Room ${index}`,
  length: '',
  width: '',
  height: '',
  openings: [],
})

const parsePositiveNumber = (value: string): number | null => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

const parseOptionalNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

const deriveMeasurementMode = (moduleId: string): MeasurementMode => {
  if (moduleId.includes('sloop')) {
    return 'SLOOP'
  }
  if (moduleId.includes('stucwerk')) {
    return 'STUC'
  }
  if (moduleId.includes('isolatie')) {
    return 'ISOLATION'
  }
  return 'FLOOR'
}

const deriveScopeFromState = (
  measurementMode: MeasurementMode,
  scope: SurfaceScope
): SurfaceScope => {
  if (measurementMode === 'FLOOR') {
    return 'FLOOR'
  }
  if (measurementMode === 'SLOOP') {
    return 'VOLUME'
  }
  return scope
}

const getDefaultScopeForMode = (mode: MeasurementMode): SurfaceScope => {
  if (mode === 'FLOOR') {
    return 'FLOOR'
  }
  if (mode === 'SLOOP') {
    return 'VOLUME'
  }
  if (mode === 'ISOLATION') {
    return 'WALLS'
  }
  return 'WALLS'
}

const loadTakeoffDrafts = (username: string): SavedTakeoffDraft[] => {
  try {
    const raw = localStorage.getItem(getTakeoffStorageKey(username))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as SavedTakeoffDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to load takeoff drafts:', error)
    return []
  }
}

export default function ModuleTakeoffWizard({
  currentUser,
  projectSettings,
  onAddQuoteLines,
}: ModuleTakeoffWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [moduleId, setModuleId] = useState<string>(DEMO_MODULES[0]?.id ?? '')
  const [scope, setScope] = useState<SurfaceScope>('BOTH')
  const [rooms, setRooms] = useState<RoomForm[]>([createEmptyRoom(1)])
  const [cutLossPercent, setCutLossPercent] = useState('0')
  const [complexityFactor, setComplexityFactor] = useState('1')
  const [wasteFactor, setWasteFactor] = useState('1')
  const [minimumCharge, setMinimumCharge] = useState('')
  const [vatRate, setVatRate] = useState(projectSettings.defaultVatRate.toString())
  const [grouping, setGrouping] = useState<LineGrouping>('MERGED')
  const [previewVatMode, setPreviewVatMode] = useState<VatMode>(projectSettings.vatMode)
  const [savedTakeoffs, setSavedTakeoffs] = useState<SavedTakeoffDraft[]>(() =>
    loadTakeoffDrafts(currentUser)
  )
  const [generalError, setGeneralError] = useState('')

  const measurementMode = useMemo(() => deriveMeasurementMode(moduleId), [moduleId])
  const selectedModule = useMemo(
    () => DEMO_MODULES.find(module => module.id === moduleId),
    [moduleId]
  )
  const activeScope = deriveScopeFromState(measurementMode, scope)
  const isBeton = moduleId.includes('betonvloer')
  const supportsCutLoss = measurementMode === 'FLOOR' && !isBeton
  const supportsWasteFactor = measurementMode !== 'SLOOP'
  const supportsOpenings = activeScope === 'WALLS'
  const quantityUnitLabel = selectedModule?.unitType === 'M3' ? 'm3' : 'm2'

  const persistTakeoffs = (next: SavedTakeoffDraft[]) => {
    setSavedTakeoffs(next)
    localStorage.setItem(getTakeoffStorageKey(currentUser), JSON.stringify(next))
  }

  const roomErrors = useMemo(() => {
    const errors: Record<string, string[]> = {}

    rooms.forEach(room => {
      const itemErrors: string[] = []

      if (activeScope === 'FLOOR' || activeScope === 'CEILING' || activeScope === 'VOLUME') {
        if (!parsePositiveNumber(room.length)) {
          itemErrors.push('Length must be > 0')
        }
      }
      if (!parsePositiveNumber(room.width)) {
        itemErrors.push(activeScope === 'WALLS' ? 'Wall width must be > 0' : 'Width must be > 0')
      }
      if ((activeScope === 'WALLS' || activeScope === 'VOLUME' || activeScope === 'BOTH') && !parsePositiveNumber(room.height)) {
        itemErrors.push('Height must be > 0 for wall calculations')
      }

      room.openings.forEach(opening => {
        const hasAnyValue =
          opening.width.trim().length > 0 ||
          opening.height.trim().length > 0 ||
          opening.name.trim().length > 0
        if (!hasAnyValue) {
          return
        }
        if (!parsePositiveNumber(opening.width) || !parsePositiveNumber(opening.height)) {
          itemErrors.push(`Opening "${opening.name || 'opening'}" must have width/height > 0`)
        }
      })

      if (itemErrors.length > 0) {
        errors[room.id] = itemErrors
      }
    })

    return errors
  }, [activeScope, rooms])

  const validRooms = useMemo(
    () =>
      rooms.flatMap(room => {
        const length = parsePositiveNumber(room.length)
        const width = parsePositiveNumber(room.width)
        const height = parsePositiveNumber(room.height) ?? 0
        if (!width) {
          return []
        }
        if ((activeScope === 'FLOOR' || activeScope === 'CEILING' || activeScope === 'VOLUME') && !length) {
          return []
        }
        if ((activeScope === 'WALLS' || activeScope === 'BOTH' || activeScope === 'VOLUME') && !height) {
          return []
        }

        const openings = room.openings.flatMap(opening => {
          const openingWidth = parsePositiveNumber(opening.width)
          const openingHeight = parsePositiveNumber(opening.height)
          if (!openingWidth || !openingHeight) {
            return []
          }
          return [
            {
              id: opening.id,
              name: opening.name || 'Opening',
              width: openingWidth,
              height: openingHeight,
            },
          ]
        })

        return [
          {
            id: room.id,
            name: room.name || 'Room',
            length: length ?? 1,
            width,
            height,
            openings,
          },
        ]
      }),
    [activeScope, rooms]
  )

  const parsedCutLossPercent = Math.max(0, parseOptionalNumber(cutLossPercent) ?? 0)
  const takeoffResult =
    validRooms.length > 0
      ? calculateTakeoffResult({
          rooms: validRooms,
          scope: activeScope,
          wastePercent: supportsCutLoss ? parsedCutLossPercent : 0,
        })
      : null

  const buildQuoteLinesFromTakeoff = (): QuoteLineInput[] => {
    const result = takeoffResult
    if (!result || !moduleId) {
      return []
    }

    const parsedComplexity = parseOptionalNumber(complexityFactor) ?? 1
    const parsedWaste = parseOptionalNumber(wasteFactor) ?? 1
    const parsedMinCharge = parseOptionalNumber(minimumCharge)
    const parsedVatRate = parseOptionalNumber(vatRate)
    const areaMultiplier = supportsCutLoss ? 1 + parsedCutLossPercent / 100 : 1

    if (grouping === 'MERGED') {
      const line = createQuoteLineFromModule(
        moduleId,
        result.totalArea,
        {
          description: `${DEMO_MODULES.find(m => m.id === moduleId)?.name ?? 'Module'} takeoff`,
          complexityFactor: parsedComplexity,
          wasteFactor: supportsWasteFactor ? parsedWaste : 1,
          minimumCharge: parsedMinCharge ?? undefined,
          vatRate: parsedVatRate ?? undefined,
        }
      )
      return line ? [line] : []
    }

    return result.roomSummaries.flatMap(room => {
      const line = createQuoteLineFromModule(moduleId, room.netArea * areaMultiplier, {
        description: `${DEMO_MODULES.find(m => m.id === moduleId)?.name ?? 'Module'} - ${room.roomName}`,
        complexityFactor: parsedComplexity,
        wasteFactor: supportsWasteFactor ? parsedWaste : 1,
        minimumCharge: parsedMinCharge ?? undefined,
        vatRate: parsedVatRate ?? undefined,
      })
      return line ? [line] : []
    })
  }

  const previewLines = buildQuoteLinesFromTakeoff()
  const previewQuote =
    previewLines.length > 0
      ? calculateModuleQuote({
          projectSettings: { ...projectSettings, vatMode: previewVatMode },
          lines: previewLines,
        })
      : null

  const canContinueFromStep2 =
    validRooms.length > 0 &&
    Object.keys(roomErrors).length === 0 &&
    (takeoffResult?.totalArea ?? 0) > 0

  const saveDraft = () => {
    const snapshot: SavedTakeoffDraft = {
      id: createId(),
      name: `${DEMO_MODULES.find(m => m.id === moduleId)?.name ?? 'Module'} ${new Date().toLocaleString()}`,
      moduleId,
      scope,
      measurementMode,
      rooms,
      cutLossPercent,
      complexityFactor,
      wasteFactor,
      minimumCharge,
      vatRate,
      grouping,
      updatedAt: new Date().toISOString(),
    }
    persistTakeoffs([snapshot, ...savedTakeoffs].slice(0, 20))
  }

  const loadDraft = (draft: SavedTakeoffDraft) => {
    setModuleId(draft.moduleId)
    setScope(draft.scope)
    setRooms(draft.rooms)
    setCutLossPercent(draft.cutLossPercent)
    setComplexityFactor(draft.complexityFactor)
    setWasteFactor(draft.wasteFactor)
    setMinimumCharge(draft.minimumCharge)
    setVatRate(draft.vatRate)
    setGrouping(draft.grouping)
    setStep(2)
  }

  const deleteDraft = (draftId: string) => {
    persistTakeoffs(savedTakeoffs.filter(draft => draft.id !== draftId))
  }

  const handleAddToQuote = () => {
    if (previewLines.length === 0) {
      setGeneralError('No valid takeoff lines to add.')
      return
    }
    onAddQuoteLines(previewLines)
    setGeneralError('')
    setStep(1)
    setRooms([createEmptyRoom(1)])
  }

  return (
    <div className="takeoff-card">
      <div className="takeoff-header">
        <h2>Nieuwe Module Berekening</h2>
        <p>Meet ruimtes, bereken automatisch m2 en voeg direct toe aan je offerte.</p>
      </div>

      <div className="takeoff-steps">
        {[1, 2, 3, 4].map(stepNumber => (
          <button
            key={stepNumber}
            type="button"
            className={`step-pill ${step === stepNumber ? 'active' : ''}`}
            onClick={() => setStep(stepNumber as 1 | 2 | 3 | 4)}
          >
            Step {stepNumber}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section>
          <label className="field-label" htmlFor="module-select">Kies module</label>
          <select
            id="module-select"
            data-testid="takeoff-module-select"
            value={moduleId}
            onChange={event => {
              const nextModuleId = event.target.value
              const nextMode = deriveMeasurementMode(nextModuleId)
              setModuleId(nextModuleId)
              setScope(getDefaultScopeForMode(nextMode))
            }}
          >
            {DEMO_MODULES.map(module => (
              <option key={module.id} value={module.id}>
              {module.name} ({module.unitType})
            </option>
          ))}
          </select>
          <div className="step-actions">
            <button type="button" className="primary-btn" onClick={() => setStep(2)}>
              Volgende: Meten
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <div className="scope-row">
            <span className="field-label">Meetmethode</span>
            {(measurementMode === 'STUC' || measurementMode === 'ISOLATION') && (
              <select value={scope} onChange={event => setScope(event.target.value as SurfaceScope)}>
                {measurementMode === 'STUC' && (
                  <>
                    <option value="WALLS">Wanden</option>
                    <option value="CEILING">Plafond</option>
                  </>
                )}
                {measurementMode === 'ISOLATION' && (
                  <>
                    <option value="FLOOR">Vloer</option>
                    <option value="WALLS">Wanden</option>
                    <option value="CEILING">Plafond</option>
                  </>
                )}
              </select>
            )}
            {supportsCutLoss && (
              <label>
                Snijverlies (%)
                <input
                  data-testid="cut-loss-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={cutLossPercent}
                  onChange={event => setCutLossPercent(event.target.value)}
                />
              </label>
            )}
          </div>

          <div className="rooms-toolbar">
            <button
              type="button"
              onClick={() => setRooms(prev => [...prev, createEmptyRoom(prev.length + 1)])}
            >
              + Ruimte toevoegen
            </button>
          </div>

          {rooms.map((room, roomIndex) => (
            <div className="room-card" key={room.id} data-testid={`room-${roomIndex}`}>
              <div className="room-header">
                <input
                  type="text"
                  value={room.name}
                  onChange={event =>
                    setRooms(prev =>
                      prev.map(item =>
                        item.id === room.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                />
                <div className="room-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setRooms(prev => [
                        ...prev,
                        {
                          ...room,
                          id: createId(),
                          name: `${room.name} kopie`,
                          openings: room.openings.map(opening => ({
                            ...opening,
                            id: createId(),
                          })),
                        },
                      ])
                    }
                  >
                    Dupliceer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRooms(prev => prev.filter(item => item.id !== room.id))}
                    disabled={rooms.length === 1}
                  >
                    Verwijder
                  </button>
                </div>
              </div>

              <div className="room-grid">
                {(activeScope === 'FLOOR' || activeScope === 'CEILING' || activeScope === 'VOLUME') && (
                  <label>
                    Lengte (m)
                    <input
                      data-testid={`room-length-${roomIndex}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={room.length}
                      onChange={event =>
                        setRooms(prev =>
                          prev.map(item =>
                            item.id === room.id ? { ...item, length: event.target.value } : item
                          )
                        )
                      }
                    />
                  </label>
                )}
                <label>
                  {activeScope === 'WALLS' ? 'Breedte wand (m)' : 'Breedte (m)'}
                  <input
                    data-testid={`room-width-${roomIndex}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={room.width}
                    onChange={event =>
                      setRooms(prev =>
                        prev.map(item =>
                          item.id === room.id ? { ...item, width: event.target.value } : item
                        )
                      )
                    }
                  />
                </label>
                {(activeScope === 'WALLS' || activeScope === 'VOLUME' || activeScope === 'BOTH') && (
                  <label>
                    Hoogte (m)
                    <input
                      data-testid={`room-height-${roomIndex}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={room.height}
                      onChange={event =>
                        setRooms(prev =>
                          prev.map(item =>
                            item.id === room.id ? { ...item, height: event.target.value } : item
                          )
                        )
                      }
                    />
                  </label>
                )}
              </div>

              {supportsOpenings && (
                <div className="openings-section">
                  <div className="openings-header">
                    <strong>Openingen (ramen/deuren)</strong>
                    <button
                      type="button"
                      onClick={() =>
                        setRooms(prev =>
                          prev.map(item =>
                            item.id === room.id
                              ? {
                                  ...item,
                                  openings: [
                                    ...item.openings,
                                    {
                                      id: createId(),
                                      name: `Opening ${item.openings.length + 1}`,
                                      width: '',
                                      height: '',
                                    },
                                  ],
                                }
                              : item
                          )
                        )
                      }
                    >
                      + Opening
                    </button>
                  </div>
                  {room.openings.map((opening, openingIndex) => (
                    <div className="opening-row" key={opening.id}>
                      <input
                        type="text"
                        value={opening.name}
                        onChange={event =>
                          setRooms(prev =>
                            prev.map(item =>
                              item.id === room.id
                                ? {
                                    ...item,
                                    openings: item.openings.map(entry =>
                                      entry.id === opening.id
                                        ? { ...entry, name: event.target.value }
                                        : entry
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <input
                        data-testid={`opening-width-${roomIndex}-${openingIndex}`}
                        type="number"
                        placeholder="Breedte"
                        value={opening.width}
                        onChange={event =>
                          setRooms(prev =>
                            prev.map(item =>
                              item.id === room.id
                                ? {
                                    ...item,
                                    openings: item.openings.map(entry =>
                                      entry.id === opening.id
                                        ? { ...entry, width: event.target.value }
                                        : entry
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <input
                        data-testid={`opening-height-${roomIndex}-${openingIndex}`}
                        type="number"
                        placeholder="Hoogte"
                        value={opening.height}
                        onChange={event =>
                          setRooms(prev =>
                            prev.map(item =>
                              item.id === room.id
                                ? {
                                    ...item,
                                    openings: item.openings.map(entry =>
                                      entry.id === opening.id
                                        ? { ...entry, height: event.target.value }
                                        : entry
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRooms(prev =>
                            prev.map(item =>
                              item.id === room.id
                                ? {
                                    ...item,
                                    openings: item.openings.filter(entry => entry.id !== opening.id),
                                  }
                                : item
                            )
                          )
                        }
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {roomErrors[room.id] && (
                <ul className="room-errors">
                  {roomErrors[room.id].map(error => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="takeoff-summary">
            <h4>Takeoff Summary</h4>
            {takeoffResult ? (
              <>
                {takeoffResult.roomSummaries.map(room => (
                  <div key={room.roomId} className="summary-row">
                    <span>{room.roomName}</span>
                    <span>{room.netArea.toFixed(2)} {quantityUnitLabel}</span>
                  </div>
                ))}
                <div className="summary-row total">
                  <span>Totaal</span>
                  <span data-testid="takeoff-total-area">{takeoffResult.totalArea.toFixed(2)} {quantityUnitLabel}</span>
                </div>
              </>
            ) : (
              <p>Vul minimaal een geldige ruimte in om de oppervlakte te berekenen.</p>
            )}
          </div>

          <div className="step-actions">
            <button type="button" onClick={saveDraft}>Concept opslaan</button>
            <button type="button" onClick={() => setStep(1)}>Terug</button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setStep(3)}
              disabled={!canContinueFromStep2}
            >
              Volgende: Parameters
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <div className="room-grid">
            <label>
              Complexity factor
              <input
                type="number"
                value={complexityFactor}
                onChange={event => setComplexityFactor(event.target.value)}
                min="0.1"
                step="0.01"
              />
            </label>
            {supportsWasteFactor && (
              <label>
                Waste factor
                <input
                  type="number"
                  value={wasteFactor}
                  onChange={event => setWasteFactor(event.target.value)}
                  min="1"
                  step="0.01"
                />
              </label>
            )}
            <label>
              Minimum charge override (EUR)
              <input
                type="number"
                value={minimumCharge}
                onChange={event => setMinimumCharge(event.target.value)}
                min="0"
                step="0.01"
              />
            </label>
            <label>
              BTW-tarief (%)
              <input
                type="number"
                value={vatRate}
                onChange={event => setVatRate(event.target.value)}
                min="0"
                step="0.01"
              />
            </label>
            <label>
              Quote line output
              <select
                value={grouping}
                onChange={event => setGrouping(event.target.value as LineGrouping)}
              >
                <option value="MERGED">1 samengevoegde regel</option>
                <option value="PER_ROOM">Per ruimte aparte regel</option>
              </select>
            </label>
          </div>

          <div className="step-actions">
            <button type="button" onClick={() => setStep(2)}>Terug</button>
            <button type="button" className="primary-btn" onClick={() => setStep(4)}>
              Volgende: Preview
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <div className="scope-row">
            <label>
              Totaal tonen als
              <select
                value={previewVatMode}
                onChange={event => setPreviewVatMode(event.target.value as VatMode)}
              >
                <option value="EXCL">Excl. BTW</option>
                <option value="INCL">Incl. BTW</option>
              </select>
            </label>
          </div>

          {previewQuote ? (
            <>
              <div className="preview-table">
                {previewQuote.lines.map(line => (
                  <div className="summary-row" key={line.id}>
                    <span>{line.description}</span>
                    <span>{line.quantity.toFixed(2)} {line.unitType === 'M3' ? 'm3' : 'm2'}</span>
                    <span>EUR {line.totalExVat.toFixed(2)} excl.</span>
                  </div>
                ))}
              </div>
              <div className="preview-totals">
                <p>Subtotaal excl. BTW: EUR {previewQuote.totalsExVat.toFixed(2)}</p>
                <p>BTW: EUR {previewQuote.vatAmount.toFixed(2)}</p>
                <p><strong>Totaal incl. BTW: EUR {previewQuote.totalsIncVat.toFixed(2)}</strong></p>
                <p><strong>Display total: EUR {previewQuote.displayTotal.toFixed(2)}</strong></p>
              </div>
              {previewQuote.warnings.length > 0 && (
                <ul className="room-errors">
                  {previewQuote.warnings.map(warning => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>Geen preview beschikbaar. Controleer de metingen.</p>
          )}

          {generalError && <p className="error-text">{generalError}</p>}
          <div className="step-actions">
            <button type="button" onClick={() => setStep(3)}>Terug</button>
            <button
              type="button"
              data-testid="add-to-quote-btn"
              className="primary-btn"
              onClick={handleAddToQuote}
            >
              Add to Quote
            </button>
          </div>
        </section>
      )}

      <div className="saved-takeoffs">
        <h4>Opgeslagen concepten ({savedTakeoffs.length})</h4>
        {savedTakeoffs.length === 0 && <p>Nog geen concepten opgeslagen.</p>}
        {savedTakeoffs.map(draft => (
          <div key={draft.id} className="summary-row">
            <span>{draft.name}</span>
            <div className="room-actions">
              <button type="button" onClick={() => loadDraft(draft)}>Laden</button>
              <button type="button" onClick={() => deleteDraft(draft.id)}>Verwijderen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
