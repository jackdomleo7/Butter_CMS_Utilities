const privacyModal = document.getElementById('privacyModal');

function openPrivacyModal() {
  privacyModal.showModal();
}

function closePrivacyModal() {
  privacyModal.close();
}

privacyModal.addEventListener('click', function(event) {
  const rect = privacyModal.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    closePrivacyModal();
  }
});