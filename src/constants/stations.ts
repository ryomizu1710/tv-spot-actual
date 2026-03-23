import type { Region } from '../types'

export interface StationInfo {
  code: string
  name: string
  shortName: string
}

export const STATIONS: Record<Region, StationInfo[]> = {
  kanto: [
    { code: 'NTV', name: '日本テレビ', shortName: '日テレ' },
    { code: 'TBS', name: 'TBSテレビ', shortName: 'TBS' },
    { code: 'CX', name: 'フジテレビ', shortName: 'フジ' },
    { code: 'EX', name: 'テレビ朝日', shortName: 'テレ朝' },
    { code: 'TX', name: 'テレビ東京', shortName: 'テレ東' },
  ],
  kansai: [
    { code: 'YTV', name: '読売テレビ', shortName: '読売' },
    { code: 'MBS', name: '毎日放送', shortName: 'MBS' },
    { code: 'KTV', name: '関西テレビ', shortName: '関テレ' },
    { code: 'ABC', name: '朝日放送テレビ', shortName: 'ABC' },
    { code: 'TVO', name: 'テレビ大阪', shortName: 'テレ大' },
  ],
  nagoya: [
    { code: 'CTV', name: '中京テレビ', shortName: '中京' },
    { code: 'CBC', name: 'CBCテレビ', shortName: 'CBC' },
    { code: 'THK', name: '東海テレビ', shortName: '東海' },
    { code: 'NBN', name: '名古屋テレビ', shortName: 'メ~テレ' },
    { code: 'TVA', name: 'テレビ愛知', shortName: 'テレ愛' },
  ],
}

const nameToCodeMap = new Map<string, string>()
for (const stationList of Object.values(STATIONS)) {
  for (const station of stationList) {
    nameToCodeMap.set(station.name, station.code)
    nameToCodeMap.set(station.shortName, station.code)
    nameToCodeMap.set(station.code, station.code)
  }
}
// Extra aliases
nameToCodeMap.set('MBSテレビ', 'MBS')
nameToCodeMap.set('ABCテレビ', 'ABC')
nameToCodeMap.set('メ~テレ', 'NBN')
nameToCodeMap.set('メーテレ', 'NBN')

export function resolveStationCode(input: string): string | undefined {
  return nameToCodeMap.get(input.trim())
}

/**
 * 系列順の局コード並び (NTV系→TBS系→CX系→EX系→TX系)
 * 各エリアで共通の系列順
 */
export const STATION_SORT_ORDER: Record<string, number> = {
  // 関東
  NTV: 0, TBS: 1, CX: 2, EX: 3, TX: 4,
  // 関西
  YTV: 0, MBS: 1, KTV: 2, ABC: 3, TVO: 4,
  // 名古屋
  CTV: 0, CBC: 1, THK: 2, NBN: 3, TVA: 4,
}

export function getStationSortOrder(stationCode: string): number {
  return STATION_SORT_ORDER[stationCode] ?? 99
}
