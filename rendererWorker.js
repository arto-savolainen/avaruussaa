const axios = require('axios')

const getData = async () => {
  const alertTreshold = 0.001 // Test value, final value maybe 0.5?

  try {
    const response = await axios.get('https://www.ilmatieteenlaitos.fi/revontulet-ja-avaruussaa', {
      //Query URL without using browser cache
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }


  const responseBody = response.data // html+javascript response which includes the data we want
  var data = responseBody.split('NUR\\\":{\\\"dataSeries\\\":') // Split response string starting from the position where the data we are interested in begins
  data = data[1].split('},', 1) // Split again where the data we want ends, discarding everything after it
  data = JSON.parse(data[0]) // Transform string to a javascript object. Now we have our data in an array.

  // var time = formatTime(data[data.length - 1][0]) // if we need to display time
  const time = new Date(data[data.length - 1][0]) //temp
  const activity = data[data.length - 1][1]
  console.log(data[data.length - 1])
  console.log(time, activity)

  return activity

  // if (activity >= alertTreshold) {
  //   const notificationText = `Revontulet todennäköisiä. Aktiivisuus ${activity} nT`
  //   console.log(notificationText)
  // }
}

const dataFetchLoop = async () => {
  const activity = await getData()

  window.electronAPI.send('get-data', activity)

}

dataFetchLoop()
