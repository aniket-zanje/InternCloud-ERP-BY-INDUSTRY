import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, assetUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { InternProvider, useIntern } from '../context/InternContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { durationInfo, fmt } from '../utils/format'

const VIEWS = [
  ['/intern', 'Dashboard', 'home', true],
  ['/intern/virtual-id', 'Virtual ID', 'id'],
  ['/intern/tasks', 'Tasks', 'task'],
  ['/intern/attendance', 'Attendance', 'cal'],
  ['/intern/score', 'AI Score', 'score'],
  ['/intern/certificate', 'E-Certificate', 'award'],
]

function Shell() {
  const { profile, setPhoto } = useIntern()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const toast = useToast()
  const [sideOpen, setSideOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const fileRef = useRef(null)

  const { user, intern, organization, virtualId, mentor, pendingTasks } = profile

  // close the mobile drawer + jump to top on every page change
  useEffect(() => {
    setSideOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  const onPhoto = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast('Please choose an image under 2 MB', 'error')
    const form = new FormData()
    form.append('photo', file)
    try {
      const { photo } = await api.put('/intern/profile/photo', { form })
      setPhoto(photo)
      toast('Profile photo updated')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const confirmLogout = () => {
    logout()
    navigate('/signed-out', { replace: true })
  }

  return (
    <div className="app">
      <aside className={`side ${sideOpen ? 'open' : ''}`} id="side">
        <div className="logo">
          <b>
            {organization.logo ? <img src={assetUrl(organization.logo)} alt="" /> : organization.name[0]}
          </b>{' '}
          {organization.name}
        </div>
        <small>Menu</small>
        <div id="nav">
          {VIEWS.map(([to, label, icon, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`}>
              <Icon name={icon} /> {label}
              {to.endsWith('/tasks') && pendingTasks > 0 && <i>{pendingTasks}</i>}
            </NavLink>
          ))}
        </div>
        <div className="help">
          <b>Need help?</b>Reach out to your mentor or the support desk for any queries.
        </div>
      </aside>
      <div className={`scrim ${sideOpen ? 'on' : ''}`} onClick={() => setSideOpen(false)} />

      <div className="main">
        <header className="top">
          <button className="burger" aria-label="Open menu" onClick={() => setSideOpen(true)}>
            <Icon name="menu" />
          </button>
          <div
            className="av"
            title="Click to change photo"
            tabIndex={0}
            role="button"
            aria-label="Change profile photo"
            onClick={() => fileRef.current.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current.click()}
          >
            <Avatar photo={user.photo} name={user.fullName} />
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onPhoto} />
          <div className="who">
            <h1>{user.fullName}</h1>
            <span>{virtualId.number}</span>
          </div>
          <div className="chips">
            <div className="chip"><em>Domain</em>{intern.domain}</div>
            <div className="chip"><em>Mentor</em>{mentor || 'Not assigned yet'}</div>
            <div className="chip">
              <em>Duration</em>
              {durationInfo(intern.startDate, intern.endDate).label} · {fmt(intern.startDate)} – {fmt(intern.endDate)}
            </div>
          </div>
          <button className="btn btn-d" onClick={() => setLogoutOpen(true)}>
            <Icon name="out" />
            <span>Logout</span>
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <h2>Log out?</h2>
        <p className="sub">You’ll need to sign in again to access your dashboard.</p>
        <div className="acts">
          <button className="btn btn-g" onClick={() => setLogoutOpen(false)}>Stay signed in</button>
          <button className="btn btn-p" onClick={confirmLogout}>Log out</button>
        </div>
      </Modal>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <InternProvider>
      <Shell />
    </InternProvider>
  )
}
