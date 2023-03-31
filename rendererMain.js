let counter = -1

const activityElement = document.getElementById('activity')
const button = document.getElementById('btn')
button.textContent = counter

button.addEventListener('click', () => {
    counter += 1
    button.textContent = counter
})

window.electronAPI.onUpdateActivity((event, value) => {
    activityElement.innerText = value
})