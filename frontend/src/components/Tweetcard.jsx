import React, {useState, useEffect} from 'react'

function Tweetcard({tweet}) {
  


    if(!tweet){
      return <p className='text-white'>Loading...</p>
    }
    
  return (
    <div className='flex text-white bg-[#1E1E1E] gap-3 rounded-2xl p-5 w-140 m-10'>
      <div className='flex flex-col items-start'>
        <div className='flex gap-3'>
          <p className='text-lg font-semibold'>{tweet.author.name}</p>
          <p className='text-[#808080]'>@{tweet.author.userName}</p>
          <p className='text-[#808080]'>{tweet.createdAt}</p>
        </div>
        <p className='text-sm text-left text-[#EAEAEA] mt-1.5'>{tweet.text}</p>
      </div>
    </div>
  )
}

export default Tweetcard