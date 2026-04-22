import { NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="flex justify-between items-center border-b border-[rgba(255,255,255,0.07)] px-[40px] py-[10px]">
      <h1 className="text-[#f0f2f7] text-[1.6rem]">SportsView</h1>
      <nav>
        <NavLink to="/" className={({ isActive }) => isActive 
            ? 'text-[#3b82f6] mx-[5px] bg-[rgba(59,130,246,0.12)] py-[10px] px-[15px] rounded-[5px]'
            : 'text-[#f0f2f7] mx-[5px] py-[10px] px-[15px] rounded-[5px] nav-link'
          }>
            Home
        </NavLink>
        <NavLink to="/leagues" className={({ isActive }) => isActive
            ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.12)] mx-[5px] py-[10px] px-[15px] rounded-[5px]'
            : 'text-[#f0f2f7] mx-[5px] py-[10px] px-[15px] rounded-[5px] nav-link'
          }>
            Leagues
        </NavLink>
        <NavLink to="/myteams" className={({ isActive }) => isActive
              ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.12)] mx-[5px] py-[10px] px-[15px] rounded-[5px]'
              : 'text-[#f0f2f7] mx-[5px] py-[10px] px-[15px] rounded-[5px] nav-link'
          }>
            My Teams
        </NavLink>
      </nav>
    </header>
  )
}