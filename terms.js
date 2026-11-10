const termsVersion = "1";
const acceptanceKey = `travelx-terms-accepted-${termsVersion}`;
const form = document.querySelector("#terms-form");
const checkbox = document.querySelector("#agree-terms");
const continueButton = document.querySelector("#continue-button");
const errorMessage = document.querySelector("#terms-error");

if (localStorage.getItem(acceptanceKey) === "yes") {
  window.location.replace("/frontend/index.html");
}

checkbox.addEventListener("change", () => {
  continueButton.disabled = !checkbox.checked;
  errorMessage.textContent = "";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!checkbox.checked) {
    errorMessage.textContent = "Please agree before continuing.";
    return;
  }
  localStorage.setItem(acceptanceKey, "yes");
  window.location.assign("/frontend/index.html");
});
