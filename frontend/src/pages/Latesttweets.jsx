import React, {useState, useEffect} from 'react'
import Tweetcard from '../components/Tweetcard' 

function Latesttweets() {
  const [tweetData, setTweetData] = useState([]);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/last-tweets"
        )
        if(!response.ok){
          throw new Error("Failed to fetch tweets");
        }
        const data = await response.json()
        setTweetData(data)
      } catch (error) {
        console.log(error);
      }
    }
    fetchTweets();
  }, []);
    

  return (
    <div className='flex justify-center items-center'>
      {tweetData.map((tweet, index) => (
        <Tweetcard key={index} tweet={tweet} />
      ))}
    </div>
  );
}

export default Latesttweets