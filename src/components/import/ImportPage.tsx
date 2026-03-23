import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, Target, BarChart3, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignStore } from '../../stores/campaign-store'
import { useSpotStore } from '../../stores/spot-store'
import { parseSharestFile, type SharestParseResult } from '../../lib/parsers/sharest-parser'
import { getSpotPlanSheets, parseSpotPlanFile, type SpotPlanSheet } from '../../lib/parsers/spot-plan-parser'
import {
  parseIclimaxFile,
  readIclimaxColumnHeaders,
  ICLIMAX_TRP_COLUMNS,
  type IclimaxTrpColumn,
  type IclimaxColumnHeader,
  type IclimaxParseResult,
} from '../../lib/parsers/iclimax-parser'
import { REGION_LABELS } from '../../constants'
import { generateSharestFiles, SHAREST_TG_OPTIONS } from '../../lib/exporters/sharest-exporter'
import type { ImportBatch, StationTarget } from '../../types'

export function ImportPage() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const addSpots = useSpotStore((s) => s.addSpots)
  const deleteSpotsByCampaign = useSpotStore((s) => s.deleteSpotsByCampaign)
  const addImportBatch = useSpotStore((s) => s.addImportBatch)
  const setStationTargets = useSpotStore((s) => s.setStationTargets)
  const setRegionTargetTrps = useSpotStore((s) => s.setRegionTargetTrps)
  const setIclimaxData = useSpotStore((s) => s.setIclimaxData)
  const getCampaignData = useSpotStore((s) => s.getCampaignData)

  const [campaignId, setCampaignId] = useState('')

  // Sharest files
  const [sharestFiles, setSharestFiles] = useState<File[]>([])
  const [sharestResults, setSharestResults] = useState<SharestParseResult[]>([])
  const [sharestImporting, setSharestImporting] = useState(false)
  const [sharestDone, setSharestDone] = useState(false)

  // SPOTプラン file
  const [spotPlanFile, setSpotPlanFile] = useState<File | null>(null)
  const [spotPlanSheets, setSpotPlanSheets] = useState<SpotPlanSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [spotPlanTargets, setSpotPlanTargets] = useState<StationTarget[]>([])
  const [spotPlanDone, setSpotPlanDone] = useState(false)

  // iClimax file
  const [iclimaxFile, setIclimaxFile] = useState<File | null>(null)
  const [iclimaxTrpColumn, setIclimaxTrpColumn] = useState<IclimaxTrpColumn>('X')
  const [iclimaxColumnHeaders, setIclimaxColumnHeaders] = useState<IclimaxColumnHeader[]>([])
  const [iclimaxSelectedColIdx, setIclimaxSelectedColIdx] = useState<number | null>(null)
  const [iclimaxResult, setIclimaxResult] = useState<IclimaxParseResult | null>(null)
  const [iclimaxImporting, setIclimaxImporting] = useState(false)
  const [iclimaxDone, setIclimaxDone] = useState(false)

  // Sharest フォーマット作成
  const [sharestTg, setSharestTg] = useState(SHAREST_TG_OPTIONS[0])
  const [sharestExporting, setSharestExporting] = useState(false)

  // --- Sharest handlers ---
  const handleSharestFilesSelect = (files: FileList | null) => {
    if (!files) return
    setSharestFiles(Array.from(files))
    setSharestResults([])
    setSharestDone(false)
  }

  const handleSharestImport = async () => {
    if (!campaignId) { toast.error('キャンペーンを選択してください'); return }
    if (sharestFiles.length === 0) { toast.error('Sharestファイルを選択してください'); return }

    setSharestImporting(true)
    const results: SharestParseResult[] = []

    // 同キャンペーンの既存データを削除（追加ではなく置換）
    deleteSpotsByCampaign(campaignId)

    for (const file of sharestFiles) {
      try {
        const batchId = uuidv4()
        const result = await parseSharestFile(file, campaignId, batchId)
        results.push(result)

        // ストアに追加
        addSpots(result.spots)
        const batch: ImportBatch = {
          id: batchId,
          campaignId,
          region: result.region,
          fileName: file.name,
          fileType: 'xlsx',
          importedAt: new Date().toISOString(),
          rowCount: result.rowCount,
          successCount: result.spots.length,
          errorCount: result.errorCount,
          errors: result.errors.map((msg, i) => ({
            rowIndex: i, columnName: '', value: '', message: msg,
          })),
          columnMapping: {
            stationName: 'Col5', broadcastDate: 'Col6', broadcastTime: 'Col8',
            programName: 'Col10', creativeName: 'Col15', creativeLength: 'Col12',
            householdRating: 'Col16', individualRating: 'Col17',
          },
        }
        addImportBatch(batch)
      } catch (err) {
        results.push({
          region: 'kanto',
          spots: [],
          rowCount: 0,
          errorCount: 1,
          errors: [`${file.name}: ${err instanceof Error ? err.message : '読込エラー'}`],
        })
      }
    }

    setSharestResults(results)
    setSharestImporting(false)
    setSharestDone(true)

    const totalSpots = results.reduce((s, r) => s + r.spots.length, 0)
    toast.success(`${totalSpots}件のスポットデータをインポートしました`)
  }

  // --- SPOTプラン handlers ---
  const handleSpotPlanSelect = async (file: File) => {
    setSpotPlanFile(file)
    setSpotPlanDone(false)
    try {
      const sheets = await getSpotPlanSheets(file)
      setSpotPlanSheets(sheets)
      if (sheets.length > 0) setSelectedSheet(sheets[0].name)
    } catch {
      toast.error('SPOTプランファイルの読込に失敗しました')
    }
  }

  const handleSpotPlanImport = async () => {
    if (!campaignId) { toast.error('キャンペーンを選択してください'); return }
    if (!spotPlanFile || !selectedSheet) return
    try {
      const result = await parseSpotPlanFile(spotPlanFile, selectedSheet)
      if (result.targets.length === 0) {
        toast.error('局別目標データが見つかりませんでした')
        return
      }
      setSpotPlanTargets(result.targets)
      setStationTargets(campaignId, result.targets)
      setRegionTargetTrps(campaignId, result.regionTargetTrps)
      setSpotPlanDone(true)
      toast.success(`${result.targets.length}局の発注PRP目標を読み込みました`)
    } catch (err) {
      toast.error(`読込エラー: ${err instanceof Error ? err.message : '不明'}`)
    }
  }

  // --- iClimax handlers ---
  const handleIclimaxFileSelect = async (file: File) => {
    setIclimaxFile(file)
    setIclimaxDone(false)
    setIclimaxResult(null)
    setIclimaxColumnHeaders([])
    setIclimaxSelectedColIdx(null)
    try {
      const headers = await readIclimaxColumnHeaders(file)
      setIclimaxColumnHeaders(headers)
      if (headers.length > 0) {
        setIclimaxSelectedColIdx(headers[0].columnIndex)
      }
    } catch {
      toast.error('iClimaxファイルのヘッダー読込に失敗しました')
    }
  }

  const handleSharestExport = async () => {
    if (!iclimaxFile) { toast.error('iClimaxファイルを先に選択してください'); return }
    setSharestExporting(true)
    try {
      const results = await generateSharestFiles(iclimaxFile, sharestTg)
      if (results.length === 0) {
        toast.error('エリアデータが見つかりませんでした')
        setSharestExporting(false)
        return
      }
      for (const r of results) {
        const url = URL.createObjectURL(r.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = r.fileName
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`${results.length}エリアのSharestフォーマットを出力しました（TG: ${sharestTg}）`)
    } catch (err) {
      toast.error(`出力エラー: ${err instanceof Error ? err.message : '不明'}`)
    }
    setSharestExporting(false)
  }

  const handleIclimaxImport = async () => {
    if (!campaignId) { toast.error('キャンペーンを選択してください'); return }
    if (!iclimaxFile) { toast.error('iClimaxファイルを選択してください'); return }
    setIclimaxImporting(true)
    try {
      const result = await parseIclimaxFile(iclimaxFile, iclimaxTrpColumn, iclimaxSelectedColIdx ?? undefined)
      if (result.stationData.length === 0) {
        toast.error('局別データが見つかりませんでした')
        setIclimaxImporting(false)
        return
      }
      setIclimaxResult(result)
      setIclimaxData(campaignId, result.stationData, result.regionData, result.dailyPrpData, result.wptStationData, result.wptRegionData)
      setIclimaxDone(true)
      const selectedHeader = iclimaxColumnHeaders.find(h => h.columnIndex === iclimaxSelectedColIdx)
      const colLabel = selectedHeader
        ? `${selectedHeader.columnLetter}列 — ${selectedHeader.label}`
        : ICLIMAX_TRP_COLUMNS.find(c => c.value === iclimaxTrpColumn)?.label ?? ''
      toast.success(`${result.stationData.length}局の発注TRP・Prime PRPを読み込みました（${colLabel}）`)
    } catch (err) {
      toast.error(`読込エラー: ${err instanceof Error ? err.message : '不明'}`)
    }
    setIclimaxImporting(false)
  }

  const reset = () => {
    setSharestFiles([])
    setSharestResults([])
    setSharestDone(false)
    setSpotPlanFile(null)
    setSpotPlanSheets([])
    setSelectedSheet('')
    setSpotPlanTargets([])
    setSpotPlanDone(false)
    setIclimaxFile(null)
    setIclimaxColumnHeaders([])
    setIclimaxSelectedColIdx(null)
    setIclimaxResult(null)
    setIclimaxDone(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">データ取込</h1>

      {/* キャンペーン選択 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">キャンペーン *</label>
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">選択してください</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* セクション1: SPOTプラン（目標値）*/}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target size={18} className="text-prime" />
          <h2 className="text-sm font-bold text-gray-800">SPOTプラン（発注PRP目標）</h2>
          {(spotPlanDone || (campaignId && getCampaignData(campaignId).stationTargets.length > 0)) && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {spotPlanDone ? spotPlanTargets.length : getCampaignData(campaignId).stationTargets.length}局 読込済
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-gray-500">
          「SPOTプラン」ExcelのH列（発注GRP ※PRP）を局別アクチュアルの分母として使用します
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">ファイル選択</label>
            <label className="flex cursor-pointer items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
              <FileSpreadsheet size={14} className="text-gray-400" />
              {spotPlanFile ? spotPlanFile.name : 'SPOTプラン.xlsxを選択...'}
              <input type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleSpotPlanSelect(e.target.files[0])} />
            </label>
          </div>
          {spotPlanSheets.length > 0 && (
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">シート選択</label>
              <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {spotPlanSheets.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleSpotPlanImport}
            disabled={!spotPlanFile || !selectedSheet}
            className="rounded-lg bg-amazon px-4 py-2 text-sm font-medium text-white hover:bg-amazon-light disabled:opacity-40">
            読込
          </button>
        </div>

        {/* 読込結果 */}
        {spotPlanDone && spotPlanTargets.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-2 py-1 text-left">地域</th>
                  <th className="px-2 py-1 text-left">局</th>
                  <th className="px-2 py-1 text-right">発注PRP</th>
                </tr>
              </thead>
              <tbody>
                {spotPlanTargets.map((t, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-2 py-1">{REGION_LABELS[t.region]}</td>
                    <td className="px-2 py-1">{t.stationCode}</td>
                    <td className="px-2 py-1 text-right font-mono">{t.targetPrp.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* セクション2: iClimaxローデータ（発注TRP・Prime PRP）*/}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-prime" />
          <h2 className="text-sm font-bold text-gray-800">iClimaxローデータ（発注TRP・Prime PRP）</h2>
          {(iclimaxDone || (campaignId && getCampaignData(campaignId).iclimaxStationData.length > 0)) && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {iclimaxDone && iclimaxResult ? iclimaxResult.stationData.length : (campaignId ? getCampaignData(campaignId).iclimaxStationData.length : 0)}局 読込済
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-gray-500">
          iClimaxローデータExcelから局別の「発注TRP」と「Prime PRP」を読み込みます。TRP参照列はキャンペーンに合わせて選択してください。
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">ファイル選択</label>
            <label className="flex cursor-pointer items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
              <FileSpreadsheet size={14} className="text-gray-400" />
              {iclimaxFile ? iclimaxFile.name : 'iClimaxローデータ.xlsxを選択...'}
              <input type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleIclimaxFileSelect(e.target.files[0]) }} />
            </label>
          </div>
          {iclimaxColumnHeaders.length > 0 && (
            <div className="w-64">
              <label className="mb-1 block text-xs text-gray-500">TRP参照列</label>
              <select
                value={iclimaxSelectedColIdx ?? ''}
                onChange={(e) => setIclimaxSelectedColIdx(Number(e.target.value))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {iclimaxColumnHeaders.map((h) => (
                  <option key={h.columnIndex} value={h.columnIndex}>
                    {h.columnLetter}列 — {h.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {iclimaxFile && iclimaxColumnHeaders.length === 0 && (
            <div className="w-56">
              <label className="mb-1 block text-xs text-gray-500">TRP参照列</label>
              <select value={iclimaxTrpColumn} onChange={(e) => setIclimaxTrpColumn(e.target.value as IclimaxTrpColumn)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                {ICLIMAX_TRP_COLUMNS.map((col) => (
                  <option key={col.value} value={col.value}>{col.label}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleIclimaxImport}
            disabled={!iclimaxFile || iclimaxImporting}
            className="rounded-lg bg-amazon px-4 py-2 text-sm font-medium text-white hover:bg-amazon-light disabled:opacity-40">
            {iclimaxImporting ? '読込中...' : '読込'}
          </button>
        </div>

        {/* 読込結果 */}
        {iclimaxDone && iclimaxResult && (
          <div className="mt-3 overflow-x-auto">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-500" />
              <span>{iclimaxResult.totalRows}行中 {iclimaxResult.stationData.length}局を集計</span>
              {iclimaxResult.errorCount > 0 && (
                <span className="text-yellow-600">（{iclimaxResult.errorCount}件エラー）</span>
              )}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-2 py-1 text-left">地域</th>
                  <th className="px-2 py-1 text-left">局</th>
                  <th className="px-2 py-1 text-right">発注TRP</th>
                  <th className="px-2 py-1 text-right">Prime PRP</th>
                  <th className="px-2 py-1 text-right">本数</th>
                </tr>
              </thead>
              <tbody>
                {iclimaxResult.stationData.map((sd, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-2 py-1">{REGION_LABELS[sd.region]}</td>
                    <td className="px-2 py-1">{sd.stationCode}</td>
                    <td className="px-2 py-1 text-right font-mono">{sd.targetTrp.toFixed(1)}</td>
                    <td className="px-2 py-1 text-right font-mono">{sd.primePrp.toFixed(1)}</td>
                    <td className="px-2 py-1 text-right font-mono">{sd.spotCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sharest用フォーマット作成 */}
        <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Download size={16} className="text-teal-600" />
              <h3 className="text-sm font-bold text-gray-800">Sharest用フォーマット作成</h3>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              上記iClimaxファイルからSharest用のExcelを関東・関西・名古屋ごとに出力します。Q・R・S列は空欄で出力されます。
            </p>
            <div className="flex items-end gap-3">
              <div className="w-64">
                <label className="mb-1 block text-xs text-gray-500">TG（S列ヘッダー）</label>
                <select
                  value={sharestTg}
                  onChange={(e) => setSharestTg(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  {SHAREST_TG_OPTIONS.map((tg) => (
                    <option key={tg} value={tg}>{tg}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleSharestExport}
                disabled={!iclimaxFile || sharestExporting}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40">
                <Download size={14} />
                {sharestExporting ? '出力中...' : 'フォーマット出力'}
              </button>
            </div>
          </div>
      </div>

      {/* セクション3: Sharest（実績データ）*/}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Upload size={18} className="text-prime" />
          <h2 className="text-sm font-bold text-gray-800">Sharest（実績データ）</h2>
          {sharestDone && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              インポート済
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-gray-500">
          関東・関西・名古屋のSharestファイルを選択してください（複数選択可）。地域はシート名・ファイル名から自動判定します。
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">ファイル選択（複数可）</label>
            <label className="flex cursor-pointer items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
              <FileSpreadsheet size={14} className="text-gray-400" />
              {sharestFiles.length > 0
                ? `${sharestFiles.length}ファイル選択中`
                : 'Sharestファイルを選択...'}
              <input type="file" accept=".xlsx,.xls" multiple className="hidden"
                onChange={(e) => handleSharestFilesSelect(e.target.files)} />
            </label>
          </div>
          <button onClick={handleSharestImport}
            disabled={sharestFiles.length === 0 || sharestImporting}
            className="rounded-lg bg-prime px-4 py-2 text-sm font-medium text-white hover:bg-prime-dark disabled:opacity-40">
            {sharestImporting ? '読込中...' : 'インポート'}
          </button>
        </div>

        {/* 選択ファイル一覧 */}
        {sharestFiles.length > 0 && !sharestDone && (
          <div className="mt-2 space-y-1">
            {sharestFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <FileSpreadsheet size={12} /> {f.name}
              </div>
            ))}
          </div>
        )}

        {/* インポート結果 */}
        {sharestDone && sharestResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {sharestResults.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg p-3 text-sm ${
                r.errorCount === 0 ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                {r.errorCount === 0
                  ? <CheckCircle size={16} className="text-green-500" />
                  : <AlertCircle size={16} className="text-yellow-500" />}
                <div>
                  <span className="font-medium">{REGION_LABELS[r.region]}</span>
                  <span className="ml-2 text-gray-500">
                    {r.spots.length}件成功
                    {r.errorCount > 0 && ` / ${r.errorCount}件エラー`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* リセット */}
      {(sharestDone || spotPlanDone || iclimaxDone) && (
        <div className="text-center">
          <button onClick={reset}
            className="text-sm text-prime hover:underline">
            別のファイルを取り込む
          </button>
        </div>
      )}
    </div>
  )
}
