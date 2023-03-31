const activityElement = document.getElementById('activity')

window.electronAPI.onUpdateActivity((event, value) => {
    activityElement.innerText = value
})