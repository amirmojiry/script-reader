import type { Play } from '../../types'
import bazrasSourceJson from './bazras.json'

export const BAZRAS_BUNDLED_ID = 'builtin:gogol:bazras'

export const bazrasSource: Play = bazrasSourceJson as Play

export const bazrasPlay: Play = {
  ...bazrasSource,
  id: BAZRAS_BUNDLED_ID
}
