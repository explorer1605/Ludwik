import React from 'react'

function Navbar() {
    const links = [
        { name: "Market", href: "#market" },
        { name: "Latest Tweets", href: "#latesttweets" },
        { name: "GitHub", href: "#github" },
    ]
  return (
    <nav className='bg-black text-white rounded-full max-w-fit mx-auto  border border-amber-50'>
        <div className='flex justify-center items-center text-lg '>
            {links.map((link) => (
          <a key={link.name} href={link.href}
            className="flex items-center justify-center px-6 py-3 rounded-full transition-all duration-300 hover:bg-linear-to-b  hover:from-[#2d2f45] hover:to-[#1f2133]">
            {link.name}
          </a>
        ))}
        </div>
    </nav>
  )
}

export default Navbar
