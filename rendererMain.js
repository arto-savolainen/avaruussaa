const activityElement = document.getElementById('activity')
const intervalInput = document.getElementById('interval-input')
const tresholdInput = document.getElementById('treshold-input')

let notificationInterval
let notificationTreshold

// Receive updated activity value from main process
updateActivityColor = () => {
  const activity = activityElement.innerText
  console.log('in updateActivityColor, activity:', activity)

  // If activity is at or above treshold, color the displayed value red
  if (activity >= notificationTreshold) {
    activityElement.style.color = 'rgb(235, 53, 53)'
  }
  else {
    // Else color it blue
    activityElement.style.color = 'rgb(23, 23, 252)'
  }
}

// Receive UI configuration data from main process and initialize values
window.electronAPI.onSetUIConfiguration((event, config) => {
  console.log('in onSetUIConfiguration, config:', config)
  notificationInterval = config.notificationInterval
  console.log('notificationInterval:', notificationInterval, 'config.notificatioInterval:', config.notificationInterval)
  notificationTreshold = config.notificationTreshold
  intervalInput.value = notificationInterval
  console.log('intervalInput.value:', intervalInput.value, 'intervalInput.innerText', intervalInput.innerText)
  tresholdInput.value = notificationTreshold
})

// Receive updated activity value from main process
window.electronAPI.onUpdateActivity((event, activity) => {
  console.log('in onUpdateActivity, activity:', activity)
  activityElement.innerText = activity
  updateActivityColor()
})

// ------------------ EVENT LISTENERS FOR interval-input -------------------


// Clear input box when user clicks on it
intervalInput.addEventListener('click', (event) => {
  intervalInput.value = ''
})

// Save last valid input when user clicks outside of the interval input element
intervalInput.addEventListener('focusout', (event) => {
  intervalInput.value = notificationInterval
})

// Limit length of text in interval input to 5 characters and prevent whitespace
intervalInput.addEventListener('input', (event) => {
  intervalInput.value = event.target.value.trim()

  if (event.target.value.length > 5) {
    intervalInput.value = event.target.value.substr(0, 5)
  }
})

// Validate that user input for the interval input element is a number
intervalInput.addEventListener('change', (event) => {
  if (isNaN(event.target.value) || isNaN(parseFloat(event.target.value))  || event.target.value < 0) {
    intervalInput.value = notificationInterval
  }
  else {
    notificationInterval = event.target.value.trim()
    window.electronAPI.setNotificationInterval(notificationInterval)
  }
})

// Lose focus on interval input if user presses enter or esc.
intervalInput.addEventListener("keydown", (event) => {
  if (event.key === 'Enter' || event.key === 'Escape') {
    intervalInput.blur()
  }
})

// ------------------ EVENT LISTENERS FOR treshold-input -------------------


// Clear input box when user clicks on it
tresholdInput.addEventListener('click', (event) => {
  tresholdInput.value = ''
})

// Save last valid input when user clicks outside of the interval input element
tresholdInput.addEventListener('focusout', (event) => {
  tresholdInput.value = notificationTreshold
})

// Limit length of text in interval input to 5 characters and prevent whitespace
tresholdInput.addEventListener('input', (event) => {
  tresholdInput.value = event.target.value.trim()

  if (event.target.value.length > 5) {
    tresholdInput.value = event.target.value.substr(0, 5)
  }
})

// Validate that user input for the interval input element is a positive number
tresholdInput.addEventListener('change', (event) => {
  if (isNaN(event.target.value) || isNaN(parseFloat(event.target.value)) || event.target.value < 0) {
    tresholdInput.value = notificationTreshold
  }
  else {
    notificationTreshold = event.target.value.trim()
    window.electronAPI.setNotificationTreshold(notificationTreshold)
    updateActivityColor()
  }
})

// Lose focus on interval input if user presses enter or esc.
tresholdInput.addEventListener("keydown", (event) => {
  if (event.key === 'Enter' || event.key === 'Escape') {
    tresholdInput.blur()
  }
})


// Tried to make a universal function for setting the event listeners of input boxes but couldn't get this to work.
// Would need to pass the interval / treshold variables as reference, which is not possible for primitives in javascript
// Could use an array or object that contains both to pass by reference, but that's too hacky.

// const setEventListeners = (element, lastValid, ipcCall) => {
//   // lastValid.valueOf = lastValid.toSource = lastValid.toString = () => { return val }

//   // Clear input box when user clicks on it
//   element.addEventListener('click', (event) => {
//     element.value = ''
//   })

//   // Save last valid input when user clicks outside of the input box
//   element.addEventListener('focusout', (event) => {
//     element.value = lastValid
//   })

//   // Limit length of text in input box to 5 characters and prevent whitespace
//   element.addEventListener('input', (event) => {
//     element.value = event.target.value.trim()

//     if (event.target.value.length > 5) {
//       element.value = event.target.value.substr(0, 5)
//     }
//   })

//   // Validate that user input for the element is a number
//   element.addEventListener('change', (event) => {
//     if (isNaN(event.target.value) || isNaN(parseFloat(event.target.value))) {
//       element.value = lastValid
//     }
//     else {
//       lastValid = event.target.value.trim()
//       ipcCall(lastValid)

//       // If user inputs a new treshold value, update activity element color as appropriate
//       if (event.target.id == 'treshold-input') {
//         console.log('lastValid:', lastValid)
//         console.log('notificatioNTreshold:', notificationTreshold)
//         updateActivityColor()
//       }
//     }
//   })

//   // Lose focus on element if user presses enter or esc.
//   element.addEventListener("keydown", (event) => {
//     if (event.key === 'Enter' || event.key === 'Escape') {
//       element.blur()
//     }
//   })
// }

// setEventListeners(intervalInput, notificationInterval, window.electronAPI.setNotificationInterval)
// setEventListeners(tresholdInput, notificationTreshold, window.electronAPI.setNotificationTreshold)