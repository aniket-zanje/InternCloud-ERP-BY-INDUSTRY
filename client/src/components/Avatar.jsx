import { assetUrl } from '../api/client'
import { initials } from '../utils/format'

/** Photo if the user uploaded one, otherwise initials (same as the demo) */
export default function Avatar({ photo, name }) {
  return photo ? <img src={assetUrl(photo)} alt="" /> : <>{initials(name)}</>
}
