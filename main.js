import axios from 'axios'

const alertTreshold = 0.01 //Temp value for testing, final value maybe 0.5?

const formatTime = (timestamp) => {
  //Miinustetaan 3 tuntia millisekunneissa, koska timestamp oletetaan olevan utc mutta se on suomen ajassa
  //Date lisää siihen paikallisen timezonen eli Suomen +3h, jolloin getHours antaa väärän ajan. Toimii vain kesäajassa...
  const date = new Date(timestamp - 10800000)
  console.log('date:', date)
  return date.getHours() + ":" + date.getMinutes()
}

const main = async () => {
  const response = await axios.get('https://www.ilmatieteenlaitos.fi/revontulet-ja-avaruussaa', {
    //Query URL without using browser cache
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
  
  const responseBody = response.data //html+javascript response which includes the data we want
  var data = responseBody.split('NUR\\\":{\\\"dataSeries\\\":') //Split response string starting from the position where the data we are interested in begins
  data = data[1].split('},', 1) //Split again where the data we want ends, discarding everything after it
  data = JSON.parse(data[0]) //Transform string to a javascript object. Now we have our data in an array.
  
  var time = formatTime(data[data.length - 1][0])
  const activity = data[data.length - 1][1]
  console.log(data[data.length - 1])
  console.log(time, activity)

  if (activity >= alertTreshold) {
    const notificationText = `Revontulet todennäköisiä. Aktiivisuus klo ${time} ${activity} nT`
    console.log(notificationText)
  }
}

main()