import { useContext, useEffect, useState } from 'react'
import { TailSpin } from 'react-loader-spinner'
import { TokenContext } from '../hooks/TokenContext'
import StudyItemContainer from '../components/StudyItemContainer'

export default function Saves(){
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState([])
    const {token} = useContext(TokenContext)

    useEffect(()=>{
        const getSaves = async()=>{
            const res = await fetch("http://127.0.0.1:5000/users/saves", {
              method: "GET", // Use the appropriate HTTP method
              headers: {
                  "Authorization": `Bearer ${token}`, // Attach the Bearer token
              },
          });
          const data = await res.json()
          console.log(data)
          setItems(data.saved_tests)
        }


        getSaves()
    }, [])

    const itemMapped = items.map((item)=><StudyItemContainer title={item.test.name} type={item.test.type} creator={item.creator.username} profileImg={item.creator.img_url} key={item.test.id} id={item.test.id}/>)
    return(<>
    <h1>Saves</h1>

    <div id="itemsContainer">
                {
                    loading ? (
                                      <div className="homeLoadingContainer">
                                          <TailSpin   visible={true} height="40" width="40" color={getComputedStyle(root).getPropertyValue('--secondary-text-color').trim()} ariaLabel="tail-spin-loading" radius="1" wrapperStyle={{}} wrapperClass="loader" />
                                          
                                      </div>
                                ) : itemMapped.length == 0 ? <p className="homeLoadingContainer">No items available</p> : itemMapped
                }
            </div>
    </>)
}