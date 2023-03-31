const activityElement = document.getElementById('activity')

window.electronAPI.onUpdateActivity((_event, value) => {
    activityElement.innerText = value
})